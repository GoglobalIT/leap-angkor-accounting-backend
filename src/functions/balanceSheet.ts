import ChartOfAccount from "../models/chartOfAccount"
import getBalanceChartAccount from "../functions/getBalanceByChartAccount"


const balanceSheet = async (accountType: Array<String>, start_date: String, end_date: String) => {
    
    //@Parent Account, we need it becasue it already have tree data form
    const getParentsChartAccount = await ChartOfAccount.find({
        $and: [
            { is_top_parents: true },
            { department_id: '64a52c65ad409eb75c87d8e1' },
            { account_type: { $in: accountType } },
        ]
    })
    //@All Account by many chart account type, we need to find balance for each account for use it in RECURSIVE Function
    const getAccountByType = await ChartOfAccount.find({$and:[
        { department_id: '64a52c65ad409eb75c87d8e1' },
        { account_type: { $in: accountType } },
    ]})
    //@Find Balance of each account with getBalanceChartAccount() function
    const findBalanceOfChartAccount = Promise.all(
        getAccountByType.map(async element => {
            const findBalance = await getBalanceChartAccount(element._id.toString(), start_date, end_date)
            return {
                _id: element._id,
                account_name: element.account_name,
                total_balance: findBalance.total_balance
            }
        })
    )
    const ChartAccountWithBalance = await findBalanceOfChartAccount
  

    // ***RECURSIVE Function */ find balance of a parents account from top parent to the last sub-account with tree data form
    const generateBalanceTreeData = (chartAccountInfo: any, chartAccountWithBalance: Array<any>) => {
        let chart_account_tree_data = chartAccountInfo 
            const findBalanceByAccountId = chartAccountWithBalance.find(e => e._id+"" === chartAccountInfo._id+"")
            if(findBalanceByAccountId){
                chart_account_tree_data.total_balance = findBalanceByAccountId.total_balance
            }
            if (chart_account_tree_data.sub_account.length > 0) {
                chart_account_tree_data.sub_account.map(async(element: any) => {
                    generateBalanceTreeData(element, chartAccountWithBalance)
                })
            }
           
        return chart_account_tree_data 
    }

    //@Find balance of all parents account by use generateBalanceTreeData()
    const generateBalanceSheet = getParentsChartAccount.map( element => {
        const generateElement = generateBalanceTreeData(element, ChartAccountWithBalance)
        return generateElement
    })
    
   
    return generateBalanceSheet
}

export default balanceSheet