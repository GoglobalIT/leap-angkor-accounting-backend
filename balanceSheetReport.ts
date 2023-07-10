
const balance_sheet_report: any = {
    asset: [
        {   
            account_name: "Cash On Hand",
            balance: 200,
            sub_account: [
                {
                    account_name: "Badminton Club",
                    balance: 100,
                    sub_account: null
                },
                {
                    account_name: "CEO",
                    balance: 50,
                    sub_account: null
                },
                {
                    account_name: "Machinery and road",
                    balance: 50,
                    sub_account: null
                }
            ]
        },
        {   
            account_name: "Cash In Bank",
            balance: 300,
            sub_account: [
                {
                    account_name: "AA Phnom Penh",
                    balance: 100,
                    sub_account: null
                },
                {
                    account_name: "AA Siem Reap",
                    balance: 200,
                    sub_account: null
                },
                {
                    account_name: "Other",
                    balance: 0,
                    sub_account: null
                },
            ]
        },
    ],
    total_asset: 500,
    liability: [
        {   
            account_name: "Account Payable",
            balance: 150,
            sub_account: [
                {
                    account_name: "Fuels",
                    balance: 100,
                    sub_account: null
                },
                {
                    account_name: "Garage",
                    balance: 50,
                    sub_account: null
                },
            ]
        },
    ],
    total_liability_balance: 150,
    equity: {
        capitals: {
            all_account: [],
            total_balance: 100
        },
        cost: {
            all_account: [],
            total_balance: 100
        },
        expenditures: {
            all_account: [],
            total_balance: 100
        },
        revenues: {
            all_account: [],
            total_balance: 100
        },
        total_equity_balance: 400
    },
    total_liability_and_equity: 400,
}