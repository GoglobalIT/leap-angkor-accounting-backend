"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const generalJournal_1 = __importDefault(require("../../models/generalJournal"));
const chartOfAccount_1 = __importDefault(require("../../models/chartOfAccount"));
const mongoose_1 = __importDefault(require("mongoose"));
const getBalanceByChartAccount_1 = __importDefault(require("../../functions/getBalanceByChartAccount"));
const dashboardResolver = {
    Query: {
        getSummaryIncomeStatment: async (_root, { department_id, fromDate, toDate }) => {
            try {
                let selected_date = {};
                if (fromDate && toDate) {
                    const startDate = new Date(`${fromDate}T00:00:00.000Z`);
                    const endDate = new Date(`${toDate}T16:59:59.999Z`);
                    selected_date = { record_date: { $gte: startDate, $lte: endDate } };
                }
                if (department_id === "64a52c65ad409eb75c87d8e1") {
                    let summaryAllDepartment = async (accountType, increase) => {
                        const findSelectedDateBalance = await generalJournal_1.default.aggregate([
                            { $match: { isDeleted: false } },
                            { $match: selected_date },
                            { $unwind: "$journal_entries" },
                            {
                                $lookup: {
                                    from: "chartofaccounts",
                                    localField: "journal_entries.chart_account_id",
                                    foreignField: "_id",
                                    as: "chartAccount"
                                }
                            },
                            { $unwind: "$chartAccount" },
                            { $match: { "chartAccount.account_type": accountType } },
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
                        return selectedDateBalance;
                    };
                    const revenues = await summaryAllDepartment("Revenues", "Credit");
                    const costOfSale = await summaryAllDepartment("Cost", "Debit");
                    const expense = await summaryAllDepartment("Expenditures", "Debit");
                    const grossProfit = revenues - costOfSale;
                    const netIncome = grossProfit - expense;
                    return {
                        revenue: revenues,
                        costOfSale: costOfSale,
                        Expense: expense,
                        grossProfit: grossProfit,
                        netIncome: netIncome,
                    };
                }
                else {
                    let summmaryByDepartment = async (accountType, increase) => {
                        const findSelectedDateBalance = await generalJournal_1.default.aggregate([
                            { $match: { isDeleted: false } },
                            { $unwind: "$journal_entries" },
                            { $match: selected_date },
                            {
                                $lookup: {
                                    from: "chartofaccounts",
                                    localField: "journal_entries.chart_account_id",
                                    foreignField: "_id",
                                    as: "chartAccount"
                                }
                            },
                            { $unwind: "$chartAccount" },
                            { $match: { "chartAccount.department_id": new mongoose_1.default.Types.ObjectId(department_id) } },
                            { $match: { "chartAccount.account_type": accountType } },
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
                        return selectedDateBalance;
                    };
                    const revenues = await summmaryByDepartment("Revenues", "Credit");
                    const costOfSale = await summmaryByDepartment("Cost", "Debit");
                    const expense = await summmaryByDepartment("Expenditures", "Debit");
                    const grossProfit = revenues - costOfSale;
                    const netIncome = grossProfit - expense;
                    return {
                        revenue: revenues,
                        costOfSale: costOfSale,
                        Expense: expense,
                        grossProfit: grossProfit,
                        netIncome: netIncome,
                    };
                }
            }
            catch (error) {
            }
        },
        getCash: async (_root, { department_id, fromDate, toDate }) => {
            try {
                const getCashOnHand = await chartOfAccount_1.default.find({
                    $and: [
                        { account_type: 'Cash on hand' },
                        { is_parents: true }
                    ]
                });
                let totalCashOnHand = 0;
                if (getCashOnHand.length > 0) {
                    const totalBalance = Promise.all(getCashOnHand.map(async (element) => {
                        const getBalance = await (0, getBalanceByChartAccount_1.default)(element._id.toString(), fromDate, toDate);
                        return getBalance.total_balance;
                    }));
                    totalCashOnHand = (await totalBalance).reduce((a, b) => a + b, 0);
                }
                const getCashInBank = await chartOfAccount_1.default.find({
                    $and: [
                        { account_type: 'Cash in bank' },
                        { is_parents: true }
                    ]
                });
                let totalCashInBank = 0;
                if (getCashInBank.length > 0) {
                    const totalBalance = Promise.all(getCashInBank.map(async (element) => {
                        const getBalance = await (0, getBalanceByChartAccount_1.default)(element._id.toString(), fromDate, toDate);
                        return getBalance.total_balance;
                    }));
                    totalCashInBank = (await totalBalance).reduce((a, b) => a + b, 0);
                }
                return {
                    cashOnHand: totalCashOnHand,
                    cashInBank: totalCashInBank
                };
            }
            catch (error) {
            }
        },
        getARandAP: async (_root, { department_id, fromDate, toDate }) => {
            try {
                const currentYear = fromDate ? Number((fromDate.split("-", 1))[0]) : new Date().getFullYear();
                const monthInYear = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
                const findARandAp = Promise.all(monthInYear.map(async (element, index) => {
                    const monthInYearString = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const findAR = await generalJournal_1.default.aggregate([
                        { $match: { isDeleted: false } },
                        { $addFields: { year: { $year: { date: "$record_date", timezone: "Asia/Bangkok" } } } },
                        { $addFields: { month: { $month: { date: "$record_date", timezone: "Asia/Bangkok" } } } },
                        { $match: { year: currentYear } },
                        { $match: { month: element } },
                        { $unwind: "$journal_entries" },
                        {
                            $lookup: {
                                from: "chartofaccounts",
                                localField: "journal_entries.chart_account_id",
                                foreignField: "_id",
                                as: "chart_account_info"
                            }
                        },
                        { $unwind: "$chart_account_info" },
                        { $match: { "chart_account_info.account_type": "Account Receivable" } },
                        {
                            $group: {
                                _id: null,
                                total_credit: { $sum: "$journal_entries.credit" },
                                total_debit: { $sum: "$journal_entries.debit" },
                            }
                        },
                        { $addFields: { total_balance: { $subtract: ["$total_debit", "$total_credit"] } } }
                    ]);
                    const ARData = await findAR;
                    const totalBalanceAR = ARData.length === 1 ? ARData[0].total_balance : 0;
                    const findAP = await generalJournal_1.default.aggregate([
                        { $match: { isDeleted: false } },
                        { $addFields: { year: { $year: { date: "$record_date", timezone: "Asia/Bangkok" } } } },
                        { $addFields: { month: { $month: { date: "$record_date", timezone: "Asia/Bangkok" } } } },
                        { $match: { year: currentYear } },
                        { $match: { month: element } },
                        { $unwind: "$journal_entries" },
                        {
                            $lookup: {
                                from: "chartofaccounts",
                                localField: "journal_entries.chart_account_id",
                                foreignField: "_id",
                                as: "chart_account_info"
                            }
                        },
                        { $unwind: "$chart_account_info" },
                        { $match: { "chart_account_info.account_type": "Account Payable" } },
                        {
                            $group: {
                                _id: null,
                                total_credit: { $sum: "$journal_entries.credit" },
                                total_debit: { $sum: "$journal_entries.debit" },
                            }
                        },
                        { $addFields: { total_balance: { $subtract: ["$total_credit", "$total_debit"] } } }
                    ]);
                    const APData = await findAP;
                    const totalBalanceAP = APData.length === 1 ? APData[0].total_balance : 0;
                    return {
                        month: monthInYearString[index],
                        balanceAR: totalBalanceAR,
                        balanceAP: totalBalanceAP,
                    };
                }));
                const getARandAP = await findARandAp;
                return getARandAP;
            }
            catch {
            }
        },
        getExpenseByDepartment: async (_root, { department_id, fromDate, toDate }) => {
            try {
                let selected_date = {};
                if (fromDate && toDate) {
                    const startDate = new Date(`${fromDate}T00:00:00.000Z`);
                    const endDate = new Date(`${toDate}T16:59:59.999Z`);
                    selected_date = { record_date: { $gte: startDate, $lte: endDate } };
                }
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
                        const findSelectedDateBalance = await generalJournal_1.default.aggregate([
                            { $match: { isDeleted: false } },
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
                        return {
                            account_name: element.account_name,
                            is_parents: element.is_parents,
                            selectedDateBalance: selectedDateBalance,
                        };
                    }));
                    const getSummary = await findSummmary;
                    const findOtherSelectedDateBalance = getSummary.filter((e) => e.is_parents === true).map((e) => e.selectedDateBalance).reduce((a, b) => a + b, 0);
                    const prepareData = [];
                    getSummary.map((e) => {
                        if (e.is_parents === false) {
                            prepareData.push({
                                account_name: e.account_name,
                                balance: e.selectedDateBalance,
                            });
                        }
                    });
                    prepareData.push({
                        account_name: "Other Expenditures",
                        balance: findOtherSelectedDateBalance,
                    });
                    return prepareData;
                };
                const getExpense = await summmaryByDepartment("Expenditures", "Debit");
                return getExpense;
            }
            catch (error) {
            }
        },
        getRevenueByDepartment: async (_root, { department_id, fromDate, toDate }) => {
            try {
                let selected_date = {};
                if (fromDate && toDate) {
                    const startDate = new Date(`${fromDate}T00:00:00.000Z`);
                    const endDate = new Date(`${toDate}T16:59:59.999Z`);
                    selected_date = { record_date: { $gte: startDate, $lte: endDate } };
                }
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
                        const findSelectedDateBalance = await generalJournal_1.default.aggregate([
                            { $match: { isDeleted: false } },
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
                        return {
                            account_name: element.account_name,
                            is_parents: element.is_parents,
                            selectedDateBalance: selectedDateBalance,
                        };
                    }));
                    const getSummary = await findSummmary;
                    const findOtherSelectedDateBalance = getSummary.filter((e) => e.is_parents === true).map((e) => e.selectedDateBalance).reduce((a, b) => a + b, 0);
                    const prepareData = [];
                    getSummary.map((e) => {
                        if (e.is_parents === false) {
                            prepareData.push({
                                account_name: e.account_name,
                                balance: e.selectedDateBalance,
                            });
                        }
                    });
                    prepareData.push({
                        account_name: "Other Revenues",
                        balance: findOtherSelectedDateBalance,
                    });
                    return prepareData;
                };
                const getRevenue = await summmaryByDepartment("Revenues", "Credit");
                return getRevenue;
            }
            catch (error) {
            }
        },
        getCostOfSaleByDepartment: async (_root, { department_id, fromDate, toDate }) => {
            try {
                let selected_date = {};
                if (fromDate && toDate) {
                    const startDate = new Date(`${fromDate}T00:00:00.000Z`);
                    const endDate = new Date(`${toDate}T16:59:59.999Z`);
                    selected_date = { record_date: { $gte: startDate, $lte: endDate } };
                }
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
                        const findSelectedDateBalance = await generalJournal_1.default.aggregate([
                            { $match: { isDeleted: false } },
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
                        return {
                            account_name: element.account_name,
                            is_parents: element.is_parents,
                            selectedDateBalance: selectedDateBalance,
                        };
                    }));
                    const getSummary = await findSummmary;
                    const findOtherSelectedDateBalance = getSummary.filter((e) => e.is_parents === true).map((e) => e.selectedDateBalance).reduce((a, b) => a + b, 0);
                    const prepareData = [];
                    getSummary.map((e) => {
                        if (e.is_parents === false) {
                            prepareData.push({
                                account_name: e.account_name,
                                balance: e.selectedDateBalance,
                            });
                        }
                    });
                    prepareData.push({
                        account_name: "Other Cost",
                        balance: findOtherSelectedDateBalance,
                    });
                    return prepareData;
                };
                const getRevenue = await summmaryByDepartment("Cost", "Debit");
                return getRevenue;
            }
            catch (error) {
            }
        },
    }
};
exports.default = dashboardResolver;
