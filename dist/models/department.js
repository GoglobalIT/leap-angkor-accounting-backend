"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mongoose_paginate_v2_1 = __importDefault(require("mongoose-paginate-v2"));
const departmentSchema = new mongoose_1.Schema({
    department_name: { type: String, require: true },
    description: { type: String },
}, { timestamps: true });
departmentSchema.plugin(mongoose_paginate_v2_1.default);
const Department = (0, mongoose_1.model)("Department", departmentSchema);
exports.default = Department;
