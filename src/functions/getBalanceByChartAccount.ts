import ChartOfAccount from "../models/chartOfAccount";
import GeneralJournal from "../models/generalJournal";

const getBalanceChartAccount = async (chart_account_id: String, start_date: String, end_date: String)=>{
    try {
    
        const chartAccountInfo = await ChartOfAccount.findById(chart_account_id)
    
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
      
        let transaction_date_match = {}
        if(start_date  && end_date ){
          const startDate = new Date(`${start_date}T00:00:00.000Z`)
          const endDate = new Date(`${end_date}T16:59:59.999Z`)
          transaction_date_match = {record_date: {$gte: startDate, $lte: endDate}}
        }

        const findBalanceDraft = await GeneralJournal.aggregate([
          { $match: {isDeleted: false}},
          {$unwind: "$journal_entries"},
          {$match: transaction_date_match},
          {$match: {"journal_entries.chart_account_id": {$in: all_accounts_related}}},
          {$group: {
            _id: null,
            total_debit: {$sum: "$journal_entries.debit"},
            total_credit: {$sum: "$journal_entries.credit"},
          }}
        ]);
     
        if(
          //Debit Increase
          chartAccountInfo.account_type === "Cash on hand" || 
          chartAccountInfo.account_type === "Cash in bank" || 
          chartAccountInfo.account_type === "Account Receivable" ||
          chartAccountInfo.account_type === "Inventory" ||
          chartAccountInfo.account_type === "Fixed Assets" ||
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

        return total_account_balance
    } catch (error) {
        
    }
}

export default getBalanceChartAccount