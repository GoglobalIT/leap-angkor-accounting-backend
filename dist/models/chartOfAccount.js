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
const accountType_1 = require("../functions/accountType");
const chartOfAccountSchema = new mongoose_1.Schema({
    account_type: { type: String, enum: accountType_1.accountType },
    account_name: String,
    code_account: String,
    department_id: { type: mongoose_1.default.Types.ObjectId, ref: 'Department', autopopulate: true, default: null },
    account_description: String,
    is_parents: { type: Boolean, default: false },
    is_top_parents: { type: Boolean, default: true },
    parents_account: {
        type: mongoose_1.default.Types.ObjectId,
        ref: 'ChartOfAccount',
        default: null,
        autopopulate: true
    },
    sub_account: [
        {
            type: mongoose_1.default.Types.ObjectId,
            ref: "ChartOfAccount",
            autopopulate: true,
            default: []
        }
    ],
    expense_type_id: { type: mongoose_1.default.Types.ObjectId, ref: 'ExpenseType', autopopulate: true, default: null },
    total_balance: { type: Object, default: null },
    journal_entries: [{ type: Object, default: null }],
}, { timestamps: true });
chartOfAccountSchema.plugin(mongoose_paginate_v2_1.default);
chartOfAccountSchema.plugin(mongoose_autopopulate_1.default);
const ChartOfAccount = (0, mongoose_1.model)("ChartOfAccount", chartOfAccountSchema);
exports.default = ChartOfAccount;
