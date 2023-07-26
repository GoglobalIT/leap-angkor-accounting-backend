import { iDepartment } from "../../interface/iDepartment";
import Department from "../../models/department";
import {paginationLabel} from "../../functions/paginationLabel";
import User from "../../models/user";


const departmentResolver = {
  Query: {
    getDepartmentById: async (_root: undefined, {department_id}:{department_id: String}) => {
      try {
        const getById = await Department.findById(department_id)
        return getById
      } catch (error) {
        console.log(error.message)
      }
    },
    getDepartmentWithPagination: async (_root: undefined, {page, limit, keyword, pagination, userId}: {page: number, limit: number, keyword: string, pagination: boolean, userId:string})=>{
      try {
        
        const options = {
          page: page || 1,
          limit: limit || 10,
          pagination: pagination,
          customLabels: paginationLabel,
          sort: {createdAt: 1},
          populate: '',
        };

        let queryByDepartmentAccess = {}
        if(userId){
          const findUser = await User.findById(userId)
          if(findUser.role === "Admin" || findUser.role === "Reader"){
            queryByDepartmentAccess = {_id: {$in: findUser.departments_access}}
          }
        }

        const query = {
          $and:[
            {
              $or: [
                { department_name: { $regex: keyword, $options: "i" } },
                { code: { $regex: keyword, $options: "i" } },
              ]
            },
            queryByDepartmentAccess
          ]
        }

        const getData = await Department.paginate(query, options);

        return getData

      } catch (error) {
        console.log(error)
      }
    }
  },
  Mutation: {
    createDepartment: async (_root: undefined, { input }: { input: iDepartment }) => {
      try {
        console.log(input)
        const isExisting = await Department.findOne({$or:[
            {department_name: input.department_name},   
        ]})
   
        if(isExisting){
          return {
            isSuccess: false,
            message: `(${input.department_name} already exist.`
          }
        }
        const isCreated = await new Department(input).save();
        if (!isCreated) {
          return {
            isSuccess: false,
            message: "Create Company Profile Unsuccessful !"
          }
        }
        return {
          isSuccess: true,
          message: "Create Company Profile Successfully"
        }
      } catch (error) {
        return {
          isSuccess: false,
          message: "Error, " + error.message
        }
      }
    },
    updateDepartment: async (_root: undefined, { department_id, input }: { department_id: String, input: iDepartment }) => {
      try {
        const isExisting = await Department.findOne({$and:[
          {department_name: input.department_name},
          {_id: {$ne: department_id}}
        ]})
        if(isExisting){
          return {
            isSuccess: false,
            message: `${input.department_name} already exist.`
          }
        }
        const isUpdated = await Department.findByIdAndUpdate(department_id, input);
        if (!isUpdated) {
          return {
            isSuccess: false,
            message: 'Update Company Profile Unsuccessful'
          }
        }
        return {
          isSuccess: true,
          message: 'Update Company Profile Successfully'
        }
      } catch (error) {
        return {
          isSuccess: false,
          message: 'Error, ' + error.message
        }
      }
    },
    deleteDepartment: async (_root: undefined, { department_id }: { department_id: String },) => {
      try {
        const departmentCannotDelete = ['64a52c65ad409eb75c87d8e1']
        const findWarning = departmentCannotDelete.find(e => e === department_id)
        if(findWarning){
          return {
            isSuccess: false,
            message: "Cannot delete, this is default department !"
          }
        }
        const isDeleted = await Department.findByIdAndDelete(department_id);
        if (!isDeleted) {
          return {
            isSuccess: false,
            message: "Delete Company Profile Unsuccessful !"
          }
        }
        return {
          isSuccess: true,
          message: "Delete Company Profile Successfully"
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

export default departmentResolver