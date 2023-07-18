
import balanceSheet from '../../functions/balanceSheet'
import incomeStatement from '../../functions/incomeStatement';
import Department from '../../models/department';
import GeneralJournal from '../../models/generalJournal';
import ChartOfAccount from '../../models/chartOfAccount';
import mongoose from 'mongoose';
import moment from 'moment';


const reportResolver = {
    Query: {
        getBarChart: (_root: undefined, { _id }: { _id: String }, req: any) => {
            return "Dashboard query write in a separagte file for make easy find later"
        },
        balanceSheetReport: async (_root: undefined, { fromDate, toDate }: { fromDate: string, toDate: string }) => {
            try {
                // console.log(fromDate, "from Date")
                // console.log(toDate, "toDate")
                const getBalanceSheetAsset = await balanceSheet(['Cash', 'Account Receiveable', 'Inventory and Fixed Assets'], fromDate, toDate)
                const getBalanceSheetLiability = await balanceSheet(['Account Payable'], fromDate, toDate)
                const getBalanceSheetEquity = await balanceSheet(['Revenues', 'Cost', 'Expenditures', 'Capitals'], fromDate, toDate)

                const total_asset_balance = getBalanceSheetAsset.length > 0 ? getBalanceSheetAsset.map(e => e.total_balance).reduce((a, b) => a + b, 0) : 0
                const total_liability_balance = getBalanceSheetLiability.length > 0 ? getBalanceSheetLiability.map(e => e.total_balance).reduce((a, b) => a + b, 0) : 0
                const total_equity_balance = getBalanceSheetEquity.length > 0 ? getBalanceSheetEquity.map(e => e.total_balance).reduce((a, b) => a + b, 0) : 0


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
        incomeStatementReport: async (_root: undefined, { department_id, fromDate, toDate, form }: { department_id: string, fromDate: string, toDate: string, form: string }) => {
            try {
                let selected_date = {}
                let year_to_date = {}
                if (fromDate && toDate) {
                    const startDate = new Date(`${fromDate}T00:00:00.000Z`)
                    const endDate = new Date(`${toDate}T16:59:59.999Z`)
                    selected_date = { record_date: { $gte: startDate, $lte: endDate } }

                    const startYearToDate = new Date(`${moment().format("YYYY-01-01")}T00:00:00.000Z`)
                    year_to_date = { record_date: { $gte: startYearToDate, $lte: endDate } }
                }

                const departments = await Department.find({ _id: { $ne: '64a52c65ad409eb75c87d8e1' } })

                if (department_id === "64a52c65ad409eb75c87d8e1") {
                    //@Find Revenue Cost and Expense by all department
                    let summmaryByDepartment = (accountType: string, increase: string) => {
                        const findSummmary = Promise.all(
                            departments.map(async element => {
                                const findAccount = await ChartOfAccount.find({
                                    $and: [
                                        { account_type: accountType },
                                        { department_id: element._id }
                                    ]
                                })
                                const allAccount = findAccount.map(e => e._id)
                                const findSelectedDateBalance = await GeneralJournal.aggregate([
                                    { $unwind: "$journal_entries" },
                                    { $match: selected_date },
                                    { $match: { "journal_entries.chart_account_id": { $in: allAccount } } },
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

                                const findYearToDateBalance = await GeneralJournal.aggregate([
                                    { $unwind: "$journal_entries" },
                                    { $match: year_to_date },
                                    { $match: { "journal_entries.chart_account_id": { $in: allAccount } } },
                                    {
                                        $group: {
                                            _id: null,
                                            total_debit: { $sum: "$journal_entries.debit" },
                                            total_credit: { $sum: "$journal_entries.credit" },
                                        }
                                    },
                                ])
                                let yearToDateBalance = findYearToDateBalance.length > 0 ? findYearToDateBalance[0].total_credit - findYearToDateBalance[0].total_debit : 0
                                if (increase === "Debit") {
                                    yearToDateBalance = findYearToDateBalance.length > 0 ? findYearToDateBalance[0].total_debit - findYearToDateBalance[0].total_credit : 0
                                }

                                return {
                                    account_name: element.department_name,
                                    selectedDateBalance: selectedDateBalance,
                                    yearToDateBalance: yearToDateBalance
                                }
                            })
                        )

                        return findSummmary
                    }

                    //@Find expense by expense type
                    const allExpenseAccount = await ChartOfAccount.aggregate([
                        { $match: { account_type: "Expenditures" } },
                        {
                            $group: {
                                _id: "$expense_type_id",
                            }
                        },
                        {
                            $lookup: {
                                from: "expensetypes",
                                localField: "_id",
                                foreignField: "_id",
                                as: "expense_type"
                            }
                        },
                        { $unwind: "$expense_type" },
                        { $sort: {"expense_type.createdAt": 1}},
                        {
                            $project: {
                                expense_name: "$expense_type.expense_name"
                            }
                        }
                    ])

                    const expenseByChartAccount = Promise.all(
                        allExpenseAccount.map(async (element) => {
                            if (element !== null) {
                                const findExpenseSelectedDate = await GeneralJournal.aggregate([
                                    { $match: selected_date },
                                    { $unwind: "$journal_entries" },
                                    {
                                        $lookup: {
                                            from: "chartofaccounts",
                                            localField: "journal_entries.chart_account_id",
                                            foreignField: "_id",
                                            as: "chart_account"
                                        }
                                    },
                                    { $unwind: "$chart_account" },
                                    { $match: { "chart_account.account_type": "Expenditures" } },
                                    { $match: { "chart_account.expense_type_id": element._id } },
                                    {
                                        $group: {
                                            _id: null,
                                            total_debit: { $sum: "$journal_entries.debit" },
                                            total_credit: { $sum: "$journal_entries.credit" },
                                        }
                                    },
                                ])

                                const expenseSelectedDate = findExpenseSelectedDate.length > 0 ? findExpenseSelectedDate[0].total_debit - findExpenseSelectedDate[0].total_credit : 0

                                const findExpenseYearToDate = await GeneralJournal.aggregate([
                                    { $match: selected_date },
                                    { $unwind: "$journal_entries" },
                                    {
                                        $lookup: {
                                            from: "chartofaccounts",
                                            localField: "journal_entries.chart_account_id",
                                            foreignField: "_id",
                                            as: "chart_account"
                                        }
                                    },
                                    { $unwind: "$chart_account" },
                                    { $match: { "chart_account.account_type": "Expenditures" } },
                                    { $match: { "chart_account.expense_type_id": element._id } },
                                    {
                                        $group: {
                                            _id: null,
                                            total_debit: { $sum: "$journal_entries.debit" },
                                            total_credit: { $sum: "$journal_entries.credit" },
                                        }
                                    },
                                ])

                                const expenseYearToDate = findExpenseYearToDate.length > 0 ? findExpenseYearToDate[0].total_debit - findExpenseYearToDate[0].total_credit : 0

                                return {
                                    account_name: element.expense_name,
                                    selectedDateBalance: expenseSelectedDate,
                                    yearToDateBalance: expenseYearToDate
                                }
                            }

                        })
                    )

                    const revenues = await summmaryByDepartment("Revenues", "Credit")
                    const totalRevenueSelectedDate = revenues.map(e => e.selectedDateBalance).reduce((a, b) => a + b, 0)
                    const totalRevenueYearToDate = revenues.map(e => e.yearToDateBalance).reduce((a, b) => a + b, 0)

                    const costOfSales = await summmaryByDepartment("Cost", "Debit")
                    const totalCostSelectedDate = costOfSales.map(e => e.selectedDateBalance).reduce((a, b) => a + b, 0)
                    const totalCostYearToDate = costOfSales.map(e => e.yearToDateBalance).reduce((a, b) => a + b, 0)


                    let expense: any = [{}]
                    let totalExpenseSelectedDate = 0
                    let totalexpenseYearToDate = 0
                    if (form === '1') {
                        expense = await expenseByChartAccount
                        totalExpenseSelectedDate = expense.map((e: any) => e.selectedDateBalance).reduce((a: any, b: any) => a + b, 0)
                        totalexpenseYearToDate = expense.map((e: any) => e.yearToDateBalance).reduce((a: any, b: any) => a + b, 0)
                    } else {
                        expense = await summmaryByDepartment("Expenditures", "Debit")
                        totalExpenseSelectedDate = expense.map((e: any) => e.selectedDateBalance).reduce((a: any, b: any) => a + b, 0)
                        totalexpenseYearToDate = expense.map((e: any) => e.yearToDateBalance).reduce((a: any, b: any) => a + b, 0)
                    }

                    const grossProfitSelectedDateBalance = totalRevenueSelectedDate - totalCostSelectedDate
                    const grossProfitYearToDateBalance = totalRevenueYearToDate - totalCostYearToDate

                    const netIncomeSelectedDateBalance = grossProfitSelectedDateBalance - totalExpenseSelectedDate
                    const netIncomeYearToDateBalance = grossProfitYearToDateBalance - totalexpenseYearToDate

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
                        expenses: expense,
                        totalExpense: {
                            selectedDateBalance: totalExpenseSelectedDate,
                            yearToDateBalance: totalexpenseYearToDate
                        },
                        grossProfit: {
                            selectedDateBalance: grossProfitSelectedDateBalance,
                            yearToDateBalance: grossProfitYearToDateBalance
                        },
                        netIncome: {
                            selectedDateBalance: netIncomeSelectedDateBalance,
                            yearToDateBalance: netIncomeYearToDateBalance
                        }
                    }


                } else {


                    //@Find Revenue Cost and Expense by all department
                    let summmaryByDepartment = async (accountType: string, increase: string) => {
                        const findAccount = await ChartOfAccount.aggregate([
                            {$match: {account_type: accountType}},
                            {$match: {department_id: new mongoose.Types.ObjectId(department_id)}},
                            {$project: {
                                account_name: 1,
                                is_parents: 1
                            }},
                            {$sort: {createdAt: 1}}
                        ])
                        console.log(findAccount, "findAccount")
                       
                        const findSummmary = Promise.all(
                            findAccount.map(async element => {
                                console.log(element, "element")
                                const findSelectedDateBalance = await GeneralJournal.aggregate([
                                    { $unwind: "$journal_entries" },
                                    { $match: selected_date },
                                    { $match: { "journal_entries.chart_account_id":  element._id  } },
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

                                const findYearToDateBalance = await GeneralJournal.aggregate([
                                    { $unwind: "$journal_entries" },
                                    { $match: year_to_date },
                                    { $match: { "journal_entries.chart_account_id":  element._id  } },
                                    {
                                        $group: {
                                            _id: null,
                                            total_debit: { $sum: "$journal_entries.debit" },
                                            total_credit: { $sum: "$journal_entries.credit" },
                                        }
                                    },
                                ])
                                let yearToDateBalance = findYearToDateBalance.length > 0 ? findYearToDateBalance[0].total_credit - findYearToDateBalance[0].total_debit : 0
                                if (increase === "Debit") {
                                    yearToDateBalance = findYearToDateBalance.length > 0 ? findYearToDateBalance[0].total_debit - findYearToDateBalance[0].total_credit : 0
                                }

                                return {
                                    account_name: element.account_name,
                                    is_parents: element.is_parents,
                                    selectedDateBalance: selectedDateBalance,
                                    yearToDateBalance: yearToDateBalance
                                }
                            })
                        )
                        
                        const getSummary = await findSummmary
                        // console.log(getSummary, "getSummary")
                        const findOtherSelectedDateBalance = getSummary.filter((e:any)=>e.is_parents === true).map((e:any)=>e.selectedDateBalance).reduce((a, b)=>a + b, 0)
                        const findOtherYearToDateBalance = getSummary.filter((e:any)=>e.is_parents === true).map((e:any)=>e.yearToDateBalance).reduce((a, b)=>a + b, 0)

                        const prepareData = []
                        getSummary.map((e:any)=>{
                            if(e.is_parents === false){
                                prepareData.push({
                                    account_name: e.account_name,
                                    selectedDateBalance: e.selectedDateBalance,
                                    yearToDateBalance: e.yearToDateBalance
                                })
                            }
                        })
                        //Push other 
                        prepareData.push({
                            account_name: "Other",
                            selectedDateBalance: findOtherSelectedDateBalance,
                            yearToDateBalance: findOtherYearToDateBalance
                        })

                        return prepareData
                    }

                    const revenues = await summmaryByDepartment("Revenues", "Credit")
                    const totalRevenueSelectedDate = revenues.map(e => e.selectedDateBalance).reduce((a, b) => a + b, 0)
                    const totalRevenueYearToDate = revenues.map(e => e.yearToDateBalance).reduce((a, b) => a + b, 0)

                    const costOfSales = await summmaryByDepartment("Cost", "Debit")
                    const totalCostSelectedDate = costOfSales.map(e => e.selectedDateBalance).reduce((a, b) => a + b, 0)
                    const totalCostYearToDate = costOfSales.map(e => e.yearToDateBalance).reduce((a, b) => a + b, 0)

                    const expense = await summmaryByDepartment("Expenditures", "Debit")
                    const totalExpenseSelectedDate = expense.map((e: any) => e.selectedDateBalance).reduce((a: any, b: any) => a + b, 0)
                    const totalexpenseYearToDate = expense.map((e: any) => e.yearToDateBalance).reduce((a: any, b: any) => a + b, 0)

                    const grossProfitSelectedDateBalance = totalRevenueSelectedDate - totalCostSelectedDate
                    const grossProfitYearToDateBalance = totalRevenueYearToDate - totalCostYearToDate

                    const netIncomeSelectedDateBalance = grossProfitSelectedDateBalance - totalExpenseSelectedDate
                    const netIncomeYearToDateBalance = grossProfitYearToDateBalance - totalexpenseYearToDate

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
                        expenses: expense,
                        totalExpense: {
                            selectedDateBalance: totalExpenseSelectedDate,
                            yearToDateBalance: totalexpenseYearToDate
                        },
                        grossProfit: {
                            selectedDateBalance: grossProfitSelectedDateBalance,
                            yearToDateBalance: grossProfitYearToDateBalance
                        },
                        netIncome: {
                            selectedDateBalance: netIncomeSelectedDateBalance,
                            yearToDateBalance: netIncomeYearToDateBalance
                        }
                    }

                    // const getIncomeStatmentRevenue = await incomeStatement(department_id, 'Revenues', fromDate, toDate)
                    // console.log(getIncomeStatmentRevenue, "getIncomeStatmentRevenue")

                }
               
            } catch (error) {

            }
        }
    }

};

export default reportResolver