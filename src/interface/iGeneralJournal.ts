
export interface iGeneralJournal {
    transaction_title: String
    currency: String
    record_date: Date
    journal_number: Number
    journal_entries: [
        {
            chart_account_id: String,
            credit: Number
            debit: Number
            description: String
            key: Date
        }
    ],
    created_by: String
    memo: String
}
