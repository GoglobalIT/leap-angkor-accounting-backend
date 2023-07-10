"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const generateBalanceSheet_1 = __importDefault(require("../../functions/generateBalanceSheet"));
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
                const balance_sheet_report = {
                    asset: {
                        cash: await generateBalanceSheet_1.default.asset(start_date, end_date, "Cash"),
                        accounts_receivable: await generateBalanceSheet_1.default.asset(start_date, end_date, "Account Receivable"),
                        inventory_and_fixed_asset: await generateBalanceSheet_1.default.asset(start_date, end_date, "Inventory and Fixed Assets"),
                    },
                    total_asset: await generateBalanceSheet_1.default.total_asset_balance(start_date, end_date),
                    liability: {
                        accounts_payable: await generateBalanceSheet_1.default.liability(start_date, end_date, "Account Payable"),
                        total_liability_balance: await generateBalanceSheet_1.default.total_liability_balance(start_date, end_date)
                    },
                    equity: {
                        capitals: await generateBalanceSheet_1.default.equity(start_date, end_date, "Capitals"),
                        cost: await generateBalanceSheet_1.default.equity(start_date, end_date, "Cost"),
                        expenditures: await generateBalanceSheet_1.default.equity(start_date, end_date, "Expenditures"),
                        revenues: await generateBalanceSheet_1.default.equity(start_date, end_date, "Revenues"),
                        total_equity_balance: await generateBalanceSheet_1.default.total_equity_balance(start_date, end_date)
                    },
                    total_liability_and_equity: await generateBalanceSheet_1.default.total_liability_and_equity_balance(start_date, end_date)
                };
                return balance_sheet_report;
            }
            catch (error) {
            }
        }
    }
};
exports.default = reportResolver;
