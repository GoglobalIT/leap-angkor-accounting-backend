import { ObjectId, Types } from "mongoose";
export interface iUser{ 
    _id: ObjectId,
    user_first_name: string
    user_last_name: string
    user_email: string
    password: string
    user_image_name: string
    user_image_src: string 
    role: string
    status: Boolean
}     