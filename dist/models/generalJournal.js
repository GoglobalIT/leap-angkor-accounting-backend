"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const mongoose_paginate_v2_1 = __importDefault(require("mongoose-paginate-v2"));
const mongoose_autopopulate_1 = __importDefault(require("mongoose-autopopulate"));
const generalJournalSchema = new mongoose_1.Schema({
    transaction_title: { type: String, default: "" },
    currency: { type: String, enum: ['USD', 'KHR'], default: 'USD' },
    record_date: { type: Date, default: null },
    journal_number: { type: Number },
    journal_entries: [
        {
            chart_account_id: { type: mongoose_1.default.Types.ObjectId, ref: "ChartOfAccount", required: true, autopopulate: true },
            credit: { type: Number, required: true },
            debit: { type: Number, required: true },
            description: String,
            key: { type: Date, default: Date.now },
        }
    ],
    created_by: { type: mongoose_1.default.Types.ObjectId, ref: "User", autopopulate: true },
    memo: { type: String, default: "" },
    isClosedRepord: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });
generalJournalSchema.plugin(mongoose_paginate_v2_1.default);
generalJournalSchema.plugin(mongoose_autopopulate_1.default);
const GeneralJournal = (0, mongoose_1.model)("GeneralJournal", generalJournalSchema);
exports.default = GeneralJournal;
