"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reportType = `#graphql
    #Balance Sheet Type
    type BalanceSheetReport {
        asset: [BalanceSheetDetail]
        total_asset: Float
        liability: [BalanceSheetDetail]
        equity: [BalanceSheetDetail]
        total_equity: Float
        total_liability: Float
        total_liability_and_equity: Float
    }
    type BalanceSheetDetail {
        account_name: String
        total_balance: Float
        sub_account: [BalanceSheetDetail]
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
        total: Total
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
        journal_number: String
        transaction_title: String
        account_description: String
        memo: String
        debit: Float
        credit: Float
    }
    type TotalBalance{
        total_debit: Float
        total_credit: Float
        total_balance: Float
    }
    type Total{
        debit: Float
        credit: Float
    }
    type Query {
        balanceSheetReport(fromDate: Date, toDate: Date): BalanceSheetReport
        incomeStatementReport(department_id: String, fromDate: Date, toDate: Date, form: String): IncomeStatementReport
        generalLedgerReport(fromDate: Date, toDate: Date): GeneralLedgerReport
    }

`;
exports.default = reportType;
