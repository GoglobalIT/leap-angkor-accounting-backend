import mongoose, { Schema, model, InferSchemaType, Mongoose } from "mongoose";
import paginate from "mongoose-paginate-v2";
import {iExpenseType} from '../interface/iExpenseType'


const expenseTypeSchema = new Schema<iExpenseType>({
    expense_name: String
}, {timestamps: true})
expenseTypeSchema.plugin(paginate)

const ExpenseType = model<iExpenseType, mongoose.PaginateModel<iExpenseType>>("ExpenseType", expenseTypeSchema);
export default ExpenseType;
