import ChartOfAccount from "../models/chartOfAccount";
import GeneralJournal from "../models/generalJournal";

const balance_sheet = {
    asset: async (from_date: Date, to_date: Date, account_type: String)=>{
            const get_specific_account = await ChartOfAccount.find({account_type: account_type})
            const all_specific_account = get_specific_account.map((e) => e._id)
            const all_account_detail = await GeneralJournal.aggregate([
                {$match: {transaction_date: {$gte: from_date, $lte: to_date}}},
                {$unwind: "$journal_entries"},
                {$match: {"journal_entries.chart_account_id": {$in: all_specific_account}}},
                {$group:{
                    _id: "$journal_entries.chart_account_id",
                    total_credit: {$sum: "$journal_entries.credit"},
                    total_debit: {$sum: "$journal_entries.debit"},
                }},
                {
                    $addFields: {"balance": {$subtract:["$total_debit", "$total_credit"]}}
                },
                {$lookup: {
                    from: "chartofaccounts",
                    localField: "_id",
                    foreignField: "_id",
                    as: "account"
                }},
                {$unwind: "$account"},
                {$project: {
                    _id:"$account._id",
                    account_name: "$account.account_name",
                    balance: "$balance",
                }},
            ]);
            
        const total_balance = all_account_detail.map((e) => e.balance).reduce((a, b)=> a+b, 0)
            
        return {
            all_account: all_account_detail,
            total_balance: total_balance
        }
    },
    total_asset_balance: async(from_date: Date, to_date: Date)=>{
        const cash = await balance_sheet.asset(from_date, to_date, "Cash");
        const accounts_receivable = await balance_sheet.asset(from_date, to_date, "Account Receivable");
        const inventory_and_fixed_asset = await balance_sheet.asset(from_date, to_date, "Inventory");
        // const fixed_asset = await balance_sheet.asset(from_date, to_date, "Fixed Assets");

        const total_asset_balance = cash.total_balance + accounts_receivable.total_balance + inventory_and_fixed_asset.total_balance + inventory_and_fixed_asset.total_balance
        return total_asset_balance
    },
    liability: async (from_date: Date, to_date: Date, account_type: String)=>{
        const get_specific_account = await ChartOfAccount.find({account_type: account_type})
        const all_specific_account = get_specific_account.map((e) => e._id)
        const all_account_detail = await GeneralJournal.aggregate([
            {$match: {transaction_date: {$gte: from_date, $lte: to_date}}},
            {$unwind: "$journal_entries"},
            {$match: {"journal_entries.chart_account_id": {$in: all_specific_account}}},
            {$group:{
                _id: "$journal_entries.chart_account_id",
                total_credit: {$sum: "$journal_entries.credit"},
                total_debit: {$sum: "$journal_entries.debit"},
            }},
            {
                $addFields: {"balance": {$subtract:["$total_credit", "$total_debit"]}}
            },
            {$lookup: {
                from: "chartofaccounts",
                localField: "_id",
                foreignField: "_id",
                as: "account"
            }},
            {$unwind: "$account"},
            {$project: {
                _id:"$account._id",
                account_name: "$account.account_name",
                balance: "$balance",
            }},
        ]);

        const total_balance = all_account_detail.map((e)=> e.balance).reduce((a, b)=> a+b, 0)
        
        return {
            all_account: all_account_detail,
            total_balance: total_balance
        }
    },
    total_liability_balance: async(from_date: Date, to_date: Date)=>{
        const accounts_payable = await balance_sheet.liability(from_date, to_date, "Account Payable")

        const total_balance = accounts_payable.total_balance 
        return total_balance
    },
    equity: async (from_date: Date, to_date: Date, account_type: String)=>{
        const get_specific_account = await ChartOfAccount.find({account_type: account_type})
        const all_specific_account = get_specific_account.map((e) => e._id)
        const all_account_detail = await GeneralJournal.aggregate([
            {$match: {transaction_date: {$gte: from_date, $lte: to_date}}},
            {$unwind: "$journal_entries"},
            {$match: {"journal_entries.chart_account_id": {$in: all_specific_account}}},
            {$group:{
                _id: "$journal_entries.chart_account_id",
                total_credit: {$sum: "$journal_entries.credit"},
                total_debit: {$sum: "$journal_entries.debit"},
            }},
            {
                $addFields: {"balance": {$subtract:["$total_credit", "$total_debit"]}}
            },
            {$lookup: {
                from: "chartofaccounts",
                localField: "_id",
                foreignField: "_id",
                as: "account"
            }},
            {$unwind: "$account"},
            {$project: {
                _id:"$account._id",
                account_name: "$account.account_name",
                balance: "$balance",
            }},
        ]);
        
        const total_balance = all_account_detail.map((e) => e.balance).reduce((a, b)=> a+b, 0)
            
        return {
            all_account: all_account_detail,
            total_balance: total_balance
        }
    },
    total_equity_balance: async(from_date: Date, to_date: Date)=>{
        const capitals = await balance_sheet.equity(from_date, to_date, "Capitals")
        const cost = await balance_sheet.equity(from_date, to_date, "Cost")
        const expenditures = await balance_sheet.equity(from_date, to_date, "Expenditures")
        const revenues = await balance_sheet.equity(from_date, to_date, "Revenues")

        return capitals.total_balance + cost.total_balance + expenditures.total_balance + revenues.total_balance
    },
    total_liability_and_equity_balance: async(from_date: Date, to_date: Date)=>{
        const total_liability = await balance_sheet.total_liability_balance(from_date, to_date)
        const total_equity = await balance_sheet.total_equity_balance(from_date, to_date)
        return total_liability + total_equity
    }

}


export default balance_sheet