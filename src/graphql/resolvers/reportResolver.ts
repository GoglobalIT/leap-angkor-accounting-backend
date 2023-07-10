// const balance_sheet = require('../../function/generateBalanceSheet')
import balance_sheet from '../../functions/generateBalanceSheet'


const reportResolver = {
    Query: {
        getBarChart: (_root: undefined, { _id }: { _id: String }, req: any) => {
            return "Dashboard query write in a separagte file for make easy find later"
        },
        balanceSheetReport: async (_root: undefined, { fromDate, toDate }: { fromDate: string, toDate: string }) => {
            try {
                const start_date = new Date(fromDate)
                const end_date = new Date(toDate)
                end_date.setHours(23, 59, 59, 999)


                const balance_sheet_report = {
                    asset: {
                        cash: await balance_sheet.asset(start_date, end_date, "Cash"),
                        accounts_receivable: await balance_sheet.asset(start_date, end_date, "Account Receivable"),
                        inventory_and_fixed_asset: await balance_sheet.asset(start_date, end_date, "Inventory and Fixed Assets"),
                        // fixed_asset: await balance_sheet.asset(start_date, end_date, "Fixed Assets"),

                    },
                    total_asset: await balance_sheet.total_asset_balance(start_date, end_date),
                    liability: {
                        accounts_payable: await balance_sheet.liability(start_date, end_date, "Account Payable"),
                        total_liability_balance: await balance_sheet.total_liability_balance(start_date, end_date)

                    },
                    equity: {
                        capitals: await balance_sheet.equity(start_date, end_date, "Capitals"),
                        cost: await balance_sheet.equity(start_date, end_date, "Cost"),
                        expenditures: await balance_sheet.equity(start_date, end_date, "Expenditures"),
                        revenues: await balance_sheet.equity(start_date, end_date, "Revenues"),
                        total_equity_balance: await balance_sheet.total_equity_balance(start_date, end_date)

                    },
                    total_liability_and_equity: await balance_sheet.total_liability_and_equity_balance(start_date, end_date)
                }


                return balance_sheet_report
            } catch (error) {

            }
        }
    }

};

export default reportResolver