"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const generalJournal_1 = __importDefault(require("../../models/generalJournal"));
const paginationLabel_1 = require("../../functions/paginationLabel");
const generalJournalResolver = {
    Query: {
        getJournalById: async (_root, { journal_id }) => {
            try {
                const getById = await generalJournal_1.default.findById(journal_id);
                return getById;
            }
            catch (error) {
                console.log(error.message);
            }
        },
        getLastJournalNumber: async (_root, {}) => {
            try {
                let journalNumber = 1;
                const getLastJournal = await generalJournal_1.default.findOne({}).sort({ createdAt: -1 }).limit(1);
                if (getLastJournal) {
                    journalNumber = getLastJournal.journal_number + 1;
                }
                return journalNumber;
            }
            catch (error) {
            }
        },
        getJournalWithPagination: async (_root, { page, limit, keyword, pagination }) => {
            try {
                const options = {
                    page: page || 1,
                    limit: limit || 10,
                    pagination: pagination,
                    customLabels: paginationLabel_1.paginationLabel,
                    sort: { createdAt: -1 },
                    populate: 'journal_entries.chart_account_id created_by',
                };
                const query = {};
                const getData = await generalJournal_1.default.paginate(query, options);
                return getData;
            }
            catch (error) {
                console.log(error);
            }
        }
    },
    Mutation: {
        createJournal: async (_root, { input }) => {
            try {
                let journalNumber = 1;
                const getLastJournal = await generalJournal_1.default.findOne({}).sort({ createdAt: -1 }).limit(1);
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
        updateJournal: async (_root, { journal_id, input }) => {
            try {
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
        deleteJournal: async (_root, { journal_id }) => {
            try {
                const isDeleted = await generalJournal_1.default.findByIdAndDelete(journal_id);
                if (!isDeleted) {
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
