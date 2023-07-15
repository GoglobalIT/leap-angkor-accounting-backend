"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const balanceSheet_1 = __importDefault(require("../../functions/balanceSheet"));
const department_1 = __importDefault(require("../../models/department"));
const generalJournal_1 = __importDefault(require("../../models/generalJournal"));
const chartOfAccount_1 = __importDefault(require("../../models/chartOfAccount"));
const reportResolver = {
    Query: {
        getBarChart: (_root, { _id }, req) => {
            return "Dashboard query write in a separagte file for make easy find later";
        },
        balanceSheetReport: async (_root, { fromDate, toDate }) => {
            try {
                const getBalanceSheetAsset = await (0, balanceSheet_1.default)(['Cash', 'Account Receiveable', 'Inventory and Fixed Assets'], fromDate, toDate);
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
        incomeStatementReport: async (_root, { department_id, fromDate, toDate }) => {
            try {
                let transaction_date_match = {};
                if (fromDate && toDate) {
                    const startDate = new Date(`${fromDate}T00:00:00.000Z`);
                    const endDate = new Date(`${toDate}T16:59:59.999Z`);
                    transaction_date_match = { record_date: { $gte: startDate, $lte: endDate } };
                }
                const departments = await department_1.default.find({ _id: { $ne: '64a52c65ad409eb75c87d8e1' } });
                if (department_id === "64a52c65ad409eb75c87d8e1") {
                    let revenueOrCost = (accountType, increase) => {
                        const findRevenueOrCost = Promise.all(departments.map(async (element) => {
                            const findRevenueAccount = await chartOfAccount_1.default.find({ $and: [
                                    { account_type: accountType },
                                    { department_id: element._id }
                                ] });
                            const allRevenueAccount = findRevenueAccount.map(e => e._id);
                            const findRevenueSelectedDate = await generalJournal_1.default.aggregate([
                                { $unwind: "$journal_entries" },
                                { $match: transaction_date_match },
                                { $match: { "journal_entries.chart_account_id": { $in: allRevenueAccount } } },
                                { $group: {
                                        _id: null,
                                        total_debit: { $sum: "$journal_entries.debit" },
                                        total_credit: { $sum: "$journal_entries.credit" },
                                    } },
                            ]);
                            let revenueSelectedDate = findRevenueSelectedDate.length > 0 ? findRevenueSelectedDate[0].total_credit - findRevenueSelectedDate[0].total_debit : 0;
                            if (increase === "Debit") {
                                revenueSelectedDate = findRevenueSelectedDate.length > 0 ? findRevenueSelectedDate[0].total_credit - findRevenueSelectedDate[0].total_debit : 0;
                            }
                            const findRevenueYearToDate = await generalJournal_1.default.aggregate([
                                { $unwind: "$journal_entries" },
                                { $match: { "journal_entries.chart_account_id": { $in: allRevenueAccount } } },
                                { $group: {
                                        _id: null,
                                        total_debit: { $sum: "$journal_entries.debit" },
                                        total_credit: { $sum: "$journal_entries.credit" },
                                    } },
                            ]);
                            let revenueYearToDate = findRevenueYearToDate.length > 0 ? findRevenueYearToDate[0].total_credit - findRevenueYearToDate[0].total_debit : 0;
                            if (increase === "Debit") {
                                revenueYearToDate = findRevenueYearToDate.length > 0 ? findRevenueYearToDate[0].total_debit - findRevenueYearToDate[0].total_credit : 0;
                            }
                            return {
                                account_name: element.department_name,
                                selectedDateBalance: revenueSelectedDate,
                                yearToDateBalance: revenueYearToDate
                            };
                        }));
                        return findRevenueOrCost;
                    };
                    const revenues = await revenueOrCost("Revenues", "Credit");
                    const totalRevenueSelectedDate = revenues.map(e => e.selectedDateBalance).reduce((a, b) => a + b, 0);
                    const totalRevenueYearToDate = revenues.map(e => e.yearToDateBalance).reduce((a, b) => a + b, 0);
                    const costOfSales = await revenueOrCost("Cost", "Debit");
                    const totalCostSelectedDate = costOfSales.map(e => e.selectedDateBalance).reduce((a, b) => a + b, 0);
                    const totalCostYearToDate = costOfSales.map(e => e.yearToDateBalance).reduce((a, b) => a + b, 0);
                    const grossProfitSelectedDateBalance = totalRevenueSelectedDate - totalCostSelectedDate;
                    const grossProfitYearToDateBalance = totalRevenueYearToDate - totalCostYearToDate;
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
                        expenses: [{}],
                        totalExpense: {},
                        grossProfit: {
                            selectedDateBalance: grossProfitSelectedDateBalance,
                            yearToDateBalance: grossProfitYearToDateBalance
                        },
                        netIncome: 0
                    };
                }
                else {
                }
            }
            catch (error) {
            }
        }
    }
};
exports.default = reportResolver;
