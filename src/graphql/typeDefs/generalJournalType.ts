


const generalJournalType = `#graphql

  type GeneralJournal {
    _id: ID
    transaction_title: String
    currency: String
    record_date: Date
    journal_number: Int
    journal_entries: [JournalEntries]
    created_by: User
    note: String
    createdAt: Date
    updatedAt: Date
  }
  type GeneralJournalPaginator{
    data: [GeneralJournal]
    paginator: Paginator
  }
  type JournalEntries{
    chart_account_id: ChartOfAccount,
    credit: Float
    debit: Float
    description: String
    key: Date
  }
  input GeneralJournalInput {
    transaction_title: String
    currency: String
    record_date: Date
    journal_number: Int
    journal_entries: [JournalEntriesInput]
    created_by: String
    note: String
  }
  input JournalEntriesInput{
    chart_account_id: String,
    credit: Float
    debit: Float
    description: String
    key: Date
  }

  type Query {
    getJournalById(journal_id: ID!): GeneralJournal
    getJournalWithPagination(page: Int, limit: Int, keyword: String, pagination: Boolean): GeneralJournalPaginator
    getLastJournalNumber: Int
  }
  type Mutation {
    createJournal(input: GeneralJournalInput): ResponseMessage
    updateJournal(journal_id: ID!, input: GeneralJournalInput): ResponseMessage
    deleteJournal(journal_id: ID!): ResponseMessage
  }
`;

export default generalJournalType