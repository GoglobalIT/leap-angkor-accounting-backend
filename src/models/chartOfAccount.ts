import mongoose, { Schema, model, InferSchemaType, Mongoose } from "mongoose";
import paginate from "mongoose-paginate-v2";
import {iChartOfAccount} from '../interface/iChartOfAccount'
import mongooseAutoPopulate from "mongoose-autopopulate";
import {accountType} from "../functions/type";


const chartOfAccountSchema = new Schema<iChartOfAccount>({
    account_type: {type: String, enum: accountType},
    account_name: String, 
    code_account: String,
    department_id: {type: mongoose.Types.ObjectId, ref: 'Department', autopopulate: true, default: null},
    total_debit: {type: Number, default: 0},
    total_credit: {type: Number, default: 0},
    total_balance: {type: Number, default: 0},
    account_description: String,
    is_parents: { type: Boolean, default: false },
    is_top_parents: { type: Boolean, default: true },
    parents_account: {
        type: mongoose.Types.ObjectId,
        ref: 'ChartOfAccount',
        default: null,
        autopopulate: true
    },
    sub_account: [
        {
            type: mongoose.Types.ObjectId,
            ref: "ChartOfAccount",
            autopopulate: true,
            default: []
        }
    ],
    //Only for expense account, we need this for Income Statment Summary Report show not mess
    expense_type_id: {type: mongoose.Types.ObjectId, ref: 'ExpenseType', autopopulate: true, default: null},

}, {timestamps: true})
chartOfAccountSchema.plugin(paginate)
chartOfAccountSchema.plugin(mongooseAutoPopulate)
const ChartOfAccount = model<iChartOfAccount, mongoose.PaginateModel<iChartOfAccount>>("ChartOfAccount", chartOfAccountSchema);
export default ChartOfAccount;
