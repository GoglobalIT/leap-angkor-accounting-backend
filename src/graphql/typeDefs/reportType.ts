

const departmentType = `#graphql
    #Balance Sheet Type
    type BalanceSheetReport {
        asset: Asset
        total_asset: Float
        liability: Liability
        equity: Equity
        total_liability_and_equity: Float
    }
    type Asset {
        cash: AccountDetail
        accounts_receivable: AccountDetail
        inventory_and_fixed_asset: AccountDetail
        # fixed_assets: AccountDetail
    }
    type Liability {
        accounts_payable: AccountDetail
        total_liability_balance: Float
    }
    type Equity {
        capitals: AccountDetail
        cost: AccountDetail
        expenditures: AccountDetail
        revenues: AccountDetail
        total_equity_balance: Float
    }
    type AccountDetail {
        all_account: [AllAccount]
        total_balance: Float
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