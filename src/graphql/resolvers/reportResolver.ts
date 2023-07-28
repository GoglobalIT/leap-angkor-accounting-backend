
// import balanceSheet from '../../functions/balanceSheet'
import Department from '../../models/department';
import GeneralJournal from '../../models/generalJournal';
import ChartOfAccount from '../../models/chartOfAccount';
import mongoose from 'mongoose';
import moment from 'moment';
import getBalanceChartAccount from '../../functions/getBalanceByChartAccount';
import { iChartOfAccount } from '../../interface/iChartOfAccount'


const reportResolver = {
    Query: {
        balanceSheetReport: async (_root: undefined, { year, month }: { year: string, month: string }) => {
            try {
   
                const lastDayCurrMonth = new Date(Number(year), Number(month), 0).getDate();
                const curr_month_from_date = `${year}-${month}-01`
                const curr_month_to_date = `${year}-${month}-${lastDayCurrMonth}`
            
                const balanceSheet = async (accountType: Array<string>, start_date: string, end_date: string) => {

                    const last_month_to_date = moment(start_date).subtract(1, 'days').format("YYYY-MM-DD")
                    const last_month_from_date = moment(last_month_to_date).format("YYYY-MM-01")

                    //@Parent Account, we need it becasue it already have tree data form
                    const getParentsChartAccount = await ChartOfAccount.find({
                        $and: [
                            { is_top_parents: true },
                            { department_id: '64a52c65ad409eb75c87d8e1' },
                            { account_type: { $in: accountType } },
                        ]
                    })
                    //@All Account by many chart account type, we need to find balance for each account for use it in RECURSIVE Function
                    const getAccountByType = await ChartOfAccount.find({
                        $and: [
                            { department_id: '64a52c65ad409eb75c87d8e1' },
                            { account_type: { $in: accountType } },
                        ]
                    })
                    //@Find Balance of each account with getBalanceChartAccount() function
                    const findBalanceOfChartAccount = Promise.all(
                        getAccountByType.map(async element => {
                            const currentMonthBalance = await getBalanceChartAccount(element._id.toString(), start_date, end_date)
                            const lastMonthBalance = await getBalanceChartAccount(element._id.toString(), last_month_from_date, last_month_to_date)

                            return {
                                _id: element._id,
                                account_name: element.account_name,
                                total_balance: {
                                    current_month_balance: currentMonthBalance.total_balance,
                                    last_month_balance: lastMonthBalance.total_balance
                                }
                            }
                        })
                    )
                    const ChartAccountWithBalance = await findBalanceOfChartAccount
                    

                    // ***RECURSIVE Function */ find balance of a parents account from top parent to the last sub-account with tree data form
                    const generateBalanceTreeData = (chartAccountInfo: any, chartAccountWithBalance: Array<any>) => {
                        let chart_account_tree_data = chartAccountInfo
                        const findBalanceByAccountId = chartAccountWithBalance.find(e => e._id + "" === chartAccountInfo._id + "")
                        if (findBalanceByAccountId) {
                            chart_account_tree_data.total_balance = findBalanceByAccountId.total_balance
                        }
                        if (chart_account_tree_data.sub_account.length > 0) {
                            chart_account_tree_data.sub_account.map(async (element: any) => {
                                generateBalanceTreeData(element, chartAccountWithBalance)
                            })
                        }

                        return chart_account_tree_data
                    }

                    //@Find balance of all parents account by use generateBalanceTreeData()
                    const generateBalanceSheet = getParentsChartAccount.map(element => {
                        const generateElement = generateBalanceTreeData(element, ChartAccountWithBalance)
                        return generateElement
                    })
                    
                    //@Find other balance or own balance of parent account, if parents account has it own balance we need to add other account into sub-account
                    const finalBalance = generateBalanceSheet.map(element => {
                        const totalBalanceSubAccountCurrMonth = element.sub_account.map((e: any) => e.total_balance.current_month_balance).reduce((a: any, b: any) => a + b, 0)
                        const totalBalanceSubAccountLastMonth = element.sub_account.map((e: any) => e.total_balance.last_month_balance).reduce((a: any, b: any) => a + b, 0)

                        if (totalBalanceSubAccountCurrMonth < element.total_balance.current_month_balance || 
                            totalBalanceSubAccountLastMonth < element.total_balance.last_month_balance) {
                            const newElement = element
                            newElement.sub_account.push({
                                account_name: "Other",
                                total_balance: {
                                    current_month_balance: element.total_balance.current_month_balance - totalBalanceSubAccountCurrMonth,
                                    last_month_balance: element.total_balance.last_month_balance - totalBalanceSubAccountLastMonth
                                },
                                
                            })
                            return newElement
                        } else {
                            return element
                        }

                    })
                
                    return finalBalance

                }

                const getBalanceSheetAsset = await balanceSheet(['Cash on hand', 'Cash in bank', 'Account Receivable', 'Inventory', 'Fixed Assets'], curr_month_from_date, curr_month_to_date)
                const getBalanceSheetLiability = await balanceSheet(['Account Payable'], curr_month_from_date, curr_month_to_date)
                const getBalanceSheetEquity = await balanceSheet(['Revenues', 'Cost', 'Expenditures', 'Capitals'], curr_month_from_date, curr_month_to_date)
                

                let balanceSheetData = {
                    asset: getBalanceSheetAsset,
                    total_asset: {
                        current_month_balance: getBalanceSheetAsset.length > 0 ? getBalanceSheetAsset.map(e => e.total_balance.current_month_balance).reduce((a, b) => a + b, 0) : 0,
                        last_month_balance: getBalanceSheetAsset.length > 0 ? getBalanceSheetAsset.map(e => e.total_balance.last_month_balance).reduce((a, b) => a + b, 0) : 0
                    },
                    liability: getBalanceSheetLiability,
                    total_liability: {
                        current_month_balance: getBalanceSheetLiability.length > 0 ? getBalanceSheetLiability.map(e => e.total_balance.current_month_balance).reduce((a, b) => a + b, 0) : 0,
                        last_month_balance: getBalanceSheetLiability.length > 0 ? getBalanceSheetLiability.map(e => e.total_balance.last_month_balance).reduce((a, b) => a + b, 0) : 0
                    },
                    equity: getBalanceSheetEquity,
                    total_equity: {
                        current_month_balance: getBalanceSheetEquity.length > 0 ? getBalanceSheetEquity.map(e => e.total_balance.current_month_balance).reduce((a, b) => a + b, 0) : 0,
                        last_month_balance: getBalanceSheetEquity.length > 0 ? getBalanceSheetEquity.map(e => e.total_balance.last_month_balance).reduce((a, b) => a + b, 0) : 0
                    },
                    total_liability_and_equity: {
                        current_month_balance: 0,
                        last_month_balance: 0
                    }
                }
                balanceSheetData.total_liability_and_equity.current_month_balance = balanceSheetData.total_liability.current_month_balance + balanceSheetData.total_equity.current_month_balance
                balanceSheetData.total_liability_and_equity.last_month_balance = balanceSheetData.total_liability.last_month_balance + balanceSheetData.total_equity.last_month_balance

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
                                is_parents: {$first:"$is_parents"}
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
                        { $sort: { "expense_type.createdAt": 1 } },
                        {
                            $project: {
                                expense_name: "$expense_type.expense_name",
                                is_parents: 1
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
                                    is_parents: element.is_parents,
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
                        const getSummary = await expenseByChartAccount
                        const findParentsBalance = getSummary.filter((e: any) => e.is_parents === true).map((e: any) => e.selectedDateBalance).reduce((a, b) => a + b, 0)
                        const dataAccountWithOther = []
                        getSummary.map((e: any) => {
                          if (e.is_parents === false) {
                            dataAccountWithOther.push({
                              account_name: e.account_name,
                              balance: e.selectedDateBalance,
                            })
                          }
                        })
                        // const findDepartment = await Department.findById(department_id)
                        // const otherAccName = findDepartment.department_name.split("").slice(0, 3).join('').toUpperCase()
                        //Push other 
                        dataAccountWithOther.push({
                          account_name: `Other Expenses`,
                          balance: findParentsBalance,
                        })
                        // console.log(dataAccountWithOther, "dataAccountWithOther")
                        expense = dataAccountWithOther
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

                                const findYearToDateBalance = await GeneralJournal.aggregate([
                                    { $unwind: "$journal_entries" },
                                    { $match: year_to_date },
                                    { $match: { "journal_entries.chart_account_id": element._id } },
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

                        const findOtherSelectedDateBalance = getSummary.filter((e: any) => e.is_parents === true).map((e: any) => e.selectedDateBalance).reduce((a, b) => a + b, 0)
                        const findOtherYearToDateBalance = getSummary.filter((e: any) => e.is_parents === true).map((e: any) => e.yearToDateBalance).reduce((a, b) => a + b, 0)

                        const prepareData = []
                        getSummary.map((e: any) => {
                            if (e.is_parents === false) {
                                prepareData.push({
                                    account_name: e.account_name,
                                    selectedDateBalance: e.selectedDateBalance,
                                    yearToDateBalance: e.yearToDateBalance
                                })
                            }
                        })
                        //Push other 
                        prepareData.push({
                            account_name: "Other Expenses",
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

                }

            } catch (error) {

            }
        },
        generalLedgerReport: async (_root: undefined, { fromDate, toDate }: { fromDate: string, toDate: string }) => {
            try {
                let selected_date = {}
                if (fromDate && toDate) {
                    const startDate = new Date(`${fromDate}T00:00:00.000Z`)
                    const endDate = new Date(`${toDate}T16:59:59.999Z`)
                    selected_date = { record_date: { $gte: startDate, $lte: endDate } }
                }

                //@Parent Account, we need it becasue it already have tree data form
                const getParentsChartAccount = await ChartOfAccount.find({
                    $and: [
                        { is_top_parents: true },
                        { department_id: '64a52c65ad409eb75c87d8e1' },
                    ]
                })
                //@All Account by many chart account type, we need to find balance for each account for use it in RECURSIVE Function
                const getAccountByType = await ChartOfAccount.find({
                    $and: [
                        { department_id: '64a52c65ad409eb75c87d8e1' },
                    ]
                })
                //@Find Balance of each account with getBalanceChartAccount() function
                const findBalanceOfChartAccount: any = Promise.all(
                    getAccountByType.map(async element => {
                        const findBalance = await getBalanceChartAccount(element._id.toString(), fromDate, toDate)

                        return {
                            _id: element._id,
                            account_name: element.account_name,
                            total_debit: findBalance.total_debit,
                            total_credit: findBalance.total_credit,
                            total_balance: findBalance.total_balance
                        }
                    })
                )
                const ChartAccountWithBalance = await findBalanceOfChartAccount


                //*** All Journal Entries for General Ledger*/
                const allJournalEntries = await GeneralJournal.aggregate([
                    { $match: selected_date },
                    { $unwind: "$journal_entries" },
                    {
                        $lookup: {
                            from: "chartofaccounts",
                            localField: "journal_entries.chart_account_id",
                            foreignField: "_id",
                            as: "chart_of_account_data"
                        }
                    },
                    { $unwind: "$chart_of_account_data" },
                    {
                        $project: {
                            transaction_title: 1,
                            journal_number: 1,
                            record_date: 1,
                            chart_account_id: "$journal_entries.chart_account_id",
                            description: "$journal_entries.description",
                            memo: 1,
                            credit: "$journal_entries.credit",
                            debit: "$journal_entries.debit",

                        }
                    }
                ]);


                // ***RECURSIVE Function */ find balance of a parents account from top parent to the last sub-account with tree data form
                const generateBalanceTreeData = (chartAccountInfo: any, chartAccountWithBalance: Array<any>, allJournalEntries: Array<any>) => {
                    let chart_account_tree_data: iChartOfAccount = chartAccountInfo
                    const findBalanceByAccountId = chartAccountWithBalance.find(e => e._id + "" === chartAccountInfo._id + "")
                    const find_journal_entries = allJournalEntries.filter((e) => e.chart_account_id + '' === chartAccountInfo._id + '')
                    if (findBalanceByAccountId) {
                        chart_account_tree_data.total_balance = {
                            balance: findBalanceByAccountId.total_balance,
                            credit: findBalanceByAccountId.total_credit,
                            debit: findBalanceByAccountId.total_debit
                        }

                    }
                    if (find_journal_entries) {
                        chart_account_tree_data.journal_entries = find_journal_entries
                    }
                    if (chart_account_tree_data.sub_account.length > 0) {
                        chart_account_tree_data.sub_account.map(async (element: any) => {
                            generateBalanceTreeData(element, chartAccountWithBalance, allJournalEntries)
                        })
                    }

                    return chart_account_tree_data
                }

                //@Find balance of all parents account by use generateBalanceTreeData()
                const generateBalanceSheet = getParentsChartAccount.map(element => {
                    const generateElement = generateBalanceTreeData(element, ChartAccountWithBalance, allJournalEntries)

                    return generateElement
                })

                //@Find other balance or own balance of parent account, if parents account has it own balance we need to add other account into sub-account
                const finalBalance = generateBalanceSheet.map((element: any) => {
                 
                    const totalBalanceSubAccount = element.sub_account.map((e: any) => e.total_balance.balance).reduce((a: any, b: any) => a + b, 0)
                
                    if (totalBalanceSubAccount < element.total_balance.balance) {
                        const newElement = element
                        const newTotalBalance = {
                            debit: element.journal_entries.map((e: any) => e.debit).reduce((a: any, b: any) => a + b, 0),
                            credit: element.journal_entries.map((e: any) => e.credit).reduce((a: any, b: any) => a + b, 0),
                            balance: Number(element.total_balance.balance) - Number(totalBalanceSubAccount)
                        }
                        newElement.sub_account.push({
                            account_name: "Other",
                            account_type: element.account_type,
                            total_balance: newTotalBalance,
                            journal_entries: element.journal_entries
                        })
                        return newElement
                    } else {
                        return element
                    }

                })

                //**Find total debit and credit of General Ledger*/
                const totalBalanceGeneralLedger = await GeneralJournal.aggregate([
                    { $match: selected_date },
                    { $unwind: "$journal_entries" },
                    {
                        $group: {
                            _id: null,
                            total_credit: { $sum: "$journal_entries.credit" },
                            total_debit: { $sum: "$journal_entries.debit" }
                        }
                    },
                    { $addFields: { total_balance: { $subtract: ["$total_debit", "$total_credit"] } } }
                ]);

                //*** Prepare data for return */
                let finalGeneralLedger = {
                    details: finalBalance,
                    total: {
                        debit: totalBalanceGeneralLedger[0].total_debit,
                        credit: totalBalanceGeneralLedger[0].total_credit,
                        balance: totalBalanceGeneralLedger[0].total_balance
                    }
                }


                return finalGeneralLedger
            } catch (error) {

            }
        }
    }

};

export default reportResolver