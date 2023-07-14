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
                const getBalanceSheetAsset = await (0, balanceSheet_1.default)(['Cash', 'Account Receiveable', 'Inventory and Fixed Assets'], fromDate, toDate);
                const getBalanceSheetLiability = await (0, balanceSheet_1.default)(['Account Payable'], fromDate, toDate);
                const getBalanceSheetEquity = await (0, balanceSheet_1.default)(['Revenues', 'Cost', 'Expenditures', 'Capitals'], fromDate, toDate);
                const total_asset_balance = getBalanceSheetAsset.length > 0 ? getBalanceSheetAsset.map(e => e.total_balance).reduce((a, b) => a + b, 0) : 0;
                const total_liability_balance = getBalanceSheetLiability.length > 0 ? getBalanceSheetLiability.map(e => e.total_balance).reduce((a, b) => a + b, 0) : 0;
                const total_equity_balance = getBalanceSheetEquity.length > 0 ? getBalanceSheetEquity.map(e => e.total_balance).reduce((a, b) => a + b, 0) : 0;
                const balanceSheetData = {
                    asset: getBalanceSheetAsset,
                    total_asset: total_asset_balance,
                    liability: getBalanceSheetLiability,
                    total_liability: total_liability_balance,
                    equity: getBalanceSheetEquity,
                    total_equity: total_equity_balance,
                    total_liability_and_equity: total_liability_balance + total_equity_balance
                };
                return balanceSheetData;
            }
            catch (error) {
            }
        }
    }
};
exports.default = reportResolver;
