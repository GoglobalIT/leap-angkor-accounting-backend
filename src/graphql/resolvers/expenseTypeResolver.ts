import { iExpenseType } from "../../interface/iExpenseType";
import ExpenseType from "../../models/expenseType";
import {paginationLabel} from "../../functions/paginationLabel";
import ChartOfAccount from "../../models/chartOfAccount";

const expenseTypeResolver = {
  Query: {
    getExpenseTypeById: async (_root: undefined, {expense_type_id}:{expense_type_id: String}) => {
      try {
        const getById = await ExpenseType.findById(expense_type_id)
        return getById
      } catch (error) {
        console.log(error.message)
      }
    },
    getExpenseTypePagination: async (_root: undefined, {page, limit, keyword, pagination}: {page: number, limit: number, keyword: string, pagination: boolean})=>{
      try {
        
        const options = {
          page: page || 1,
          limit: limit || 10,
          pagination: pagination,
          customLabels: paginationLabel,
          sort: {createdAt: 1},
          populate: '',
        };

        const query = {
          $or: [
            { expense_name: { $regex: keyword, $options: "i" } },
          ]
        }

        const getData = await ExpenseType.paginate(query, options);

        return getData

      } catch (error) {
        console.log(error)
      }
    }
  },
  Mutation: {
    createExpenseType: async (_root: undefined, { input }: { input: iExpenseType }) => {
      try {
        // console.log(input)
        const isExisting = await ExpenseType.findOne({$or:[
            {expense_name: input.expense_name},   
        ]})
   
        if(isExisting){
          return {
            isSuccess: false,
            message: `(${input.expense_name} already exist.`
          }
        }
        const isCreated = await new ExpenseType(input).save();
        if (!isCreated) {
          return {
            isSuccess: false,
            message: "Create Expense Type Unsuccessful !"
          }
        }
        return {
          isSuccess: true,
          message: "Create Expense Type Successfully"
        }
      } catch (error) {
        return {
          isSuccess: false,
          message: "Error, " + error.message
        }
      }
    },
    updateExpenseType: async (_root: undefined, { expense_type_id, input }: { expense_type_id: String, input: iExpenseType }) => {
      try {
        const isExisting = await ExpenseType.findOne({$and:[
          {expense_name: input.expense_name},
          {_id: {$ne: expense_type_id}}
        ]})
        if(isExisting){
          return {
            isSuccess: false,
            message: `${input.expense_name} already exist.`
          }
        }
        const isUpdated = await ExpenseType.findByIdAndUpdate(expense_type_id, input);
        if (!isUpdated) {
          return {
            isSuccess: false,
            message: 'Update Expense Type Unsuccessful'
          }
        }
        return {
          isSuccess: true,
          message: 'Update Expense Type Successfully'
        }
      } catch (error) {
        return {
          isSuccess: false,
          message: 'Error, ' + error.message
        }
      }
    },
    deleteExpenseType: async (_root: undefined, { expense_type_id }: { expense_type_id: String },) => {
      try {
        const isInUsed = await ChartOfAccount.findOne({expense_type_id: expense_type_id})
        if(isInUsed){
          return {
            isSuccess: false,
            message: "Cannot delete, this data is using !"
          }
        }
        const isDeleted = await ExpenseType.findByIdAndDelete(expense_type_id);
        if (!isDeleted) {
          return {
            isSuccess: false,
            message: "Delete Expense Type Unsuccessful !"
          }
        }
        return {
          isSuccess: true,
          message: "Delete Expense Type Successfully"
        }
      } catch (error) {
        return {
          isSuccess: false,
          message: "Error, "+error.message
        }
      }
    }
  }
};

export default expenseTypeResolver