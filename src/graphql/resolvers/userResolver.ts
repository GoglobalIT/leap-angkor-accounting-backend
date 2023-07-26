import { iUser } from "../../interface/iUser";
import User from "../../models/user";
import AuchCheck from '../../config/AuchCheck'
import {paginationLabel} from "../../functions/paginationLabel"
import mongoose from 'mongoose'; 
import AuthAdmin from '../../config/AuthAdmin'
import '../../config/keyService.json'
import { HTML5_FMT } from "moment";

const userResolver = {
  Query: {
    getUserById: async (_root: undefined, {_id}:{_id: String}) => {
      try {
        const getById = await User.findById(_id).populate('company')
       
        return getById
      } catch (error) {
        console.log(error.message)
      }
    },
    getUserLogin: async(_root: undefined, {}, {req}:{req: any}) => {
        try {
          const currentUser = await AuchCheck(req)
          
          if (!currentUser.status){
            return new Error(currentUser.message);
          }
          const user = await User.findById(currentUser.user.user_id); 
          return user

        } catch (error) {
            return {
                isSuccess: false,
                message: error
            }
        }
    },
    getUserWithPagination: async (_root: undefined, {page, limit, keyword, pagination}: {page: number, limit: number, keyword: string, pagination: boolean})=>{
      try {
        const options = {
          page: page || 1,
          limit: limit || 10,
          pagination: pagination,
          customLabels: paginationLabel,
          sort: {createdAt: -1},
          populate: '',
        };

        const query = {
          $or: [
            { first_name: { $regex: keyword, $options: "i" } },
            { last_name: { $regex: keyword, $options: "i" } },
          ]
        }

        const getData = await User.paginate(query, options);

        return getData

      } catch (error) {
        console.log(error)
      }
    }
  },
  Mutation: {
    createUser: async (_root: undefined, { input }: { input: iUser }) => {
      try {
        const isExisting = await User.findOne({user_email: input.user_email})
        if(isExisting){
          return {
            isSuccess: false,
            message: `${input.user_email} already exist.`
          }
        }
        const uuid = new mongoose.Types.ObjectId();
        const isCreated = await new User({...input, _id : uuid}).save();
        if (isCreated) {
          const createInAuthMS = await AuthAdmin.createUser(uuid.toJSON(), input.user_email, input.password, input.user_first_name, input.user_last_name, input.role)
          if(!createInAuthMS.status){
            return {
              isSuccess: createInAuthMS.status,
              message: createInAuthMS.message
            }
          }
        }
        if (!isCreated) {
          return {
            isSuccess: false,
            message: "Create User Unsuccessful !"
          }
        }
        return {
          isSuccess: true,
          message: "Create User Successfully"
        }
      } catch (error) {
        return {
          isSuccess: false,
          message: "Error, " + error.message
        }
      }
    
    },
    updateUser: async (_root: undefined, { _id, input }: { _id: String, input: iUser }) => {
      try {
        const isExisting = await User.findOne({$and:[
          {user_email: input.user_email},
          {_id: {$ne: _id}}
        ]})
        if(isExisting){
          return {
            isSuccess: false,
            message: `${input.user_email} already exist.`
          }
        }
        const isUpdated = await User.findByIdAndUpdate(_id, input);
        if(isUpdated){
            const uid = _id.toString()
            const updateInAuthMS = await AuthAdmin.updateUser(uid, input.user_email, input.password, input.user_first_name, input.user_last_name, input.role)
            if(!updateInAuthMS.status){
              return {
                isSuccess: updateInAuthMS.status,
                message: updateInAuthMS.message
              }
            }
        }
        if (!isUpdated) {
          return {
            isSuccess: false,
            message: 'Update User Profile Unsuccessful'
          }
        }
        return {
          isSuccess: true,
          message: 'Update User Profile Successfully'
        }
      } catch (error) {
        return {
          isSuccess: false,
          message: 'Error, ' + error.message
        }
      }
    },
    deleteUser: async (_root: undefined, { _id }: { _id: string },) => {
      try {
        const isDeleted = await User.findByIdAndDelete(_id);
        if (!isDeleted) {
          return {
            isSuccess: false,
            message: "Delete User Unsuccessful !"
          }
        }
        const deleteInAuthMS = await AuthAdmin.delete(_id)
        if(!deleteInAuthMS.status){
          return {
            isSuccess: deleteInAuthMS.status,
            message: deleteInAuthMS.message
          }
        }
        return {
          isSuccess: true,
          message: "Delete User Successfully"
        }
      } catch (error) {
        return {
          isSuccess: false,
          message: "Error, " + error.message
        }
      }
    },
    assignDepartment: async(_root: undefined, { user_id, department_id}:{ user_id: string, department_id: string }) => {
      try {
        const pushDepartment = await User.updateOne(
          {_id: user_id},
          {$push: {departments_access: department_id}}
        )
        if(!pushDepartment){
          return {
            isSuccess: false,
            message: "Assign Department Unsuccessfully"
          }
        }
        return {
          isSuccess: true,
          message: "Assign Department Successfully"
        }
      } catch (error) {
        
      }
    },
    deleteAssignedDepartment: async(_root: undefined, { user_id, department_id}:{ user_id: string, department_id: string }) => {
      try {
        const pullDepartment = await User.updateOne(
          {_id: user_id},
          {$pull: {departments_access: department_id}}
        )
        if(!pullDepartment){
          return {
            isSuccess: false,
            message: "Delete Assigned Department Unsuccessfully"
          }
        }
        return {
          isSuccess: true,
          message: "Delete Assigned Department Successfully"
        }
      } catch (error) {
        
      }
    }
  }
};

export default userResolver