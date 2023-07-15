// const balance_sheet = require('../../function/generateBalanceSheet')
import balance_sheet from '../../functions/generateBalanceSheet'
import balanceSheet from '../../functions/balanceSheet'
import Department from '../../models/department';
import GeneralJournal from '../../models/generalJournal';
import ChartOfAccount from '../../models/chartOfAccount';
import { promises } from 'dns';


const reportResolver = {
    Query: {
        getBarChart: (_root: undefined, { _id }: { _id: String }, req: any) => {
            return "Dashboard query write in a separagte file for make easy find later"
        },
        balanceSheetReport: async (_root: undefined, { fromDate, toDate }: { fromDate: string, toDate: string }) => {
            try {

                const getBalanceSheetAsset = await balanceSheet(['Cash', 'Account Receiveable', 'Inventory and Fixed Assets'], fromDate, toDate)
                const getBalanceSheetLiability = await balanceSheet(['Account Payable'], fromDate, toDate)
                const getBalanceSheetEquity = await balanceSheet(['Revenues', 'Cost', 'Expenditures', 'Capitals'], fromDate, toDate)

                const total_asset_balance = getBalanceSheetAsset.length > 0 ? getBalanceSheetAsset.map(e=>e.total_balance).reduce((a,b)=>a+b, 0) : 0
                const total_liability_balance = getBalanceSheetLiability.length > 0 ? getBalanceSheetLiability.map(e=>e.total_balance).reduce((a,b)=>a+b, 0) : 0
                const total_equity_balance = getBalanceSheetEquity.length > 0 ? getBalanceSheetEquity.map(e=>e.total_balance).reduce((a,b)=>a+b, 0) : 0


                const balanceSheetData = {
                    asset: getBalanceSheetAsset,
                    total_asset: total_asset_balance,
                    liability: getBalanceSheetLiability,
                    total_liability: total_liability_balance,
                    equity: getBalanceSheetEquity,
                    total_equity: total_equity_balance,
                    total_liability_and_equity: total_liability_balance + total_equity_balance
                }

                return balanceSheetData

            } catch (error) {

            }
        },
        incomeStatementReport: async(_root: undefined, {department_id, fromDate, toDate }: {department_id: string, fromDate: string, toDate: string }) =>{
            try {
                let transaction_date_match = {}
                if(fromDate && toDate ){
                  const startDate = new Date(`${fromDate}T00:00:00.000Z`)
                  const endDate = new Date(`${toDate}T16:59:59.999Z`)
                  transaction_date_match = {record_date: {$gte: startDate, $lte: endDate}}
                }
                const departments = await Department.find({_id: {$ne: '64a52c65ad409eb75c87d8e1'}})

                if(department_id === "64a52c65ad409eb75c87d8e1"){
                    
                    let revenueOrCost = (accountType: string, increase: string)=>{
                        const findRevenueOrCost =  Promise.all(
                            departments.map(async element => {
                                const findRevenueAccount = await ChartOfAccount.find({$and:[
                                    {account_type: accountType},
                                    {department_id: element._id}
                                ]})
                                const allRevenueAccount = findRevenueAccount.map(e => e._id)
                                const findRevenueSelectedDate = await GeneralJournal.aggregate([
                                    {$unwind: "$journal_entries"},
                                    {$match: transaction_date_match},
                                    {$match: {"journal_entries.chart_account_id": {$in: allRevenueAccount}}},
                                    {$group: {
                                      _id: null,
                                      total_debit: {$sum: "$journal_entries.debit"},
                                      total_credit: {$sum: "$journal_entries.credit"},
                                    }},
                                ])
                                let revenueSelectedDate = findRevenueSelectedDate.length > 0 ? findRevenueSelectedDate[0].total_credit - findRevenueSelectedDate[0].total_debit : 0
                                if(increase === "Debit"){
                                    revenueSelectedDate = findRevenueSelectedDate.length > 0 ? findRevenueSelectedDate[0].total_credit - findRevenueSelectedDate[0].total_debit : 0
                                }
        
                                const findRevenueYearToDate = await GeneralJournal.aggregate([
                                    {$unwind: "$journal_entries"},
                                    // {$match: transaction_date_match},
                                    {$match: {"journal_entries.chart_account_id": {$in: allRevenueAccount}}},
                                    {$group: {
                                      _id: null,
                                      total_debit: {$sum: "$journal_entries.debit"},
                                      total_credit: {$sum: "$journal_entries.credit"},
                                    }},
                                ])
                                let revenueYearToDate = findRevenueYearToDate.length > 0 ? findRevenueYearToDate[0].total_credit - findRevenueYearToDate[0].total_debit : 0
                                if(increase === "Debit"){
                                    revenueYearToDate = findRevenueYearToDate.length > 0 ?  findRevenueYearToDate[0].total_debit - findRevenueYearToDate[0].total_credit : 0
                                }
                                
                                return {
                                    account_name: element.department_name,
                                    selectedDateBalance: revenueSelectedDate,
                                    yearToDateBalance: revenueYearToDate
                                }
                            })
                        )
                      
                        return findRevenueOrCost
                    }

                    const revenues = await revenueOrCost("Revenues", "Credit")
                    const totalRevenueSelectedDate = revenues.map(e=>e.selectedDateBalance).reduce((a, b)=>a + b, 0)
                    const totalRevenueYearToDate = revenues.map(e=>e.yearToDateBalance).reduce((a, b)=>a + b, 0)

                    const costOfSales = await revenueOrCost("Cost", "Debit")
                    const totalCostSelectedDate = costOfSales.map(e=>e.selectedDateBalance).reduce((a, b)=>a + b, 0)
                    const totalCostYearToDate = costOfSales.map(e=>e.yearToDateBalance).reduce((a, b)=>a + b, 0)
      
                    const grossProfitSelectedDateBalance = totalRevenueSelectedDate-totalCostSelectedDate
                    const grossProfitYearToDateBalance = totalRevenueYearToDate-totalCostYearToDate

                    // const expenses = await GeneralJournal.aggregate

                    return {
                        revenues: revenues,
                        totalRevenue: {
                            selectedDateBalance: totalRevenueSelectedDate,
                            yearToDateBalance: totalRevenueYearToDate
                        },
                        costOfSales: costOfSales,
                        totalCost: {
                            selectedDateBalance: totalCostSelectedDate,
                            yearToDateBalance: totalCostYearToDate
                        },
                        expenses: [{}],
                        totalExpense: {},
                        grossProfit: {
                            selectedDateBalance: grossProfitSelectedDateBalance,
                            yearToDateBalance: grossProfitYearToDateBalance
                        },
                        netIncome: 0
                    }
                }else{

                }
                // const revenue = 
            } catch (error) {
                
            }
        }
    }

};

export default reportResolver