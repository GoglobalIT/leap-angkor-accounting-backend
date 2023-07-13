"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const balanceSheet_1 = __importDefault(require("../../functions/balanceSheet"));
const reportResolver = {
    Query: {
        getBarChart: (_root, { _id }, req) => {
            return "Dashboard query write in a separagte file for make easy find later";
        },
        balanceSheetReport: async (_root, { fromDate, toDate }) => {
            try {
                const start_date = new Date(fromDate);
                const end_date = new Date(toDate);
                end_date.setHours(23, 59, 59, 999);
                const getBalanceSheetAsset = await (0, balanceSheet_1.default)(['Cash', 'Account Receiveable', 'Inventory and Fixed Assets'], fromDate, toDate);
            }
            catch (error) {
            }
        }
    }
};
exports.default = reportResolver;
