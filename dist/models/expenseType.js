"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mongoose_paginate_v2_1 = __importDefault(require("mongoose-paginate-v2"));
const expenseTypeSchema = new mongoose_1.Schema({
    expense_name: String
}, { timestamps: true });
expenseTypeSchema.plugin(mongoose_paginate_v2_1.default);
const ExpenseType = (0, mongoose_1.model)("ExpenseType", expenseTypeSchema);
exports.default = ExpenseType;
