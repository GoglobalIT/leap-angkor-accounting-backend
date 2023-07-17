

import Department from '../models/department';
import GeneralJournal from '../models/generalJournal';
import ChartOfAccount from '../models/chartOfAccount';
import mongoose from 'mongoose';
import moment from 'moment';


const income_statement = async (department_id: string, fromDate: string, toDate: string, form: string )=>{
    try {
        let selected_date = {}
        let year_to_date = {}
        if(fromDate && toDate ){
          const startDate = new Date(`${fromDate}T00:00:00.000Z`)
          const endDate = new Date(`${toDate}T16:59:59.999Z`)
          selected_date = {record_date: {$gte: startDate, $lte: endDate}}

          const startYearToDate = new Date(`${moment().format("YYYY-01-01")}T00:00:00.000Z`)
          year_to_date = {record_date: {$gte: startYearToDate, $lte: endDate}}
        }

        const departments = await Department.find({_id: {$ne: '64a52c65ad409eb75c87d8e1'}})

        if(department_id === "64a52c65ad409eb75c87d8e1"){
            //@Find Revenue Cost and Expense by all department
            let summmaryByDepartment = (accountType: string, increase: string)=>{
                const findRevenueOrCost =  Promise.all(
                    departments.map(async element => {
                        const findRevenueAccount = await ChartOfAccount.find({$and:[
                            {account_type: accountType},
                            {department_id: element._id}
                        ]})
                        const allRevenueAccount = findRevenueAccount.map(e => e._id)
                        const findRevenueSelectedDate = await GeneralJournal.aggregate([
                            {$unwind: "$journal_entries"},
                            {$match: selected_date},
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
                            {$match: year_to_date},
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

            //@Find expense by expense type
            const allExpenseAccount = await ChartOfAccount.aggregate([
                {$match: {account_type: "Expenditures"}},
                {$group: {
                    _id:"$expense_type_id",
                }},
                {$lookup: {
                    from: "expensetypes",
                    localField: "_id",
                    foreignField: "_id",
                    as: "expense_type"
                }},
                {$unwind: "$expense_type"},
                {$project: {
                    expense_name: "$expense_type.expense_name"
                }}
            ])
        
            const expenseByChartAccount = Promise.all(
                allExpenseAccount.map(async (element)=>{
                    if(element !== null){
                        const findExpenseSelectedDate = await GeneralJournal.aggregate([
                            {$match: selected_date},
                            {$unwind: "$journal_entries"},
                            {$lookup: {
                                from: "chartofaccounts",
                                localField: "journal_entries.chart_account_id",
                                foreignField: "_id",
                                as: "chart_account"
                            }},
                            {$unwind: "$chart_account"},
                            {$match: {"chart_account.account_type": "Expenditures"}},
                            {$match: {"chart_account.expense_type_id": element._id}},
                            {$group: {
                              _id: null,
                              total_debit: {$sum: "$journal_entries.debit"},
                              total_credit: {$sum: "$journal_entries.credit"},
                            }},
                        ])
                        // console.log(findExpenseSelectedDate, "findExpenseSelectedDate")
                        const expenseSelectedDate = findExpenseSelectedDate.length > 0 ?  findExpenseSelectedDate[0].total_debit - findExpenseSelectedDate[0].total_credit : 0

                        const findExpenseYearToDate = await GeneralJournal.aggregate([
                            {$match: selected_date},
                            {$unwind: "$journal_entries"},
                            {$lookup: {
                                from: "chartofaccounts",
                                localField: "journal_entries.chart_account_id",
                                foreignField: "_id",
                                as: "chart_account"
                            }},
                            {$unwind: "$chart_account"},
                            {$match: {"chart_account.account_type": "Expenditures"}},
                            {$match: {"chart_account.expense_type_id": element._id}},
                            {$group: {
                              _id: null,
                              total_debit: {$sum: "$journal_entries.debit"},
                              total_credit: {$sum: "$journal_entries.credit"},
                            }},
                        ])
                        // console.log(findExpenseSelectedDate, "findExpenseSelectedDate")
                        const expenseYearToDate = findExpenseYearToDate.length > 0 ?  findExpenseYearToDate[0].total_debit - findExpenseYearToDate[0].total_credit : 0

                        return {
                            account_name: element.expense_name,
                            selectedDateBalance: expenseSelectedDate,
                            yearToDateBalance: expenseYearToDate
                        }
                    }

                })
            )
        }else{
            
        }

    } catch (error) {
        
    }
}

export default income_statement