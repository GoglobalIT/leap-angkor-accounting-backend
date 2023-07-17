"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const expenseType = `#graphql

  type ExpenseType {
    _id: String
    expense_name: String
    createdAt: Date
    updatedAt: Date
  }
  type ExpenseTypePaginator{
    data: [ExpenseType]
    paginator: Paginator
  }
  input ExpenseTypeInput {
    expense_name: String
  }
  type Query {
    getExpenseTypeById(department_id: ID!): Department
    getExpenseTypePagination(page: Int, limit: Int, keyword: String, pagination: Boolean): ExpenseTypePaginator
  }
  type Mutation {
    createExpenseType(input: ExpenseTypeInput): ResponseMessage
    updateExpenseType(expense_type_id: ID!, input: ExpenseTypeInput): ResponseMessage
    deleteExpenseType(expense_type_id: ID!): ResponseMessage
  }
`;
exports.default = expenseType;
