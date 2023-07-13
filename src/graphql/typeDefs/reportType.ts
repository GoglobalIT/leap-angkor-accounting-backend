

const departmentType = `#graphql
    #Balance Sheet Type
    type BalanceSheetReport {
        asset: BalanceSheetDetail
        total_asset: Float
        liability: BalanceSheetDetail
        equity: BalanceSheetDetail
        total_equity: Float
        total_liability: Float
        total_liability_and_equity: Float
    }
    type BalanceSheetDetail {
        account_name: String
        total_balance: Float
        sub_account: [BalanceSheetDetail]
    }
    type AllAccount {
        _id: ID
        general_ledger_code: String
        account_name: String
        balance: Float
    }
    type Query {
        balanceSheetReport(fromDate: Date, toDate: Date): BalanceSheetReport
        # incomeStatement(departmentId:)
    }

`;

export default departmentType