"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = __importDefault(require("../../models/user"));
const AuchCheck_1 = __importDefault(require("../../config/AuchCheck"));
const paginationLabel_1 = require("../../functions/paginationLabel");
const mongoose_1 = __importDefault(require("mongoose"));
const AuthAdmin_1 = __importDefault(require("../../config/AuthAdmin"));
require("../../config/keyService.json");
const userResolver = {
    Query: {
        getUserById: async (_root, { _id }) => {
            try {
                const getById = await user_1.default.findById(_id).populate('company');
                return getById;
            }
            catch (error) {
                console.log(error.message);
            }
        },
        getUserLogin: async (_root, {}, req) => {
            try {
                const currentUser = await (0, AuchCheck_1.default)(req.token);
                if (!currentUser.status) {
                    return new Error(currentUser.message);
                }
                const user = await user_1.default.findById(currentUser.user.user_id);
                return user;
            }
            catch (error) {
                return {
                    isSuccess: false,
                    message: error
                };
            }
        },
        getUserWithPagination: async (_root, { page, limit, keyword, pagination }) => {
            try {
                const options = {
                    page: page || 1,
                    limit: limit || 10,
                    pagination: pagination,
                    customLabels: paginationLabel_1.paginationLabel,
                    sort: { createdAt: -1 },
                    populate: '',
                };
                const query = {
                    $or: [
                        { first_name: { $regex: keyword, $options: "i" } },
                        { last_name: { $regex: keyword, $options: "i" } },
                    ]
                };
                const getData = await user_1.default.paginate(query, options);
                return getData;
            }
            catch (error) {
                console.log(error);
            }
        }
    },
    Mutation: {
        createUser: async (_root, { input }) => {
            try {
                const isExisting = await user_1.default.findOne({ user_email: input.user_email });
                if (isExisting) {
                    return {
                        isSuccess: false,
                        message: `${input.user_email} already exist.`
                    };
                }
                const uuid = new mongoose_1.default.Types.ObjectId();
                const isCreated = await new user_1.default({ ...input, _id: uuid }).save();
                if (isCreated) {
                    const createInAuthMS = await AuthAdmin_1.default.createUser(uuid.toJSON(), input.user_email, input.password, input.user_first_name, input.user_last_name, input.role);
                    if (!createInAuthMS.status) {
                        return {
                            isSuccess: createInAuthMS.status,
                            message: createInAuthMS.message
                        };
                    }
                }
                if (!isCreated) {
                    return {
                        isSuccess: false,
                        message: "Create User Unsuccessful !"
                    };
                }
                return {
                    isSuccess: true,
                    message: "Create User Successfully"
                };
            }
            catch (error) {
                return {
                    isSuccess: false,
                    message: "Error, " + error.message
                };
            }
        },
        updateUser: async (_root, { _id, input }) => {
            try {
                const isExisting = await user_1.default.findOne({ $and: [
                        { user_email: input.user_email },
                        { _id: { $ne: _id } }
                    ] });
                if (isExisting) {
                    return {
                        isSuccess: false,
                        message: `${input.user_email} already exist.`
                    };
                }
                const isUpdated = await user_1.default.findByIdAndUpdate(_id, input);
                if (isUpdated) {
                    const uid = _id.toString();
                    const updateInAuthMS = await AuthAdmin_1.default.updateUser(uid, input.user_email, input.password, input.user_first_name, input.user_last_name, input.role);
                    if (!updateInAuthMS.status) {
                        return {
                            isSuccess: updateInAuthMS.status,
                            message: updateInAuthMS.message
                        };
                    }
                }
                if (!isUpdated) {
                    return {
                        isSuccess: false,
                        message: 'Update User Profile Unsuccessful'
                    };
                }
                return {
                    isSuccess: true,
                    message: 'Update User Profile Successfully'
                };
            }
            catch (error) {
                return {
                    isSuccess: false,
                    message: 'Error, ' + error.message
                };
            }
        },
        deleteUser: async (_root, { _id }) => {
            try {
                const isDeleted = await user_1.default.findByIdAndDelete(_id);
                if (!isDeleted) {
                    return {
                        isSuccess: false,
                        message: "Delete User Unsuccessful !"
                    };
                }
                const deleteInAuthMS = await AuthAdmin_1.default.delete(_id);
                if (!deleteInAuthMS.status) {
                    return {
                        isSuccess: deleteInAuthMS.status,
                        message: deleteInAuthMS.message
                    };
                }
                return {
                    isSuccess: true,
                    message: "Delete User Successfully"
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
exports.default = userResolver;
