// const balance_sheet = require('../../function/generateBalanceSheet')
import balance_sheet from '../../functions/generateBalanceSheet'
import balanceSheet from '../../functions/balanceSheet'


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
        }
    }

};

export default reportResolver