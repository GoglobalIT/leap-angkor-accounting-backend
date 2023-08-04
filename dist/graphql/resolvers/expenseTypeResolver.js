"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const expenseType_1 = __importDefault(require("../../models/expenseType"));
const paginationLabel_1 = require("../../functions/paginationLabel");
const chartOfAccount_1 = __importDefault(require("../../models/chartOfAccount"));
const AuchCheck_1 = __importDefault(require("../../config/AuchCheck"));
const expenseTypeResolver = {
    Query: {
        getExpenseTypeById: async (_root, { expense_type_id }, { req }) => {
            try {
                const currentUser = await (0, AuchCheck_1.default)(req);
                if (!currentUser.status) {
                    return new Error(currentUser.message);
                }
                const getById = await expenseType_1.default.findById(expense_type_id);
                return getById;
            }
            catch (error) {
                console.log(error.message);
            }
        },
        getExpenseTypePagination: async (_root, { page, limit, keyword, pagination }, { req }) => {
            try {
                const currentUser = await (0, AuchCheck_1.default)(req);
                if (!currentUser.status) {
                    return new Error(currentUser.message);
                }
                const options = {
                    page: page || 1,
                    limit: limit || 10,
                    pagination: pagination,
                    customLabels: paginationLabel_1.paginationLabel,
                    sort: { createdAt: 1 },
                    populate: '',
                };
                const query = {
                    $or: [
                        { expense_name: { $regex: keyword, $options: "i" } },
                    ]
                };
                const getData = await expenseType_1.default.paginate(query, options);
                return getData;
            }
            catch (error) {
                console.log(error);
            }
        }
    },
    Mutation: {
        createExpenseType: async (_root, { input }, { req }) => {
            try {
                const currentUser = await (0, AuchCheck_1.default)(req);
                if (!currentUser.status) {
                    return new Error(currentUser.message);
                }
                const isExisting = await expenseType_1.default.findOne({ $or: [
                        { expense_name: input.expense_name },
                    ] });
                if (isExisting) {
                    return {
                        isSuccess: false,
                        message: `(${input.expense_name} already exist.`
                    };
                }
                const isCreated = await new expenseType_1.default(input).save();
                if (!isCreated) {
                    return {
                        isSuccess: false,
                        message: "Create Expense Type Unsuccessful !"
                    };
                }
                return {
                    isSuccess: true,
                    message: "Create Expense Type Successfully"
                };
            }
            catch (error) {
                return {
                    isSuccess: false,
                    message: "Error, " + error.message
                };
            }
        },
        updateExpenseType: async (_root, { expense_type_id, input }, { req }) => {
            try {
                const currentUser = await (0, AuchCheck_1.default)(req);
                if (!currentUser.status) {
                    return new Error(currentUser.message);
                }
                const isExisting = await expenseType_1.default.findOne({ $and: [
                        { expense_name: input.expense_name },
                        { _id: { $ne: expense_type_id } }
                    ] });
                if (isExisting) {
                    return {
                        isSuccess: false,
                        message: `${input.expense_name} already exist.`
                    };
                }
                const isUpdated = await expenseType_1.default.findByIdAndUpdate(expense_type_id, input);
                if (!isUpdated) {
                    return {
                        isSuccess: false,
                        message: 'Update Expense Type Unsuccessful'
                    };
                }
                return {
                    isSuccess: true,
                    message: 'Update Expense Type Successfully'
                };
            }
            catch (error) {
                return {
                    isSuccess: false,
                    message: 'Error, ' + error.message
                };
            }
        },
        deleteExpenseType: async (_root, { expense_type_id }, { req }) => {
            try {
                const currentUser = await (0, AuchCheck_1.default)(req);
                if (!currentUser.status) {
                    return new Error(currentUser.message);
                }
                const isInUsed = await chartOfAccount_1.default.findOne({ expense_type_id: expense_type_id });
                if (isInUsed) {
                    return {
                        isSuccess: false,
                        message: "Cannot delete, this data is using !"
                    };
                }
                const isDeleted = await expenseType_1.default.findByIdAndDelete(expense_type_id);
                if (!isDeleted) {
                    return {
                        isSuccess: false,
                        message: "Delete Expense Type Unsuccessful !"
                    };
                }
                return {
                    isSuccess: true,
                    message: "Delete Expense Type Successfully"
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
exports.default = expenseTypeResolver;
