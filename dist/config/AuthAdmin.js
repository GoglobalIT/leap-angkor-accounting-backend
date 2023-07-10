"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GoglobalAmin_1 = __importDefault(require("./GoglobalAmin"));
const keyService_json_1 = __importDefault(require("./keyService.json"));
const AuthAdmin = new GoglobalAmin_1.default();
AuthAdmin.initializeApp(keyService_json_1.default.app_id, keyService_json_1.default.key, keyService_json_1.default.url, keyService_json_1.default.user, keyService_json_1.default.user_key);
exports.default = AuthAdmin;
