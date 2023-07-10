"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chartOfAccount_1 = __importDefault(require("../../models/chartOfAccount"));
const paginationLabel_1 = require("../../functions/paginationLabel");
const accountType_1 = __importDefault(require("../../functions/accountType"));
const generalJournal_1 = __importDefault(require("../../models/generalJournal"));
const departmentResolver = {
    Query: {
        getChartOfAccountById: async (_root, { chart_account_id }) => {
            try {
                const getById = await chartOfAccount_1.default.findById(chart_account_id);
                return getById;
            }
            catch (error) {
                console.log(error.message);
            }
        },
        getChartOfAccountWithPagination: async (_root, { page, limit, keyword, pagination, department_id, account_type }) => {
            try {
                const options = {
                    page: page || 1,
                    limit: limit || 10,
                    pagination: pagination,
                    customLabels: paginationLabel_1.paginationLabel,
                    sort: { createdAt: 1 },
                    populate: 'department_id',
                };
                console.log(department_id, "department_id");
                const departmentQuery = department_id ? { department_id: { $in: department_id } } : {};
                const accountTypeQuery = account_type ? { account_type: account_type } : {};
                const query = {
                    $and: [
                        {
                            $or: [
                                { account_name: { $regex: keyword, $options: "i" } }
                            ]
                        },
                        { is_top_parents: true },
                        departmentQuery,
                        accountTypeQuery
                    ]
                };
                const getData = await chartOfAccount_1.default.paginate(query, options);
                return getData;
            }
            catch (error) {
                console.log(error);
            }
        },
        getChartOfAccountList: async (_root, { department_id, account_type }) => {
            try {
                const departmentQuery = department_id.length > 0 ? { department_id: { $in: department_id } } : {};
                const accountTypeQuery = account_type.length > 0 ? { account_type: { $in: account_type } } : {};
                const getChartOfAccountList = await chartOfAccount_1.default.find({ $and: [
                        { is_parents: false },
                        departmentQuery,
                        accountTypeQuery
                    ] }).populate('department_id sub_account parents_account');
                return getChartOfAccountList;
            }
            catch (error) {
            }
        },
        getBalanceByChartAccountId: async (_root, { chart_account_id, start_date, end_date }) => {
            try {
                const chartAccountInfo = await chartOfAccount_1.default.findById(chart_account_id);
                let total_account_balance = {
                    _id: chartAccountInfo._id,
                    account_name: chartAccountInfo.account_name,
                    account_type: chartAccountInfo.account_type,
                    total_debit: 0,
                    total_credit: 0,
                    total_balance: 0,
                };
                const getAllSub = (chartAccountInfo, arry) => {
                    let all_related_account = arry;
                    all_related_account.push(chartAccountInfo._id);
                    if (chartAccountInfo.sub_account.length > 0) {
                        chartAccountInfo.sub_account.map((e) => {
                            getAllSub(e, all_related_account);
                        });
                    }
                    return all_related_account;
                };
                let all_accounts_related = getAllSub(chartAccountInfo, []);
                console.log(all_accounts_related, "all_accounts_related");
                let transaction_date_match = {};
                if (start_date !== "" && end_date !== "") {
                    const startDate = new Date(`${start_date}T00:00:00.000Z`);
                    const endDate = new Date(`${end_date}T16:59:59.999Z`);
                    transaction_date_match = { transaction_date: { $gte: startDate, $lte: endDate } };
                }
                const findBalanceDraft = await generalJournal_1.default.aggregate([
                    { $unwind: "$journal_entries" },
                    { $match: transaction_date_match },
                    { $match: { "journal_entries.chart_account_id": { $in: all_accounts_related } } },
                    { $group: {
                            _id: null,
                            total_debit: { $sum: "$journal_entries.debit" },
                            total_credit: { $sum: "$journal_entries.credit" },
                        } }
                ]);
                if (chartAccountInfo.account_type === "Cash and Bank" ||
                    chartAccountInfo.account_type === "Account Receivable" ||
                    chartAccountInfo.account_type === "Inventory and Fixed assets" ||
                    chartAccountInfo.account_type === "Expenditures") {
                    if (findBalanceDraft.length > 0) {
                        total_account_balance.total_debit = findBalanceDraft[0].total_debit;
                        total_account_balance.total_credit = findBalanceDraft[0].total_credit;
                        total_account_balance.total_balance = findBalanceDraft[0].total_debit - findBalanceDraft[0].total_credit;
                    }
                }
                else {
                    if (findBalanceDraft.length > 0) {
                        total_account_balance.total_debit = findBalanceDraft[0].total_debit;
                        total_account_balance.total_credit = findBalanceDraft[0].total_credit;
                        total_account_balance.total_balance = findBalanceDraft[0].total_credit - findBalanceDraft[0].total_debit;
                    }
                }
                return total_account_balance;
            }
            catch (error) {
            }
        },
        getAccountType: async () => {
            return accountType_1.default;
        }
    },
    Mutation: {
        createChartOfAccount: async (_root, { input }) => {
            try {
                console.log(input, "input");
                if (input.parents_account === null) {
                    const isCreated = await new chartOfAccount_1.default({
                        ...input,
                        is_parents: false,
                        is_top_parents: true,
                    }).save();
                    console.log(isCreated, "isCreated1111");
                    if (!isCreated) {
                        return {
                            isSuccess: false,
                            message: "Create Chart of Account Unsuccessful !"
                        };
                    }
                }
                else {
                    const isCreated = await new chartOfAccount_1.default({
                        ...input,
                        is_parents: false,
                        is_top_parents: false,
                    }).save();
                    console.log(isCreated, "isCreated2222");
                    if (!isCreated) {
                        return {
                            isSuccess: false,
                            message: "Create Chart of Account Unsuccessful !"
                        };
                    }
                    const updateParentsAccount = await chartOfAccount_1.default.updateOne({ _id: input.parents_account }, {
                        $push: { sub_account: isCreated._id },
                        is_parents: true
                    });
                    console.log(updateParentsAccount, "updateParentsAccount");
                    if (!updateParentsAccount) {
                        return {
                            isSuccess: false,
                            message: "Error occurred, update parents account failed !"
                        };
                    }
                }
                return {
                    isSuccess: true,
                    message: "Create Chart of Account Successfully"
                };
            }
            catch (error) {
                return {
                    isSuccess: false,
                    message: "Error, " + error.message
                };
            }
        },
        updateChartOfAccount: async (_root, { chart_account_id, input }) => {
            try {
                const isUpdated = await chartOfAccount_1.default.findByIdAndUpdate(chart_account_id, input);
                if (!isUpdated) {
                    return {
                        isSuccess: false,
                        message: 'Update Chart of Account Unsuccessful'
                    };
                }
                return {
                    isSuccess: true,
                    message: 'Update Chart of Account Successfully'
                };
            }
            catch (error) {
                return {
                    isSuccess: false,
                    message: 'Error, ' + error
                };
            }
        },
        deleteChartOfAccount: async (_root, { chart_account_id }) => {
            try {
                const findChartAccount = await chartOfAccount_1.default.findById(chart_account_id);
                if (!findChartAccount) {
                    return {
                        isSuccess: false,
                        message: "This chart account was not founded !"
                    };
                }
                if (findChartAccount.sub_account.length > 0) {
                    return {
                        isSuccess: false,
                        message: `Cannot delete, because ${findChartAccount.account_name} has sub-account`
                    };
                }
                const updateParentsAccount = await chartOfAccount_1.default.updateOne({ _id: findChartAccount.parents_account }, { $pull: { sub_account: findChartAccount._id } });
                if (!updateParentsAccount) {
                    return {
                        isSuccess: false,
                        message: "Error occurred, update parents account failed !"
                    };
                }
                const isDeleted = await chartOfAccount_1.default.findByIdAndDelete(chart_account_id);
                if (!isDeleted) {
                    return {
                        isSuccess: false,
                        message: "Delete Chart of Account Unsuccessful !"
                    };
                }
                return {
                    isSuccess: true,
                    message: "Delete Chart of Account Successfully"
                };
            }
            catch (error) {
                return {
                    isSuccess: false,
                    message: "Error, " + error.message
                };
            }
        }
    }
};
exports.default = departmentResolver;
