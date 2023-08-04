"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const generalJournal_1 = __importDefault(require("../../models/generalJournal"));
const paginationLabel_1 = require("../../functions/paginationLabel");
const AuchCheck_1 = __importDefault(require("../../config/AuchCheck"));
const generalJournalResolver = {
    Query: {
        getJournalById: async (_root, { journal_id }, { req }) => {
            try {
                const currentUser = await (0, AuchCheck_1.default)(req);
                if (!currentUser.status) {
                    return new Error(currentUser.message);
                }
                const getById = await generalJournal_1.default.findById(journal_id);
                return getById;
            }
            catch (error) {
                console.log(error.message);
            }
        },
        getLastJournalNumber: async (_root, {}, { req }) => {
            try {
                const currentUser = await (0, AuchCheck_1.default)(req);
                if (!currentUser.status) {
                    return new Error(currentUser.message);
                }
                let journalNumber = 1;
                const getLastJournal = await generalJournal_1.default.findOne({ isDeleted: false }).sort({ createdAt: -1 }).limit(1);
                if (getLastJournal) {
                    journalNumber = getLastJournal.journal_number + 1;
                }
                return journalNumber;
            }
            catch (error) {
            }
        },
        getJournalWithPagination: async (_root, { page, limit, keyword, pagination, fromDate, toDate }, { req }) => {
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
                    sort: { createdAt: -1 },
                    populate: 'journal_entries.chart_account_id created_by',
                };
                let queryByDate = {};
                if (fromDate && toDate) {
                    const startDate = new Date(`${fromDate}T00:00:00.000Z`);
                    const endDate = new Date(`${toDate}T16:59:59.999Z`);
                    queryByDate = { record_date: { $gte: startDate, $lte: endDate } };
                }
                const query = { $and: [
                        {
                            $or: [
                                { memo: { $regex: keyword, $options: "i" } },
                            ]
                        },
                        queryByDate,
                        { isDeleted: false }
                    ] };
                const getData = await generalJournal_1.default.paginate(query, options);
                return getData;
            }
            catch (error) {
                console.log(error);
            }
        }
    },
    Mutation: {
        createJournal: async (_root, { input }, { req }) => {
            try {
                const currentUser = await (0, AuchCheck_1.default)(req);
                if (!currentUser.status) {
                    return new Error(currentUser.message);
                }
                let journalNumber = 1;
                const getLastJournal = await generalJournal_1.default.findOne({ isDeleted: false }).sort({ createdAt: -1 }).limit(1);
                if (getLastJournal) {
                    journalNumber = getLastJournal.journal_number + 1;
                }
                const isCreated = await new generalJournal_1.default({
                    ...input,
                    journal_number: journalNumber
                }).save();
                if (!isCreated) {
                    return {
                        isSuccess: false,
                        message: "Create Journal Unsuccessful !"
                    };
                }
                return {
                    isSuccess: true,
                    message: "Create Journal Successfully"
                };
            }
            catch (error) {
                return {
                    isSuccess: false,
                    message: "Error, " + error.message
                };
            }
        },
        updateJournal: async (_root, { journal_id, input }, { req }) => {
            try {
                const currentUser = await (0, AuchCheck_1.default)(req);
                if (!currentUser.status) {
                    return new Error(currentUser.message);
                }
                const isUpdated = await generalJournal_1.default.findByIdAndUpdate(journal_id, input);
                if (!isUpdated) {
                    return {
                        isSuccess: false,
                        message: 'Update Journal Unsuccessful'
                    };
                }
                return {
                    isSuccess: true,
                    message: 'Update Journal Successfully'
                };
            }
            catch (error) {
                return {
                    isSuccess: false,
                    message: 'Error, ' + error.message
                };
            }
        },
        deleteJournal: async (_root, { journal_id }, { req }) => {
            try {
                const currentUser = await (0, AuchCheck_1.default)(req);
                if (!currentUser.status) {
                    return new Error(currentUser.message);
                }
                const isDeletedUpdate = await generalJournal_1.default.findByIdAndUpdate(journal_id, { isDeleted: true });
                if (!isDeletedUpdate) {
                    return {
                        isSuccess: false,
                        message: "Delete JournalUnsuccessful !"
                    };
                }
                return {
                    isSuccess: true,
                    message: "Delete Journal Successfully"
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
exports.default = generalJournalResolver;
