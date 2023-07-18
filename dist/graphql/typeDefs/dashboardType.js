"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DashboardType = `#graphql
    type SummaryIncomeStatment {
        revenue: Float
        costOfSale: Float
        Expense: Float
        grossProfit: Float
        netIncome: Float
    }
    type Cash {
        cashOnHand: Float
        cashInBank: Float
    }
    type Query {
        getBarChart: String
        getSummaryIncomeStatment(department_id: String, fromDate: String, toDate: String): SummaryIncomeStatment
        getCash(department_id: String, fromDate: String, toDate: String): Cash
    }
`;
exports.default = DashboardType;
