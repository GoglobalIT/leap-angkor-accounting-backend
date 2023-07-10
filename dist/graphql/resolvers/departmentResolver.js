"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const department_1 = __importDefault(require("../../models/department"));
const paginationLabel_1 = require("../../functions/paginationLabel");
const departmentResolver = {
    Query: {
        getDepartmentById: async (_root, { department_id }) => {
            try {
                const getById = await department_1.default.findById(department_id);
                return getById;
            }
            catch (error) {
                console.log(error.message);
            }
        },
        getDepartmentWithPagination: async (_root, { page, limit, keyword, pagination }) => {
            try {
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
                        { department_name: { $regex: keyword, $options: "i" } },
                        { code: { $regex: keyword, $options: "i" } },
                    ]
                };
                const getData = await department_1.default.paginate(query, options);
                return getData;
            }
            catch (error) {
                console.log(error);
            }
        }
    },
    Mutation: {
        createDepartment: async (_root, { input }) => {
            try {
                console.log(input);
                const isExisting = await department_1.default.findOne({ $or: [
                        { department_name: input.department_name },
                    ] });
                if (isExisting) {
                    return {
                        isSuccess: false,
                        message: `(${input.department_name} already exist.`
                    };
                }
                const isCreated = await new department_1.default(input).save();
                if (!isCreated) {
                    return {
                        isSuccess: false,
                        message: "Create Company Profile Unsuccessful !"
                    };
                }
                return {
                    isSuccess: true,
                    message: "Create Company Profile Successfully"
                };
            }
            catch (error) {
                return {
                    isSuccess: false,
                    message: "Error, " + error.message
                };
            }
        },
        updateDepartment: async (_root, { department_id, input }) => {
            try {
                const isExisting = await department_1.default.findOne({ $and: [
                        { department_name: input.department_name },
                        { _id: { $ne: department_id } }
                    ] });
                if (isExisting) {
                    return {
                        isSuccess: false,
                        message: `${input.department_name} already exist.`
                    };
                }
                const isUpdated = await department_1.default.findByIdAndUpdate(department_id, input);
                if (!isUpdated) {
                    return {
                        isSuccess: false,
                        message: 'Update Company Profile Unsuccessful'
                    };
                }
                return {
                    isSuccess: true,
                    message: 'Update Company Profile Successfully'
                };
            }
            catch (error) {
                return {
                    isSuccess: false,
                    message: 'Error, ' + error.message
                };
            }
        },
        deleteDepartment: async (_root, { department_id }) => {
            try {
                const isDeleted = await department_1.default.findByIdAndDelete(department_id);
                if (!isDeleted) {
                    return {
                        isSuccess: false,
                        message: "Delete Company Profile Unsuccessful !"
                    };
                }
                return {
                    isSuccess: true,
                    message: "Delete Company Profile Successfully"
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
