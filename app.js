const express = require('express');
const application = express();
const bodyParser = require('body-parser')
const Utils = require('./modules/Utils');
const log = require('cf-nodejs-logging-support');
const moment = require('moment');
const req = require('request');

var port = process.env.PORT || 5000;

application.use(bodyParser.json())
application.use(express.urlencoded({ extended: true }));

application.get( '/', (req, res) => res.send ('Hello World !!'));
application.listen(port, () => {
    console.log('Server is running on port 5000')
});

/*********************************************************
* PR, PO, ER, Invoice Status ans Sourcing Event State
*********************************************************/
application.post('/transaction/status', (req, res) => {
    let transaction = req.body.nlp.entities.transactionid ? req.body.nlp.entities.transactionid[0].raw: req.body.conversation.memory.transactionid;
    let transaction_upperCase = transaction.toUpperCase();
    let documentType = (transaction_upperCase.startsWith('PR#') || transaction_upperCase.startsWith('REQUISITION#')) ? 'requisitions' : (transaction_upperCase.startsWith('PO#') || transaction_upperCase.startsWith('PURCHASEORDER#' )) ? 'purchase_orders' : (transaction_upperCase.startsWith('ER#') || transaction_upperCase.startsWith('EXPENSEREPORT#')) ? 'expense_reports' : (transaction_upperCase.startsWith('SE#') || transaction_upperCase.startsWith('SourcingEvent#')) ? 'quote_requests' : 'invoices'
    let transaction_id = transaction.replace('PR#', '').replace('pr#', '').replace('Requisition#', '').replace('PO#', '').replace('po#', '').replace('PurchaseOrder#', '').replace('ER#', '').replace('er#', '').replace('Er#', '').replace('ExpenseReport#', '').replace('SE#', '').replace('SourcingEvent#', '').replace('Invoice#', '')
    let queryFilter = documentType == 'requisitions' ? '?id=' : documentType == 'purchase_orders' ? '?po-number=' : documentType == 'expense_reports' ? '?id=' : documentType == 'quote_requests' ? '?id=': '?invoice-number='
    console.log("/transaction/status");
    console.log("transaction: " + transaction);
    console.log("transaction_upperCase: " + transaction_upperCase);
    console.log("transaction_id: " + transaction_id);
    console.log("documentType: " + documentType);
    console.log("queryFilter: " + queryFilter);
    console.log("URL: " + 'https://accenturepdc-demo1.coupacloud.com/api/' + documentType + queryFilter + transaction_id,);

    Utils.executeDestination({
        path: 'https://accenturepdc-demo1.coupacloud.com/api/' + documentType + queryFilter + transaction_id,
        method: 'GET',
        headers: {
            'X-COUPA-API-KEY': '4a8c8a260db2ddd1ad52ca1c2524b170c770cc4f',
            'Accept': 'application/json',
            'Content-Type': 'application/json'            
        }
    }).then(data => {
        let record = data;
        if (documentType == 'quote_requests') {
            let response = {
                "replies": [
                    {
                        "type": "text",
                        "content": "The State of Sourcing Event# " + transaction + " is " + ("state" in record[0] ? record[0].state : record[transaction_id].state)
                    }
                ]
            };
            res.send(response);
        }
        else {
            let response = {
                "replies": [
                    {
                        "type": "text",
                        "content": "The status for " + transaction + " is " + ("status" in record[0] ? record[0].status : record[transaction_id].status)
                    }
                ]
            };
            res.send(response);
        }
           
    }).catch(error => {
        console.log("inside error");
        if (res.statusCode == 200) {
            let response = {
                "replies": [
                    {
                        "type": "text",
                        "content": transaction + ' was not found. Kindly double check the Transacation Number.'
                    }
                ]
            };
            res.send(response);
        } 
        else {
            console.log('Error in index : ' + JSON.stringify(error));
            res.status(500).json({ status: 'error', message: error.message });
        }
        
    });
})


/*********************************************************
* PR ACCOUNTING details
*********************************************************/
 
application.post('/transaction/accountingInformation', (req, res) => {
    let transaction = req.body.nlp.entities.transactionid ? req.body.nlp.entities.transactionid[0].raw: req.body.conversation.memory.transactionid;
    let transaction_upperCase = transaction.toUpperCase();
    let documentType = (transaction_upperCase.startsWith('PR#') || transaction_upperCase.startsWith('REQUISITION#')) ? 'requisitions' : (transaction_upperCase.startsWith('PO#') || transaction_upperCase.startsWith('PURCHASEORDER#' )) ? 'purchase_orders' : 'invoices'
    let transaction_id = transaction.replace('PR#', '').replace('pr#', '').replace('Requisition#', '').replace('PO#', '').replace('po#', '').replace('PurchaseOrder#', '').replace('Invoice#', '')
    let queryFilter = documentType == 'requisitions' ? '?id=' : documentType == 'purchase_orders' ? '?po-number=' : '?invoice-number='
    console.log("/transaction/accountingInformation");
    console.log("transaction: " + transaction);
    console.log("transaction_upperCase: " + transaction_upperCase);
    console.log("transaction_id: " + transaction_id);
    console.log("documentType: " + documentType);
    console.log("queryFilter: " + queryFilter);
    console.log("URL: " + 'https://accenturepdc-demo1.coupacloud.com/api/' + documentType + queryFilter + transaction_id,);


    Utils.executeDestination({
        path: 'https://accenturepdc-demo1.coupacloud.com/api/' + documentType + queryFilter + transaction_id,
        method: 'GET',
        headers: {
            'X-COUPA-API-KEY': '4a8c8a260db2ddd1ad52ca1c2524b170c770cc4f',
            'Accept': 'application/json',
            'Content-Type': 'application/json'            
        }
    })
    .then(data => {
        let record = data;
        //let lnItemsnumber = record[0]["ship-to-attention"];
        //console.log("lnItemsnumber: " + lnItemsnumber);
        let lnItems = record[0]["requisition-lines"];
        console.log("lnItems: " + lnItems);
        let accName = "";
        let accCode = "";
        let results = [];

        lnItems.forEach(items => {
            ln = items["line-num"];
            console.log("ln: " + ln);
            accounting = items.account;
            accName = accounting.name;
            accCode = accounting.code;
            accCOA = accounting["account-type.name"];
            lnAmount = items.total;
            lnCurr = items.currency.code;
            
                results.push("Line Item#" + ln + "\nChart of Account: " + accCOA + "\nAccounting: " + accName + "(" + accCode + ")\nLine Item Total: " + lnAmount + " " + lnCurr + "\n\n");
        });

        let response = {
            "replies": [
                {
                    "type": "text",
                    "content": transaction + ' has the following accounting information: \n\n' + results

                }
            ]
        };

        res.send(response);
    }).catch(error => {
        if (res.statusCode == 200) {
            let response = {
                "replies": [
                    {
                        "type": "text",
                        "content": transaction + ' was not found. Kindly double check the transaction Number.'
                    }
                ]
            };
            res.send(response);
        } else {
            console.log('Error in index : ' + JSON.stringify(error));
            res.status(500).json({ status: 'error', message: error.message });
        }

    });
})

/*********************************************************
* PR & Invoice Current Approver
*********************************************************/
application.post('/transaction/currentapprover', (req, res) => {
    let transaction = req.body.nlp.entities.transactionid ? req.body.nlp.entities.transactionid[0].raw: req.body.conversation.memory.transactionid;
    let transaction_upperCase = transaction.toUpperCase();
    let documentType = (transaction_upperCase.startsWith('PR#') || transaction_upperCase.startsWith('REQUISITION#')) ? 'requisitions' : (transaction_upperCase.startsWith('PO#') || transaction_upperCase.startsWith('PURCHASEORDER#' )) ? 'purchase_orders' : (transaction_upperCase.startsWith('ER#') || transaction_upperCase.startsWith('EXPENSEREPORT#')) ? 'expense_reports' : (transaction_upperCase.startsWith('SE#') || transaction_upperCase.startsWith('SourcingEvent#')) ? 'quote_requests' : 'invoices'
    let transaction_id = transaction.replace('PR#', '').replace('pr#', '').replace('Requisition#', '').replace('PO#', '').replace('po#', '').replace('PurchaseOrder#', '').replace('ER#', '').replace('er#', '').replace('Er#', '').replace('ExpenseReport#', '').replace('SE#', '').replace('SourcingEvent#', '').replace('Invoice#', '')
    let queryFilter = documentType == 'requisitions' ? '?id=' : documentType == 'purchase_orders' ? '?po-number=' : documentType == 'expense_reports' ? '?id=' : documentType == 'quote_requests' ? '?id=': '?invoice-number='
    console.log("/transaction/currentapprover");
    console.log("transaction: " + transaction);
    console.log("transaction_upperCase: " + transaction_upperCase);
    console.log("transaction_id: " + transaction_id);
    console.log("documentType: " + documentType);
    console.log("queryFilter: " + queryFilter);
    console.log("URL: " + 'https://accenturepdc-demo1.coupacloud.com/api/' + documentType + queryFilter + transaction_id);

    Utils.executeDestination({
        path: 'https://accenturepdc-demo1.coupacloud.com/api/' + documentType + queryFilter + transaction_id,
        method: 'GET',
        headers: {
            'X-COUPA-API-KEY': '4a8c8a260db2ddd1ad52ca1c2524b170c770cc4f',
            'Accept': 'application/json',
            'Content-Type': 'application/json'            
        }
    }).then(data => {
        let record = data;
        console.log("start if PR");
        if (documentType == 'requisitions') {
            console.log("inside if PR");
            let response = {
                "replies": [
                    {
                        "type": "text",
                        "content": "The current approver for " + transaction + " is " + ("current-approval" in record[0] ? record[0]["current-approval"]["approver"]["name"] : record[transaction_id]["current-approval"]["approver"]["name"] )
                    }
                ]
            };
            res.send(response);
        }
        console.log("start if ER");
        if (documentType == 'expense_reports'){
            console.log("inside if ER");
            let lnItems = record[0]["approvals"];
            let appName = "";
            let appStat = "";

            lnItems.forEach(items => {
                pos = items["position"];
                console.log("position: " + pos);
                appStat = items["status"];
                appName = items["approver"]["fullname"];
                console.log("appStat: " + appStat);
                console.log("appName: " + appName);
                if (appStat == "pending_approval"){
                    appName=appName;
                }
            });

            let response = {
                "replies": [
                    {
                        "type": "text",
                        "content": "The current approver for " + transaction + " is " + appName
                    }
                ]
            };
            res.send(response);
        }

    }).catch(error => {
        if (res.statusCode == 200) {
            let response = {
                "replies": [
                    {
                        "type": "text",
                        "content": transaction + ' has no current approver.'
                    }
                ]
            };
            res.send(response);
        } else {
            console.log('Error in index : ' + JSON.stringify(error));
            res.status(500).json({ status: 'error', message: error.message });
        }
        
    });
})