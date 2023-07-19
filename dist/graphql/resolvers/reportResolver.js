"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const balanceSheet_1 = __importDefault(require("../../functions/balanceSheet"));
const department_1 = __importDefault(require("../../models/department"));
const generalJournal_1 = __importDefault(require("../../models/generalJournal"));
const chartOfAccount_1 = __importDefault(require("../../models/chartOfAccount"));
const mongoose_1 = __importDefault(require("mongoose"));
const moment_1 = __importDefault(require("moment"));
const getBalanceByChartAccount_1 = __importDefault(require("../../functions/getBalanceByChartAccount"));
const reportResolver = {
    Query: {
        balanceSheetReport: async (_root, { fromDate, toDate }) => {
            try {
                const getBalanceSheetAsset = await (0, balanceSheet_1.default)(['Cash on hand', 'Cash in bank', 'Account Receivable', 'Inventory', 'Fixed Assets'], fromDate, toDate);
                const getBalanceSheetLiability = await (0, balanceSheet_1.default)(['Account Payable'], fromDate, toDate);
                const getBalanceSheetEquity = await (0, balanceSheet_1.default)(['Revenues', 'Cost', 'Expenditures', 'Capitals'], fromDate, toDate);
                const total_asset_balance = getBalanceSheetAsset.length > 0 ? getBalanceSheetAsset.map(e => e.total_balance).reduce((a, b) => a + b, 0) : 0;
                const total_liability_balance = getBalanceSheetLiability.length > 0 ? getBalanceSheetLiability.map(e => e.total_balance).reduce((a, b) => a + b, 0) : 0;
                const total_equity_balance = getBalanceSheetEquity.length > 0 ? getBalanceSheetEquity.map(e => e.total_balance).reduce((a, b) => a + b, 0) : 0;
                const balanceSheetData = {
                    asset: getBalanceSheetAsset,
                    total_asset: total_asset_balance,
                    liability: getBalanceSheetLiability,
                    total_liability: total_liability_balance,
                    equity: getBalanceSheetEquity,
                    total_equity: total_equity_balance,
                    total_liability_and_equity: total_liability_balance + total_equity_balance
                };
                return balanceSheetData;
            }
            catch (error) {
            }
        },
        incomeStatementReport: async (_root, { department_id, fromDate, toDate, form }) => {
            try {
                let selected_date = {};
                let year_to_date = {};
                if (fromDate && toDate) {
                    const startDate = new Date(`${fromDate}T00:00:00.000Z`);
                    const endDate = new Date(`${toDate}T16:59:59.999Z`);
                    selected_date = { record_date: { $gte: startDate, $lte: endDate } };
                    const startYearToDate = new Date(`${(0, moment_1.default)().format("YYYY-01-01")}T00:00:00.000Z`);
                    year_to_date = { record_date: { $gte: startYearToDate, $lte: endDate } };
                }
                const departments = await department_1.default.find({ _id: { $ne: '64a52c65ad409eb75c87d8e1' } });
                if (department_id === "64a52c65ad409eb75c87d8e1") {
                    let summmaryByDepartment = (accountType, increase) => {
                        const findSummmary = Promise.all(departments.map(async (element) => {
                            const findAccount = await chartOfAccount_1.default.find({
                                $and: [
                                    { account_type: accountType },
                                    { department_id: element._id }
                                ]
                            });
                            const allAccount = findAccount.map(e => e._id);
                            const findSelectedDateBalance = await generalJournal_1.default.aggregate([
                                { $unwind: "$journal_entries" },
                                { $match: selected_date },
                                { $match: { "journal_entries.chart_account_id": { $in: allAccount } } },
                                {
                                    $group: {
                                        _id: null,
                                        total_debit: { $sum: "$journal_entries.debit" },
                                        total_credit: { $sum: "$journal_entries.credit" },
                                    }
                                },
                            ]);
                            let selectedDateBalance = findSelectedDateBalance.length > 0 ? findSelectedDateBalance[0].total_credit - findSelectedDateBalance[0].total_debit : 0;
                            if (increase === "Debit") {
                                selectedDateBalance = findSelectedDateBalance.length > 0 ? findSelectedDateBalance[0].total_debit - findSelectedDateBalance[0].total_credit : 0;
                            }
                            const findYearToDateBalance = await generalJournal_1.default.aggregate([
                                { $unwind: "$journal_entries" },
                                { $match: year_to_date },
                                { $match: { "journal_entries.chart_account_id": { $in: allAccount } } },
                                {
                                    $group: {
                                        _id: null,
                                        total_debit: { $sum: "$journal_entries.debit" },
                                        total_credit: { $sum: "$journal_entries.credit" },
                                    }
                                },
                            ]);
                            let yearToDateBalance = findYearToDateBalance.length > 0 ? findYearToDateBalance[0].total_credit - findYearToDateBalance[0].total_debit : 0;
                            if (increase === "Debit") {
                                yearToDateBalance = findYearToDateBalance.length > 0 ? findYearToDateBalance[0].total_debit - findYearToDateBalance[0].total_credit : 0;
                            }
                            return {
                                account_name: element.department_name,
                                selectedDateBalance: selectedDateBalance,
                                yearToDateBalance: yearToDateBalance
                            };
                        }));
                        return findSummmary;
                    };
                    const allExpenseAccount = await chartOfAccount_1.default.aggregate([
                        { $match: { account_type: "Expenditures" } },
                        {
                            $group: {
                                _id: "$expense_type_id",
                            }
                        },
                        {
                            $lookup: {
                                from: "expensetypes",
                                localField: "_id",
                                foreignField: "_id",
                                as: "expense_type"
                            }
                        },
                        { $unwind: "$expense_type" },
                        { $sort: { "expense_type.createdAt": 1 } },
                        {
                            $project: {
                                expense_name: "$expense_type.expense_name"
                            }
                        }
                    ]);
                    const expenseByChartAccount = Promise.all(allExpenseAccount.map(async (element) => {
                        if (element !== null) {
                            const findExpenseSelectedDate = await generalJournal_1.default.aggregate([
                                { $match: selected_date },
                                { $unwind: "$journal_entries" },
                                {
                                    $lookup: {
                                        from: "chartofaccounts",
                                        localField: "journal_entries.chart_account_id",
                                        foreignField: "_id",
                                        as: "chart_account"
                                    }
                                },
                                { $unwind: "$chart_account" },
                                { $match: { "chart_account.account_type": "Expenditures" } },
                                { $match: { "chart_account.expense_type_id": element._id } },
                                {
                                    $group: {
                                        _id: null,
                                        total_debit: { $sum: "$journal_entries.debit" },
                                        total_credit: { $sum: "$journal_entries.credit" },
                                    }
                                },
                            ]);
                            const expenseSelectedDate = findExpenseSelectedDate.length > 0 ? findExpenseSelectedDate[0].total_debit - findExpenseSelectedDate[0].total_credit : 0;
                            const findExpenseYearToDate = await generalJournal_1.default.aggregate([
                                { $match: selected_date },
                                { $unwind: "$journal_entries" },
                                {
                                    $lookup: {
                                        from: "chartofaccounts",
                                        localField: "journal_entries.chart_account_id",
                                        foreignField: "_id",
                                        as: "chart_account"
                                    }
                                },
                                { $unwind: "$chart_account" },
                                { $match: { "chart_account.account_type": "Expenditures" } },
                                { $match: { "chart_account.expense_type_id": element._id } },
                                {
                                    $group: {
                                        _id: null,
                                        total_debit: { $sum: "$journal_entries.debit" },
                                        total_credit: { $sum: "$journal_entries.credit" },
                                    }
                                },
                            ]);
                            const expenseYearToDate = findExpenseYearToDate.length > 0 ? findExpenseYearToDate[0].total_debit - findExpenseYearToDate[0].total_credit : 0;
                            return {
                                account_name: element.expense_name,
                                selectedDateBalance: expenseSelectedDate,
                                yearToDateBalance: expenseYearToDate
                            };
                        }
                    }));
                    const revenues = await summmaryByDepartment("Revenues", "Credit");
                    const totalRevenueSelectedDate = revenues.map(e => e.selectedDateBalance).reduce((a, b) => a + b, 0);
                    const totalRevenueYearToDate = revenues.map(e => e.yearToDateBalance).reduce((a, b) => a + b, 0);
                    const costOfSales = await summmaryByDepartment("Cost", "Debit");
                    const totalCostSelectedDate = costOfSales.map(e => e.selectedDateBalance).reduce((a, b) => a + b, 0);
                    const totalCostYearToDate = costOfSales.map(e => e.yearToDateBalance).reduce((a, b) => a + b, 0);
                    let expense = [{}];
                    let totalExpenseSelectedDate = 0;
                    let totalexpenseYearToDate = 0;
                    if (form === '1') {
                        expense = await expenseByChartAccount;
                        totalExpenseSelectedDate = expense.map((e) => e.selectedDateBalance).reduce((a, b) => a + b, 0);
                        totalexpenseYearToDate = expense.map((e) => e.yearToDateBalance).reduce((a, b) => a + b, 0);
                    }
                    else {
                        expense = await summmaryByDepartment("Expenditures", "Debit");
                        totalExpenseSelectedDate = expense.map((e) => e.selectedDateBalance).reduce((a, b) => a + b, 0);
                        totalexpenseYearToDate = expense.map((e) => e.yearToDateBalance).reduce((a, b) => a + b, 0);
                    }
                    const grossProfitSelectedDateBalance = totalRevenueSelectedDate - totalCostSelectedDate;
                    const grossProfitYearToDateBalance = totalRevenueYearToDate - totalCostYearToDate;
                    const netIncomeSelectedDateBalance = grossProfitSelectedDateBalance - totalExpenseSelectedDate;
                    const netIncomeYearToDateBalance = grossProfitYearToDateBalance - totalexpenseYearToDate;
                    return {
                        revenues: revenues,
                        totalRevenue: {
                            selectedDateBalance: totalRevenueSelectedDate,
                            yearToDateBalance: totalRevenueYearToDate
                        },
                        costOfSales: costOfSales,
                        totalCost: {
                            selectedDateBalance: totalCostSelectedDate,
                            yearToDateBalance: totalCostYearToDate
                        },
                        expenses: expense,
                        totalExpense: {
                            selectedDateBalance: totalExpenseSelectedDate,
                            yearToDateBalance: totalexpenseYearToDate
                        },
                        grossProfit: {
                            selectedDateBalance: grossProfitSelectedDateBalance,
                            yearToDateBalance: grossProfitYearToDateBalance
                        },
                        netIncome: {
                            selectedDateBalance: netIncomeSelectedDateBalance,
                            yearToDateBalance: netIncomeYearToDateBalance
                        }
                    };
                }
                else {
                    let summmaryByDepartment = async (accountType, increase) => {
                        const findAccount = await chartOfAccount_1.default.aggregate([
                            { $match: { account_type: accountType } },
                            { $match: { department_id: new mongoose_1.default.Types.ObjectId(department_id) } },
                            {
                                $project: {
                                    account_name: 1,
                                    is_parents: 1
                                }
                            },
                            { $sort: { createdAt: 1 } }
                        ]);
                        const findSummmary = Promise.all(findAccount.map(async (element) => {
                            console.log(element, "element");
                            const findSelectedDateBalance = await generalJournal_1.default.aggregate([
                                { $unwind: "$journal_entries" },
                                { $match: selected_date },
                                { $match: { "journal_entries.chart_account_id": element._id } },
                                {
                                    $group: {
                                        _id: null,
                                        total_debit: { $sum: "$journal_entries.debit" },
                                        total_credit: { $sum: "$journal_entries.credit" },
                                    }
                                },
                            ]);
                            let selectedDateBalance = findSelectedDateBalance.length > 0 ? findSelectedDateBalance[0].total_credit - findSelectedDateBalance[0].total_debit : 0;
                            if (increase === "Debit") {
                                selectedDateBalance = findSelectedDateBalance.length > 0 ? findSelectedDateBalance[0].total_debit - findSelectedDateBalance[0].total_credit : 0;
                            }
                            const findYearToDateBalance = await generalJournal_1.default.aggregate([
                                { $unwind: "$journal_entries" },
                                { $match: year_to_date },
                                { $match: { "journal_entries.chart_account_id": element._id } },
                                {
                                    $group: {
                                        _id: null,
                                        total_debit: { $sum: "$journal_entries.debit" },
                                        total_credit: { $sum: "$journal_entries.credit" },
                                    }
                                },
                            ]);
                            let yearToDateBalance = findYearToDateBalance.length > 0 ? findYearToDateBalance[0].total_credit - findYearToDateBalance[0].total_debit : 0;
                            if (increase === "Debit") {
                                yearToDateBalance = findYearToDateBalance.length > 0 ? findYearToDateBalance[0].total_debit - findYearToDateBalance[0].total_credit : 0;
                            }
                            return {
                                account_name: element.account_name,
                                is_parents: element.is_parents,
                                selectedDateBalance: selectedDateBalance,
                                yearToDateBalance: yearToDateBalance
                            };
                        }));
                        const getSummary = await findSummmary;
                        const findOtherSelectedDateBalance = getSummary.filter((e) => e.is_parents === true).map((e) => e.selectedDateBalance).reduce((a, b) => a + b, 0);
                        const findOtherYearToDateBalance = getSummary.filter((e) => e.is_parents === true).map((e) => e.yearToDateBalance).reduce((a, b) => a + b, 0);
                        const prepareData = [];
                        getSummary.map((e) => {
                            if (e.is_parents === false) {
                                prepareData.push({
                                    account_name: e.account_name,
                                    selectedDateBalance: e.selectedDateBalance,
                                    yearToDateBalance: e.yearToDateBalance
                                });
                            }
                        });
                        prepareData.push({
                            account_name: "Other",
                            selectedDateBalance: findOtherSelectedDateBalance,
                            yearToDateBalance: findOtherYearToDateBalance
                        });
                        return prepareData;
                    };
                    const revenues = await summmaryByDepartment("Revenues", "Credit");
                    const totalRevenueSelectedDate = revenues.map(e => e.selectedDateBalance).reduce((a, b) => a + b, 0);
                    const totalRevenueYearToDate = revenues.map(e => e.yearToDateBalance).reduce((a, b) => a + b, 0);
                    const costOfSales = await summmaryByDepartment("Cost", "Debit");
                    const totalCostSelectedDate = costOfSales.map(e => e.selectedDateBalance).reduce((a, b) => a + b, 0);
                    const totalCostYearToDate = costOfSales.map(e => e.yearToDateBalance).reduce((a, b) => a + b, 0);
                    const expense = await summmaryByDepartment("Expenditures", "Debit");
                    const totalExpenseSelectedDate = expense.map((e) => e.selectedDateBalance).reduce((a, b) => a + b, 0);
                    const totalexpenseYearToDate = expense.map((e) => e.yearToDateBalance).reduce((a, b) => a + b, 0);
                    const grossProfitSelectedDateBalance = totalRevenueSelectedDate - totalCostSelectedDate;
                    const grossProfitYearToDateBalance = totalRevenueYearToDate - totalCostYearToDate;
                    const netIncomeSelectedDateBalance = grossProfitSelectedDateBalance - totalExpenseSelectedDate;
                    const netIncomeYearToDateBalance = grossProfitYearToDateBalance - totalexpenseYearToDate;
                    return {
                        revenues: revenues,
                        totalRevenue: {
                            selectedDateBalance: totalRevenueSelectedDate,
                            yearToDateBalance: totalRevenueYearToDate
                        },
                        costOfSales: costOfSales,
                        totalCost: {
                            selectedDateBalance: totalCostSelectedDate,
                            yearToDateBalance: totalCostYearToDate
                        },
                        expenses: expense,
                        totalExpense: {
                            selectedDateBalance: totalExpenseSelectedDate,
                            yearToDateBalance: totalexpenseYearToDate
                        },
                        grossProfit: {
                            selectedDateBalance: grossProfitSelectedDateBalance,
                            yearToDateBalance: grossProfitYearToDateBalance
                        },
                        netIncome: {
                            selectedDateBalance: netIncomeSelectedDateBalance,
                            yearToDateBalance: netIncomeYearToDateBalance
                        }
                    };
                }
            }
            catch (error) {
            }
        },
        generalLedgerReport: async (_root, { fromDate, toDate }) => {
            try {
                let selected_date = {};
                if (fromDate && toDate) {
                    const startDate = new Date(`${fromDate}T00:00:00.000Z`);
                    const endDate = new Date(`${toDate}T16:59:59.999Z`);
                    selected_date = { record_date: { $gte: startDate, $lte: endDate } };
                }
                const getParentsChartAccount = await chartOfAccount_1.default.find({
                    $and: [
                        { is_top_parents: true },
                        { department_id: '64a52c65ad409eb75c87d8e1' },
                    ]
                });
                const getAccountByType = await chartOfAccount_1.default.find({
                    $and: [
                        { department_id: '64a52c65ad409eb75c87d8e1' },
                    ]
                });
                const findBalanceOfChartAccount = Promise.all(getAccountByType.map(async (element) => {
                    const findBalance = await (0, getBalanceByChartAccount_1.default)(element._id.toString(), fromDate, toDate);
                    return {
                        _id: element._id,
                        account_name: element.account_name,
                        total_debit: findBalance.total_debit,
                        total_credit: findBalance.total_credit,
                        total_balance: findBalance.total_balance
                    };
                }));
                const ChartAccountWithBalance = await findBalanceOfChartAccount;
                const generateBalanceTreeData = (chartAccountInfo, chartAccountWithBalance) => {
                    let chart_account_tree_data = { ...chartAccountInfo };
                    console.log(chart_account_tree_data, "chart_account_tree_data");
                    const findBalanceByAccountId = chartAccountWithBalance.find(e => e._id + "" === chartAccountInfo._id + "");
                    if (findBalanceByAccountId) {
                        chart_account_tree_data.total_balance = findBalanceByAccountId.total_balance;
                        chart_account_tree_data.total_credit = findBalanceByAccountId.total_credit;
                        chart_account_tree_data.total_debit = findBalanceByAccountId.total_debit;
                    }
                    if (chart_account_tree_data.sub_account.length > 0) {
                        chart_account_tree_data.sub_account.map(async (element) => {
                            generateBalanceTreeData(element, chartAccountWithBalance);
                        });
                    }
                    return chart_account_tree_data;
                };
                const generateBalanceSheet = getParentsChartAccount.map(element => {
                    const generateElement = generateBalanceTreeData(element, ChartAccountWithBalance);
                    return generateElement;
                });
            }
            catch (error) {
            }
        }
    }
};
exports.default = reportResolver;
