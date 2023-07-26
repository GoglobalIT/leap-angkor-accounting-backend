import mongoose, { Schema, model } from "mongoose"; 
import paginate from "mongoose-paginate-v2";
// import { Accounting_DB_Connect } from "../config/db_connection";
import { iUser } from "../interface/iUser";
const userShema = new Schema<iUser>({
    _id: {type: mongoose.Types.ObjectId, required: true},
    user_first_name: { type: String, required: true },
    user_last_name: { type: String, required: true },
    user_email: {type: String,},
    user_image_name: { type: String },
    user_image_src: { type: String },
    role: {type: String, enum:["Super Admin", "Admin", "Reader"]}, //for only accounting frontend check
    departments_access: [{type: mongoose.Types.ObjectId, ref: 'Department', default: []}],
    status: { type: Boolean, default: true },
},{ _id: false, timestamps: true })

userShema.plugin(paginate)
const User = model<iUser, mongoose.PaginateModel<iUser>>('User', userShema)
export default User