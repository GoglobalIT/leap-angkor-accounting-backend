import mongoose, { Schema, model, InferSchemaType } from "mongoose";
import paginate from "mongoose-paginate-v2";
import {iChartOfAccount} from '../interface/iChartOfAccount'
import mongooseAutoPopulate from "mongoose-autopopulate";
import {accountType} from "../functions/accountType";


const generalJournalSchema = new Schema<any>({
    transaction_title: {type: String, default: ""},
    currency: {type: String, enum:['USD', 'KHR'], default: 'USD'},
    record_date: {type: Date, default: null},
    journal_number: {type: Number},
    journal_entries: [
        {
            chart_account_id: {type: mongoose.Types.ObjectId, ref: "ChartOfAccount", required: true, autopopulate: true},
            credit: {type: Number, required: true},
            debit: {type: Number, required: true},
            description: String,
            key: {type: Date, default: Date.now},
        }
    ],
    created_by: {type: mongoose.Types.ObjectId, ref: "User", autopopulate: true},
    memo: {type: String, default: ""},
    isClosedRepord: {type: Boolean, default: false},
    isDeleted: {type: Boolean, default: false}
}, {timestamps: true})
generalJournalSchema.plugin(paginate)
generalJournalSchema.plugin(mongooseAutoPopulate)
const GeneralJournal = model<any, mongoose.PaginateModel<any>>("GeneralJournal", generalJournalSchema);
export default GeneralJournal;
