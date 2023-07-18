"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const generalJournal_1 = __importDefault(require("../../models/generalJournal"));
const chartOfAccount_1 = __importDefault(require("../../models/chartOfAccount"));
const mongoose_1 = __importDefault(require("mongoose"));
const dashboardResolver = {
    Query: {
        getBarChart: (_root, { _id }, req) => {
            return "Dashboard query write in a separagte file for make easy find later";
        },
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
                            { $match: selected_date },
                            { $unwind: "$journal_entries" },
                            { $lookup: {
                                    from: "chartofaccounts",
                                    localField: "journal_entries.chart_account_id",
                                    foreignField: "_id",
                                    as: "chartAccount"
                                } },
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
                            { $unwind: "$journal_entries" },
                            { $match: selected_date },
                            { $lookup: {
                                    from: "chartofaccounts",
                                    localField: "journal_entries.chart_account_id",
                                    foreignField: "_id",
                                    as: "chartAccount"
                                } },
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
        getCash: async (_root, {}) => {
            try {
                const getCash = await chartOfAccount_1.default.find({ $and: [
                        { account_type: 'Cash' },
                        { account_name: { $regex: "Hand", $options: "i" } }
                    ] });
                console.log(getCash, "getCash");
            }
            catch (error) {
            }
        }
    }
};
exports.default = dashboardResolver;
