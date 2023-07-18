

import GeneralJournal from '../../models/generalJournal';
import ChartOfAccount from '../../models/chartOfAccount';
import mongoose from 'mongoose';
import getBalanceChartAccount from '../../functions/getBalanceByChartAccount';


const dashboardResolver = {
  Query: {
    getBarChart: (_root: undefined, { _id }: { _id: String }, req: any) => {
      return "Dashboard query write in a separagte file for make easy find later"
    },
    getSummaryIncomeStatment: async (_root: undefined, { department_id, fromDate, toDate }: { department_id: string, fromDate: String, toDate: String }) => {
      try {
        let selected_date = {}
     
        if (fromDate && toDate) {
          const startDate = new Date(`${fromDate}T00:00:00.000Z`)
          const endDate = new Date(`${toDate}T16:59:59.999Z`)
          selected_date = { record_date: { $gte: startDate, $lte: endDate } }
        }

        if (department_id === "64a52c65ad409eb75c87d8e1") {
          let summaryAllDepartment = async (accountType: string, increase: string) => {
            const findSelectedDateBalance = await GeneralJournal.aggregate([
              { $match: selected_date },
              { $unwind: "$journal_entries" },
              { $lookup: {
                  from: "chartofaccounts",
                  localField: "journal_entries.chart_account_id",
                  foreignField: "_id",
                  as: "chartAccount"
              }},
              { $unwind: "$chartAccount" },
              { $match: { "chartAccount.account_type": accountType } },
              {
                $group: {
                  _id: null,
                  total_debit: { $sum: "$journal_entries.debit" },
                  total_credit: { $sum: "$journal_entries.credit" },
                }
              },
            ])

            let selectedDateBalance = findSelectedDateBalance.length > 0 ? findSelectedDateBalance[0].total_credit - findSelectedDateBalance[0].total_debit : 0
            if(increase === "Debit"){
              selectedDateBalance = findSelectedDateBalance.length > 0 ? findSelectedDateBalance[0].total_debit  -  findSelectedDateBalance[0].total_credit : 0
            }

            return selectedDateBalance
              
          }
          const revenues = await summaryAllDepartment("Revenues", "Credit")
          const costOfSale = await summaryAllDepartment("Cost", "Debit")
          const expense = await summaryAllDepartment("Expenditures", "Debit")
          const grossProfit = revenues - costOfSale
          const netIncome = grossProfit - expense

          return {
            revenue: revenues,
            costOfSale: costOfSale,
            Expense: expense,
            grossProfit: grossProfit,
            netIncome: netIncome,
          }

        } else {

          //@Find Revenue Cost and Expense by department
          let summmaryByDepartment = async (accountType: string, increase: string) => {
            const findSelectedDateBalance = await GeneralJournal.aggregate([
              { $unwind: "$journal_entries" },
              { $match: selected_date },
              { $lookup: {
                from: "chartofaccounts",
                localField: "journal_entries.chart_account_id",
                foreignField: "_id",
                as: "chartAccount"
              }},
              { $unwind: "$chartAccount" },
              { $match: { "chartAccount.department_id": new mongoose.Types.ObjectId(department_id) } },
              { $match: { "chartAccount.account_type": accountType } },
              {
                $group: {
                  _id: null,
                  total_debit: { $sum: "$journal_entries.debit" },
                  total_credit: { $sum: "$journal_entries.credit" },
                }
              },
            ])
         
            let selectedDateBalance = findSelectedDateBalance.length > 0 ? findSelectedDateBalance[0].total_credit - findSelectedDateBalance[0].total_debit : 0
            if(increase === "Debit"){
              selectedDateBalance = findSelectedDateBalance.length > 0 ? findSelectedDateBalance[0].total_debit  -  findSelectedDateBalance[0].total_credit : 0
            }

            return selectedDateBalance
          }

          const revenues = await summmaryByDepartment("Revenues", "Credit")
          const costOfSale = await summmaryByDepartment("Cost", "Debit")
          const expense = await summmaryByDepartment("Expenditures", "Debit")
          const grossProfit = revenues - costOfSale
          const netIncome = grossProfit - expense

          return {
            revenue: revenues,
            costOfSale: costOfSale,
            Expense: expense,
            grossProfit: grossProfit,
            netIncome: netIncome,
          }

        }

      } catch (error) {

      }
    },
    getCash: async(_root: undefined, {department_id, fromDate, toDate}:{department_id: String, fromDate: String, toDate: String})=>{
      try {

        // if(department_id === '64a52c65ad409eb75c87d8e1'){
          const getCashOnHand = await ChartOfAccount.find({$and:[
            {account_type: 'Cash'},
            {account_name: { $regex: "Hand", $options: "i" }}
          ]})
          const getCashOnHandBalance = getCashOnHand.length > 0 ? await getBalanceChartAccount(getCashOnHand[0]._id.toString(), fromDate, toDate) : null
          const cashOnHandBalance = getCashOnHandBalance ? getCashOnHandBalance.total_balance : 0
       
          const getCashInBank = await ChartOfAccount.find({$and:[
            {account_type: 'Cash'},
            {account_name: { $regex: "Bank", $options: "i" }}
          ]})
          const getCashInBankBalance = getCashInBank.length > 0 ? await getBalanceChartAccount(getCashInBank[0]._id.toString(), fromDate, toDate) : null
          const cashInBankBalance = getCashInBankBalance ? getCashInBankBalance.total_balance : 0
  
          return {
            cashOnHand: cashOnHandBalance,
            cashInBank: cashInBankBalance
          }
        // }else
        
      } catch (error) {
        
      }
    }
  }

};

export default dashboardResolver