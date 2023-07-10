import mongoose, { Schema, model, InferSchemaType } from "mongoose";
import paginate from "mongoose-paginate-v2";
import {iDepartment} from '../interface/iDepartment'


const departmentSchema = new Schema<iDepartment>({
    department_name: {type: String, require:true},
    description: {type: String},
}, {timestamps: true})
departmentSchema.plugin(paginate)
const Department = model<iDepartment, mongoose.PaginateModel<iDepartment>>("Department", departmentSchema);
export default Department;
