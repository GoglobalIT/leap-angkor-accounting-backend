"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chartOfAccount_1 = __importDefault(require("../models/chartOfAccount"));
const getBalanceByChartAccount_1 = __importDefault(require("../functions/getBalanceByChartAccount"));
const balanceSheet = async (accountType, start_date, end_date) => {
    try {
        const getParentsChartAccount = await chartOfAccount_1.default.find({
            $and: [
                { is_top_parents: true },
                { department_id: '64a52c65ad409eb75c87d8e1' },
                { account_type: { $in: accountType } },
            ]
        });
        const getAccountByType = await chartOfAccount_1.default.find({
            $and: [
                { department_id: '64a52c65ad409eb75c87d8e1' },
                { account_type: { $in: accountType } },
            ]
        });
        const findBalanceOfChartAccount = Promise.all(getAccountByType.map(async (element) => {
            const findBalance = await (0, getBalanceByChartAccount_1.default)(element._id.toString(), start_date, end_date);
            return {
                _id: element._id,
                account_name: element.account_name,
                total_balance: findBalance.total_balance
            };
        }));
        const ChartAccountWithBalance = await findBalanceOfChartAccount;
        const generateBalanceTreeData = (chartAccountInfo, chartAccountWithBalance) => {
            let chart_account_tree_data = chartAccountInfo;
            const findBalanceByAccountId = chartAccountWithBalance.find(e => e._id + "" === chartAccountInfo._id + "");
            if (findBalanceByAccountId) {
                chart_account_tree_data.total_balance = findBalanceByAccountId.total_balance;
            }
            if (chart_account_tree_data.sub_account.length > 0) {
                chart_account_tree_data.sub_account.map(async (element) => {
                    generateBalanceTreeData(element, chartAccountWithBalance);
                });
            }
            return chart_account_tree_data;
        };
        const generateBalanceSheet = getParentsChartAccount.map(element => {
            const generateElement = generateBalanceTreeData(element, ChartAccountWithBalance);
            return generateElement;
        });
        const finalBalance = generateBalanceSheet.map(element => {
            const totalBalanceSubAccount = element.sub_account.map((e) => e.total_balance).reduce((a, b) => a + b, 0);
            if (totalBalanceSubAccount < element.total_balance) {
                const newElement = element;
                newElement.sub_account.push({
                    account_name: "Other",
                    total_balance: element.total_balance - totalBalanceSubAccount,
                });
                return newElement;
            }
            else {
                return element;
            }
        });
        return finalBalance;
    }
    catch (error) {
    }
};
exports.default = balanceSheet;
