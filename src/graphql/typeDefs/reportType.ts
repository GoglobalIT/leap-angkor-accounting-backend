

const reportType = `#graphql
    #Balance Sheet Type
    type BalanceSheetReport {
        asset: [BalanceSheetDetail]
        total_asset: BalanceSheetBalance
        liability: [BalanceSheetDetail]
        equity: [BalanceSheetDetail]
        total_equity: BalanceSheetBalance
        total_liability: BalanceSheetBalance
        total_liability_and_equity: BalanceSheetBalance
    }
    type BalanceSheetDetail {
        account_name: String
        total_balance: BalanceSheetBalance
        sub_account: [BalanceSheetDetail]
    }
    type BalanceSheetBalance {
        current_month_balance: Float
        last_month_balance: Float
    }
    #Income Statment Report Type
    type IncomeStatementReport {
        revenues: [IncomeStatementDetail]
        totalRevenue: IncomeTotalBalance
        costOfSales: [IncomeStatementDetail]
        totalCost: IncomeTotalBalance
        expenses: [IncomeStatementDetail]
        totalExpense: IncomeTotalBalance
        grossProfit: IncomeTotalBalance
        netIncome: IncomeTotalBalance
    }
    type IncomeTotalBalance{
        selectedDateBalance: Float
        yearToDateBalance: Float
    }
    type IncomeStatementDetail {
        account_name: String
        selectedDateBalance: Float
        yearToDateBalance: Float 
    }
    # General Ledger Type
    type GeneralLedgerReport{
        details: [Details]
        total: TotalBalance
    }
    type Details{
        _id: ID
        account_name: String
        account_type: String
        sub_account: [Details]
        journal_entries: [JournalEntriesGeneralLedger]
        total_balance: TotalBalance
    }
    type JournalEntriesGeneralLedger{
        journal_number: Int
        record_date: Date
        transaction_title: String
        description: String
        memo: String
        debit: Float
        credit: Float
    }
    type TotalBalance{
        debit: Float
        credit: Float
        balance: Float
    }

    type Query {
        balanceSheetReport(year: Date, month: Date): BalanceSheetReport
        incomeStatementReport(department_id: String, fromDate: Date, toDate: Date, form: String): IncomeStatementReport
        generalLedgerReport(fromDate: Date, toDate: Date): GeneralLedgerReport
    }
    type Mutation {
        closeReport(dateTime: String): ResponseMessage
    }

`;

export default reportType