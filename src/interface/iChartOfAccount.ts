
export interface iChartOfAccount {
    account_type: String,
    account_name: String, 
    code_account: String
    department_id: String
    total_balance: Object
    account_description: String,
    is_parents: Boolean
    is_top_parents: Boolean
    parents_account: Object
    sub_account: any
    expense_type_id: any
    journal_entries: any
}
