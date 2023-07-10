import { iChartOfAccount } from "../../interface/iChartOfAccount";
import ChartOfAccount from "../../models/chartOfAccount";
import { paginationLabel } from "../../functions/paginationLabel";
import accountType from "../../functions/accountType";
import GeneralJournal from "../../models/generalJournal";



const departmentResolver = {
  Query: {
    getChartOfAccountById: async (_root: undefined, { chart_account_id }: { chart_account_id: String }) => {
      try {
        const getById = await ChartOfAccount.findById(chart_account_id)
        return getById
      } catch (error) {
        console.log(error.message)
      }
    },
    getChartOfAccountWithPagination: async (_root: undefined, { page, limit, keyword, pagination, department_id, account_type }: { page: number, limit: number, keyword: string, pagination: boolean, department_id: any, account_type: string }) => {
      try {

        const options = {
          page: page || 1,
          limit: limit || 10,
          pagination: pagination,
          customLabels: paginationLabel,
          sort: { createdAt: 1 },
          populate: 'department_id',
        };
        console.log(department_id, "department_id")
        const departmentQuery = department_id ? {department_id: {$in: department_id}} : {}
        const accountTypeQuery = account_type ? {account_type: account_type} : {}
        const query = {
          $and:[
            {
              $or:[
                {account_name: { $regex: keyword, $options: "i" }}
              ]
            },
            {is_top_parents: true},
            departmentQuery,
            accountTypeQuery
          ]
        }

        const getData = await ChartOfAccount.paginate(query, options);

        return getData

      } catch (error) {
        console.log(error)
      }
    },
    getChartOfAccountList: async(_root: undefined, {department_id, account_type}:{department_id: [String], account_type: [String]})=>{
      try {
        const departmentQuery = department_id.length > 0 ? {department_id: {$in: department_id}} : {} 
        const accountTypeQuery = account_type.length > 0 ? {account_type: {$in: account_type}} : {}
        const getChartOfAccountList = await ChartOfAccount.find({$and:[
          {is_parents: false},
          departmentQuery,
          accountTypeQuery
        ]}).populate('department_id sub_account parents_account')

        return getChartOfAccountList
      } catch (error) {
        
      }
    },
    getBalanceByChartAccountId: async(_root: undefined, {chart_account_id, start_date, end_date}:{chart_account_id:string, start_date:string, end_date:string})=>{
        try {
        // console.log(chart_account_id, "chart_account_id");
        // console.log(start_date, "start_date");
        // console.log(end_date, "end_date");
        const chartAccountInfo = await ChartOfAccount.findById(chart_account_id)
        // console.log(chartAccountInfo, "chartAccountInfo");
        let total_account_balance = {
          _id: chartAccountInfo._id,
          account_name: chartAccountInfo.account_name,
          account_type: chartAccountInfo.account_type,
          total_debit: 0,
          total_credit: 0,
          total_balance: 0,
        }

        // ***RECURSIVE Function : for get all related chart account to find total Credit, Debit, and Balance of each parent account */
        const getAllSub = (chartAccountInfo:any, arry:any)=>{
          let all_related_account = arry
          all_related_account.push(chartAccountInfo._id)
          if(chartAccountInfo.sub_account.length > 0){
            chartAccountInfo.sub_account.map((e:any)=>{
              getAllSub(e, all_related_account)
            })
          }
          return all_related_account
        }
        // ***-----------------------------------------------*/
    


        let all_accounts_related = getAllSub(chartAccountInfo, [])
        console.log(all_accounts_related, "all_accounts_related");

        let transaction_date_match = {}
        if(start_date !== "" && end_date !== ""){
          const startDate = new Date(`${start_date}T00:00:00.000Z`)
          const endDate = new Date(`${end_date}T16:59:59.999Z`)
          transaction_date_match = {transaction_date: {$gte: startDate, $lte: endDate}}
        }
        
        const findBalanceDraft = await GeneralJournal.aggregate([
          {$unwind: "$journal_entries"},
          {$match: transaction_date_match},
          {$match: {"journal_entries.chart_account_id": {$in: all_accounts_related}}},
          {$group: {
            _id: null,
            total_debit: {$sum: "$journal_entries.debit"},
            total_credit: {$sum: "$journal_entries.credit"},
          }}
        ]);
        // console.log(findBalanceDraft, "findBalanceDraft");
        if(
          //Debit Increase
          chartAccountInfo.account_type === "Cash and Bank" || 
          chartAccountInfo.account_type === "Account Receivable" ||
          chartAccountInfo.account_type === "Inventory and Fixed assets" ||
          chartAccountInfo.account_type === "Expenditures"
          ){
            if(findBalanceDraft.length > 0){
              total_account_balance.total_debit = findBalanceDraft[0].total_debit
              total_account_balance.total_credit = findBalanceDraft[0].total_credit
              total_account_balance.total_balance = findBalanceDraft[0].total_debit - findBalanceDraft[0].total_credit
            }
          
        }else{
          //Credit Increase
          if(findBalanceDraft.length > 0){
            total_account_balance.total_debit = findBalanceDraft[0].total_debit
            total_account_balance.total_credit = findBalanceDraft[0].total_credit
            total_account_balance.total_balance = findBalanceDraft[0].total_credit - findBalanceDraft[0].total_debit
          }
        }
    
        // console.log(total_account_balance, "total_account_balance");

        return total_account_balance
        } catch (error) {
          
        }
    },
    getAccountType: async () => {
      return accountType
    }
  },
  Mutation: {
    createChartOfAccount: async (_root: undefined, { input }: { input: iChartOfAccount }) => {
      try {
        console.log(input, "input")
        if (input.parents_account === null) {
          const isCreated = await new ChartOfAccount({
            ...input,
            is_parents: false,
            is_top_parents: true,
          }).save();
          console.log(isCreated, "isCreated1111")
          if (!isCreated) {
            return {
              isSuccess: false,
              message: "Create Chart of Account Unsuccessful !"
            }
          }
        } else {
          const isCreated = await new ChartOfAccount({
            ...input,
            is_parents: false,
            is_top_parents: false,
          }).save();
          console.log(isCreated, "isCreated2222")
          if (!isCreated) {
            return {
              isSuccess: false,
              message: "Create Chart of Account Unsuccessful !"
            }
          }

          const updateParentsAccount = await ChartOfAccount.updateOne(
            { _id: input.parents_account },
            {
              $push: { sub_account: isCreated._id },
              is_parents: true
            }
          )
          console.log(updateParentsAccount, "updateParentsAccount")

          if (!updateParentsAccount) {
            return {
              isSuccess: false,
              message: "Error occurred, update parents account failed !"
            }
          }
        }

        return {
          isSuccess: true,
          message: "Create Chart of Account Successfully"
        }
      } catch (error) {
        return {
          isSuccess: false,
          message: "Error, " + error.message
        }
      }
    },
    updateChartOfAccount: async (_root: undefined, { chart_account_id, input }: { chart_account_id: String, input: iChartOfAccount }) => {
      try {
        const isUpdated = await ChartOfAccount.findByIdAndUpdate(chart_account_id, input);
        if (!isUpdated) {
          return {
            isSuccess: false,
            message: 'Update Chart of Account Unsuccessful'
          }
        }
        return {
          isSuccess: true,
          message: 'Update Chart of Account Successfully'
        }
      } catch (error) {
        return {
          isSuccess: false,
          message: 'Error, ' + error
        }
      }
    },
    deleteChartOfAccount: async (_root: undefined, { chart_account_id }: { chart_account_id: String },) => {
      try {
        const findChartAccount = await ChartOfAccount.findById(chart_account_id)
        if (!findChartAccount) {
          return {
            isSuccess: false,
            message: "This chart account was not founded !"
          }
        }
        if(findChartAccount.sub_account.length > 0 ){
          return {
            isSuccess: false,
            message: `Cannot delete, because ${findChartAccount.account_name} has sub-account`
          }
        }
        const updateParentsAccount = await ChartOfAccount.updateOne({ _id: findChartAccount.parents_account }, { $pull: { sub_account: findChartAccount._id } })
        if (!updateParentsAccount) {
          return {
            isSuccess: false,
            message: "Error occurred, update parents account failed !"
          }
        }
        const isDeleted = await ChartOfAccount.findByIdAndDelete(chart_account_id);
        if (!isDeleted) {
          return {
            isSuccess: false,
            message: "Delete Chart of Account Unsuccessful !"
          }
        }
        return {
          isSuccess: true,
          message: "Delete Chart of Account Successfully"
        }
      } catch (error) {
        return {
          isSuccess: false,
          message: "Error, " + error.message
        }
      }
    }
  }
};

export default departmentResolver