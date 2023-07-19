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
    # Account Recievable and Account Payable
    type ARandAP{
        month: String
        balanceAR: Float
        balanceAP: Float
    }
    type RevenueCostExpense {
        account_name: String
        balance: Float
    }
    type Query {
        getSummaryIncomeStatment(department_id: String, fromDate: String, toDate: String): SummaryIncomeStatment
        getCash(department_id: String, fromDate: String, toDate: String): Cash
        getARandAP(fromDate: String, toDate: String): [ARandAP]
        getExpenseByDepartment(department_id: String, fromDate: String, toDate: String): [RevenueCostExpense]
        getRevenueByDepartment(department_id: String, fromDate: String, toDate: String): [RevenueCostExpense]
        getCostOfSaleByDepartment(department_id: String, fromDate: String, toDate: String): [RevenueCostExpense]
    }
`;
exports.default = DashboardType;
