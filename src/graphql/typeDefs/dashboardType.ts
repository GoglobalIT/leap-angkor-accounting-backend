

const DashboardType = `#graphql
    
    type Query {
        getBarChart: String
        getTotalRevenue(department_id: ID!, fromDate: String, toDate: String): Int
        getTotalExpense(department_id: ID!, fromDate: String, toDate: String): Int
        getTotalCost(department_id: ID!, fromDate: String, toDate: String): Int
        # getSummaryBalanceSheet()
    }
`;

export default DashboardType
