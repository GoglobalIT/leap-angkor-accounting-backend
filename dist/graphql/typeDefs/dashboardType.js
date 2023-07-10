"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DashboardType = `#graphql
    
    type Query {
        getBarChart: String
        getTotalRevenue(department_id: ID!, fromDate: String, toDate: String): Int
        getTotalExpense(department_id: ID!, fromDate: String, toDate: String): Int
        getTotalCost(department_id: ID!, fromDate: String, toDate: String): Int
        # getSummaryBalanceSheet()
    }
`;
exports.default = DashboardType;
