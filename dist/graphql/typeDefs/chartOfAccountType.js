"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chartOfAccountType = `#graphql

  type ChartOfAccount {
    _id: String
    account_type: String
    account_name: String
    code_account: String
    department_id: Department
    total_credit: Float
    total_debit: Float
    total_balance: Float
    account_description: String
    is_parents: Boolean
    is_top_parents: Boolean
    parents_account: ChartOfAccount
    sub_account: [ChartOfAccount]
    expense_type_id: ExpenseType
    journal_entries: JournalEntries
    createdAt: Date
    updatedAt: Date
  }
  type ChartOfAccountPaginator {
    data: [ChartOfAccount]
    paginator: Paginator
  }
  type BalanceByChartAccount {
    _id: ID,
    account_name: String,
    account_type: String,
    total_debit: Float,
    total_credit: Float,
    total_balance: Float,
  }

  input ChartOfAccountInput {
    code_account: String
    account_type: String,
    account_name: String, 
    account_description: String,
    parents_account: ID
    department_id: ID
    expense_type_id: ID
  }

  type Query {
    getChartOfAccountById(chart_account_id: ID!): Department
    getChartOfAccountWithPagination(page: Int, limit: Int, keyword: String, pagination: Boolean, department_id: [String], account_type: String): ChartOfAccountPaginator
    getChartOfAccountList(department_id: [String], account_type: [String]): [ChartOfAccount]
    getBalanceByChartAccountId(chart_account_id: ID, start_date: String, end_date: String): BalanceByChartAccount 
    getAccountType: [String]
  }
  type Mutation {
    createChartOfAccount(input: ChartOfAccountInput): ResponseMessage
    updateChartOfAccount(chart_account_id: ID!, input: ChartOfAccountInput): ResponseMessage
    deleteChartOfAccount(chart_account_id: ID!): ResponseMessage
  }
`;
exports.default = chartOfAccountType;
