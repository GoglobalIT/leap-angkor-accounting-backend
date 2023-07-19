"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AuthAdmin_1 = __importDefault(require("./AuthAdmin"));
const AuchCheck = async (req) => {
    const token = req.headers.authorization;
    const verify = await AuthAdmin_1.default.verifyToken(token);
    if (verify.status) {
        return verify;
    }
    else {
        return {
            status: verify.status,
            message: "Not Authorized"
        };
    }
};
exports.default = AuchCheck;
