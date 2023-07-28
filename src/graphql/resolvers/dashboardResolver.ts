

import GeneralJournal from '../../models/generalJournal';
import ChartOfAccount from '../../models/chartOfAccount';
import mongoose from 'mongoose';
import getBalanceChartAccount from '../../functions/getBalanceByChartAccount';
import Department from '../../models/department';


const dashboardResolver = {
  Query: {
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
              {
                $lookup: {
                  from: "chartofaccounts",
                  localField: "journal_entries.chart_account_id",
                  foreignField: "_id",
                  as: "chartAccount"
                }
              },
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
            if (increase === "Debit") {
              selectedDateBalance = findSelectedDateBalance.length > 0 ? findSelectedDateBalance[0].total_debit - findSelectedDateBalance[0].total_credit : 0
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
              {
                $lookup: {
                  from: "chartofaccounts",
                  localField: "journal_entries.chart_account_id",
                  foreignField: "_id",
                  as: "chartAccount"
                }
              },
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
            if (increase === "Debit") {
              selectedDateBalance = findSelectedDateBalance.length > 0 ? findSelectedDateBalance[0].total_debit - findSelectedDateBalance[0].total_credit : 0
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
    getCash: async (_root: undefined, { department_id, fromDate, toDate }: { department_id: String, fromDate: String, toDate: String }) => {
      try {

        // if(department_id === '64a52c65ad409eb75c87d8e1'){
        const getCashOnHand = await ChartOfAccount.find({
          $and: [
            { account_type: 'Cash on hand' },
            { is_parents: true }
          ]
        })
        let totalCashOnHand = 0
        if (getCashOnHand.length > 0) {
          const totalBalance = Promise.all(
            getCashOnHand.map(async element => {
              const getBalance = await getBalanceChartAccount(element._id.toString(), fromDate, toDate)
              return getBalance.total_balance
            })
          )
          totalCashOnHand = (await totalBalance).reduce((a: any, b: any) => a + b, 0)
        }

        const getCashInBank = await ChartOfAccount.find({
          $and: [
            { account_type: 'Cash in bank' },
            { is_parents: true }
          ]
        })
        let totalCashInBank = 0
        if (getCashInBank.length > 0) {
          const totalBalance = Promise.all(
            getCashInBank.map(async element => {
              const getBalance = await getBalanceChartAccount(element._id.toString(), fromDate, toDate)
              return getBalance.total_balance
            })
          )
          totalCashInBank = (await totalBalance).reduce((a: any, b: any) => a + b, 0)
        }

        return {
          cashOnHand: totalCashOnHand,
          cashInBank: totalCashInBank
        }
        // }else

      } catch (error) {

      }
    },
    //@Get Account Recievable and Account Payable Total Balance By Month and Year
    getARandAP: async (_root: undefined, { department_id, fromDate, toDate }: { department_id: String, fromDate: String, toDate: String }) => {
      try {
        const currentYear = fromDate ? Number((fromDate.split("-", 1))[0]) : new Date().getFullYear()
        const monthInYear = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

        const findARandAp = Promise.all(
          monthInYear.map(async (element, index) => {
            const monthInYearString = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            //@Find Account Receivable Balance by year month
            const findAR = await GeneralJournal.aggregate([
              { $addFields: { year: { $year: { date: "$record_date", timezone: "Asia/Bangkok" } } } },
              { $addFields: { month: { $month: { date: "$record_date", timezone: "Asia/Bangkok" } } } },
              { $match: { year: currentYear } },
              { $match: { month: element } },
              { $unwind: "$journal_entries" },
              {
                $lookup: {
                  from: "chartofaccounts",
                  localField: "journal_entries.chart_account_id",
                  foreignField: "_id",
                  as: "chart_account_info"
                }
              },
              { $unwind: "$chart_account_info" },
              { $match: { "chart_account_info.account_type": "Account Receivable" } },
              {
                $group: {
                  _id: null,
                  total_credit: { $sum: "$journal_entries.credit" },
                  total_debit: { $sum: "$journal_entries.debit" },
                }
              },
              { $addFields: { total_balance: { $subtract: ["$total_debit", "$total_credit"] } } }
            ])
            const ARData: any = await findAR
            const totalBalanceAR = ARData.length === 1 ? ARData[0].total_balance : 0

            //@Find Account Payable Balance by year month
            const findAP = await GeneralJournal.aggregate([
              { $addFields: { year: { $year: { date: "$record_date", timezone: "Asia/Bangkok" } } } },
              { $addFields: { month: { $month: { date: "$record_date", timezone: "Asia/Bangkok" } } } },
              { $match: { year: currentYear } },
              { $match: { month: element } },
              { $unwind: "$journal_entries" },
              {
                $lookup: {
                  from: "chartofaccounts",
                  localField: "journal_entries.chart_account_id",
                  foreignField: "_id",
                  as: "chart_account_info"
                }
              },
              { $unwind: "$chart_account_info" },
              { $match: { "chart_account_info.account_type": "Account Payable" } },
              {
                $group: {
                  _id: null,
                  total_credit: { $sum: "$journal_entries.credit" },
                  total_debit: { $sum: "$journal_entries.debit" },
                }
              },
              { $addFields: { total_balance: { $subtract: ["$total_debit", "$total_credit"] } } }
            ])
            const APData: any = await findAP
            const totalBalanceAP = APData.length === 1 ? APData[0].total_balance : 0

            return {
              month: monthInYearString[index],
              balanceAR: totalBalanceAR,
              balanceAP: totalBalanceAP,
            }
          })

        )
        const getARandAP = await findARandAp

        return getARandAP

      } catch {

      }
    },
    getExpenseByDepartment: async (_root: undefined, { department_id, fromDate, toDate }: { department_id: string, fromDate: String, toDate: String }) => {
      try {
        let selected_date = {}

        if (fromDate && toDate) {
          const startDate = new Date(`${fromDate}T00:00:00.000Z`)
          const endDate = new Date(`${toDate}T16:59:59.999Z`)
          selected_date = { record_date: { $gte: startDate, $lte: endDate } }
        }

        let summmaryByDepartment = async (accountType: string, increase: string) => {
          const findAccount = await ChartOfAccount.aggregate([
            { $match: { account_type: accountType } },
            { $match: { department_id: new mongoose.Types.ObjectId(department_id) } },
            {
              $project: {
                account_name: 1,
                is_parents: 1
              }
            },
            { $sort: { createdAt: 1 } }
          ])
          // console.log(findAccount, "findAccount")
          const findSummmary = Promise.all(
            findAccount.map(async element => {
              const findSelectedDateBalance = await GeneralJournal.aggregate([
                { $unwind: "$journal_entries" },
                { $match: selected_date },
                { $match: { "journal_entries.chart_account_id": element._id } },
                {
                  $group: {
                    _id: null,
                    total_debit: { $sum: "$journal_entries.debit" },
                    total_credit: { $sum: "$journal_entries.credit" },
                  }
                },
              ])

              let selectedDateBalance = findSelectedDateBalance.length > 0 ? findSelectedDateBalance[0].total_credit - findSelectedDateBalance[0].total_debit : 0
              if (increase === "Debit") {
                selectedDateBalance = findSelectedDateBalance.length > 0 ? findSelectedDateBalance[0].total_debit - findSelectedDateBalance[0].total_credit : 0
              }

              return {
                account_name: element.account_name,
                is_parents: element.is_parents,
                selectedDateBalance: selectedDateBalance,
              }
            })
          )

          const getSummary = await findSummmary
       
          const findOtherSelectedDateBalance = getSummary.filter((e: any) => e.is_parents === true).map((e: any) => e.selectedDateBalance).reduce((a, b) => a + b, 0)

          const prepareData = []
          getSummary.map((e: any) => {
            if (e.is_parents === false) {
              prepareData.push({
                account_name: e.account_name,
                balance: e.selectedDateBalance,
              })
            }
          })
          
          // const findDepartment = await Department.findById(department_id)
          // const otherAccName = findDepartment.department_name.split("").slice(0, 3).join('').toUpperCase()
       
          //Push other 
          prepareData.push({
            // account_name: `${otherAccName} - Miscellaneous`,
            account_name: "Other Expenses",
            balance: findOtherSelectedDateBalance,
          })

          return prepareData
        }

        const getExpense = await summmaryByDepartment("Expenditures", "Debit")

        return getExpense

      } catch (error) {

      }
    },
    getRevenueByDepartment: async (_root: undefined, { department_id, fromDate, toDate }: { department_id: string, fromDate: String, toDate: String }) => {
      try {
        let selected_date = {}

        if (fromDate && toDate) {
          const startDate = new Date(`${fromDate}T00:00:00.000Z`)
          const endDate = new Date(`${toDate}T16:59:59.999Z`)
          selected_date = { record_date: { $gte: startDate, $lte: endDate } }
        }

        let summmaryByDepartment = async (accountType: string, increase: string) => {
          const findAccount = await ChartOfAccount.aggregate([
            { $match: { account_type: accountType } },
            { $match: { department_id: new mongoose.Types.ObjectId(department_id) } },
            {
              $project: {
                account_name: 1,
                is_parents: 1
              }
            },
            { $sort: { createdAt: 1 } }
          ])

          const findSummmary = Promise.all(
            findAccount.map(async element => {
              const findSelectedDateBalance = await GeneralJournal.aggregate([
                { $unwind: "$journal_entries" },
                { $match: selected_date },
                { $match: { "journal_entries.chart_account_id": element._id } },
                {
                  $group: {
                    _id: null,
                    total_debit: { $sum: "$journal_entries.debit" },
                    total_credit: { $sum: "$journal_entries.credit" },
                  }
                },
              ])

              let selectedDateBalance = findSelectedDateBalance.length > 0 ? findSelectedDateBalance[0].total_credit - findSelectedDateBalance[0].total_debit : 0
              if (increase === "Debit") {
                selectedDateBalance = findSelectedDateBalance.length > 0 ? findSelectedDateBalance[0].total_debit - findSelectedDateBalance[0].total_credit : 0
              }

              return {
                account_name: element.account_name,
                is_parents: element.is_parents,
                selectedDateBalance: selectedDateBalance,
              }
            })
          )

          const getSummary = await findSummmary
          // console.log(getSummary, "getSummary")
          const findOtherSelectedDateBalance = getSummary.filter((e: any) => e.is_parents === true).map((e: any) => e.selectedDateBalance).reduce((a, b) => a + b, 0)

          const prepareData = []
          getSummary.map((e: any) => {
            if (e.is_parents === false) {
              prepareData.push({
                account_name: e.account_name,
                balance: e.selectedDateBalance,
              })
            }
          })
          //Push other 
          prepareData.push({
            account_name: "Other Revenues",
            balance: findOtherSelectedDateBalance,
          })

          return prepareData
        }

        const getRevenue = await summmaryByDepartment("Revenues", "Credit")

        return getRevenue

      } catch (error) {

      }
    },

    getCostOfSaleByDepartment: async (_root: undefined, { department_id, fromDate, toDate }: { department_id: string, fromDate: String, toDate: String }) => {
      try {
        let selected_date = {}

        if (fromDate && toDate) {
          const startDate = new Date(`${fromDate}T00:00:00.000Z`)
          const endDate = new Date(`${toDate}T16:59:59.999Z`)
          selected_date = { record_date: { $gte: startDate, $lte: endDate } }
        }

        let summmaryByDepartment = async (accountType: string, increase: string) => {
          const findAccount = await ChartOfAccount.aggregate([
            { $match: { account_type: accountType } },
            { $match: { department_id: new mongoose.Types.ObjectId(department_id) } },
            {
              $project: {
                account_name: 1,
                is_parents: 1
              }
            },
            { $sort: { createdAt: 1 } }
          ])

          const findSummmary = Promise.all(
            findAccount.map(async element => {
              const findSelectedDateBalance = await GeneralJournal.aggregate([
                { $unwind: "$journal_entries" },
                { $match: selected_date },
                { $match: { "journal_entries.chart_account_id": element._id } },
                {
                  $group: {
                    _id: null,
                    total_debit: { $sum: "$journal_entries.debit" },
                    total_credit: { $sum: "$journal_entries.credit" },
                  }
                },
              ])

              let selectedDateBalance = findSelectedDateBalance.length > 0 ? findSelectedDateBalance[0].total_credit - findSelectedDateBalance[0].total_debit : 0
              if (increase === "Debit") {
                selectedDateBalance = findSelectedDateBalance.length > 0 ? findSelectedDateBalance[0].total_debit - findSelectedDateBalance[0].total_credit : 0
              }

              return {
                account_name: element.account_name,
                is_parents: element.is_parents,
                selectedDateBalance: selectedDateBalance,
              }
            })
          )

          const getSummary = await findSummmary
          // console.log(getSummary, "getSummary")
          const findOtherSelectedDateBalance = getSummary.filter((e: any) => e.is_parents === true).map((e: any) => e.selectedDateBalance).reduce((a, b) => a + b, 0)

          const prepareData = []
          getSummary.map((e: any) => {
            if (e.is_parents === false) {
              prepareData.push({
                account_name: e.account_name,
                balance: e.selectedDateBalance,
              })
            }
          })
          //Push other 
          prepareData.push({
            account_name: "Other Cost",
            balance: findOtherSelectedDateBalance,
          })

          return prepareData
        }

        const getRevenue = await summmaryByDepartment("Cost", "Debit")

        return getRevenue

      } catch (error) {

      }
    },
  }

};

export default dashboardResolver