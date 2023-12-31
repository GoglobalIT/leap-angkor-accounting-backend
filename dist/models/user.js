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
const userShema = new mongoose_1.Schema({
    _id: { type: mongoose_1.default.Types.ObjectId, required: true },
    user_first_name: { type: String, required: true },
    user_last_name: { type: String, required: true },
    user_email: { type: String, },
    user_image_name: { type: String },
    user_image_src: { type: String },
    role: { type: String, enum: ["Super Admin", "Admin", "Reader"] },
    departments_access: [{ type: mongoose_1.default.Types.ObjectId, ref: 'Department', default: [] }],
    status: { type: Boolean, default: true },
}, { _id: false, timestamps: true });
userShema.plugin(mongoose_paginate_v2_1.default);
const User = (0, mongoose_1.model)('User', userShema);
exports.default = User;
