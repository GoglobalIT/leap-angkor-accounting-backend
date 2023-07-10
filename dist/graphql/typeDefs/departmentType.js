"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const departmentType = `#graphql

  type Department {
    _id: String
    department_name: String
    description: String
    createdAt: Date
    updatedAt: Date
  }
  type DepartmentPaginator{
    data: [Department]
    paginator: Paginator
  }
  input DepartmentInput {
    department_name: String
    description: String
  }

  type Query {
    getDepartmentById(department_id: ID!): Department
    getDepartmentWithPagination(page: Int, limit: Int, keyword: String, pagination: Boolean): DepartmentPaginator
  }
  type Mutation {
    createDepartment(input: DepartmentInput): ResponseMessage
    updateDepartment(department_id: ID!, input: DepartmentInput): ResponseMessage
    deleteDepartment(department_id: ID!): ResponseMessage
  }
`;
exports.default = departmentType;
