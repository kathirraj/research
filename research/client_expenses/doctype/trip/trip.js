// Copyright (c) 2022, B & K Securities and contributors
// For license information, please see license.txt

frappe.ui.form.on('Trip', {
    test_js : function (frm){
        console.log("Hi");
        /*
        frappe.db.get_list('Expense Split', {parent:'Trip', filters: { 'parent': 'TRIP-23-0009' } }).then(records => {
            console.log("Already rows available " + records.length);
        });
        
        frappe.db.get_list('Expense Split',//Ex:Item Customer Details
            {
                parent: 'Trip',//Ex:Item
                fields: ['*'],
                filters: ['parent = "TRIP-23-0006"'],//Ex:Pencil
                limit: 99,
                order_by: 'idx asc'
            }).then(
                (result) => { console.log(result); }
                );
*/
    },

    refresh: function (frm) {
        //Auto fetch the currently logged in user's Employee name
        //Do not overwrite for every refresh - set value only if the field is empty
        if (!frm.doc.trip_by) {
            frappe.db.get_value('Employee', { 'user_id': frappe.session.user }, 'name').then(
                resp => {
                    frm.set_value('trip_by', resp.message.name);
                }
            );
        }
        var bill_amount_to_clients = 0;
        if (frm.doc.clients) {
            var updated_clients_list = [];
            for (var client of frm.doc.clients) {
                updated_clients_list.push({ "client": client.client, "trip_expenses": 0 });
                client.trip_expenses = 0;
            }
            for (var split_row of frm.doc.clientwise_expense_split) {
                for (var client of frm.doc.clients) {
                    if (client.client == split_row.client) {
                        client.trip_expenses += split_row.split_amount;
                        bill_amount_to_clients += split_row.split_amount;
                        frm.refresh_field('clients');
                    }
                }
            }
        }
        if (frm.doc.expense_bills){
            frm.doc.total_trip_bills = 0;
            //frm.refresh_field('total_trip_bills');
            //frm.set_value('total_trip_bills', 0);
            for (var bill of frm.doc.expense_bills) {
                frm.doc.total_trip_bills = frm.doc.total_trip_bills + bill.bill_amount;
                //frm.refresh_field('total_trip_bills');
                //frm.set_value('total_trip_bills',  frm.doc.total_trip_bills + bill.bill_amount);
            }
        }
        frm.refresh_field('total_trip_bills');

        //frm.set_value('amt_not_allocated_to_clients', frm.doc.total_trip_bills - bill_amount_to_clients);
        frm.doc.amt_not_allocated_to_clients =  frm.doc.total_trip_bills - bill_amount_to_clients;
        frm.refresh_field('amt_not_allocated_to_clients');
        
        
        
        clear_add_remove_buttons("clientwise_expense_split");  //the child table that is to be controlled
    },
    expense_bills: function (frm) {
        console.log("Expense bills changed");
    }
});

frappe.ui.form.on('Expense Split', {
    form_render(frm, cdt, cdn) {
        remove_buttons_from_child_form(frm, 'clientwise_expense_split');
    }
});

//Event handler for Child Table
frappe.ui.form.on('Expense Entry', {
    //OnClick event of the Split button available in the Child DocType
    split: function (frm, cdt, cdn) {
        let exp_entry_row = frappe.get_doc(cdt, cdn);
        var myfields = [];
        //Always add a checkbox for the Trip user
        myfields.push({
            "fieldtype": "Check",
            "fieldname": "trip_by",
            "label": "SELF [" + frm.doc.trip_by + "]",
        });
        //Dynamically add one checkbox each for each of the Clients involved in the trip
        var clients_count = frm.doc.clients ? frm.doc.clients.length : 0;
        for (let i = 0; i < clients_count; i++) {
            myfields.push({
                "fieldtype": "Check",
                "fieldname": "client_" + i,
                "label": frm.doc.clients[i].client,
            });
        }
        let dialog = new frappe.ui.Dialog({
            title: __('Split ' + exp_entry_row.expense_type + ' bill ' + exp_entry_row.bill_no + ' of value ' + exp_entry_row.bill_amount),
            fields: myfields,
            primary_action_label: 'Split',
            primary_action: function (values) {
                testcall();
                //let row= frappe.get_doc(cdt,cdn);
                /*
                frappe.db.get_list('Expense Split', {parent:'Trip', filters: { 'parent': exp_entry_row.parent, 'expense_entry_id': cdn } }).then(records => {
                    console.log("Already rows available " + records.length);
                });
                */
                var selected_count = 0;
                //var clients_count = frm.doc.clients? frm.doc.clients.length : 0;
                for (var j = 0; j < clients_count; j++) {
                    if (values['client_' + j]) {
                        selected_count++;
                    }
                }
                if (values['trip_by']) {
                    selected_count++;
                }
                //Clear existing split rows for this expense entry
                var tbl = frm.doc.clientwise_expense_split || [];
                console.log(JSON.stringify(tbl));
                var i = tbl.length;
                while (i--) {
                    console.log("Split exp entry id for index " + i + " is : " + tbl.at(i).expense_entry_id + "| cur id  : " + cdn);
                    if (tbl.at(i).expense_entry_id == cdn) {
                        //        frm.get_field('clientwise_expense_split').grid.grid_rows[i].remove();
                        frm.doc.clientwise_expense_split.splice(frm.doc.clientwise_expense_split.splice[i], 1);
                        console.log("Deleted row i= " + i);
                        frm.refresh_field('clientwise_expense_split');
                    }

                }
                //end
                //frm.refresh();


                for (var j = 0; j < clients_count; j++) {
                    console.log('Check ' + j + ' : ' + values['client_' + j]);
                    if (values['client_' + j]) {
                        let splitrow = frm.add_child('clientwise_expense_split', {
                            trip: exp_entry_row.parent,
                            expense_entry_id: cdn,
                            split_: 100 / selected_count,
                            bill_reference: exp_entry_row.expense_type + ":" + exp_entry_row.bill_no,
                            expense_type: exp_entry_row.expense_type,
                            split_amount: exp_entry_row.bill_amount / selected_count,
                            client: frm.doc.clients[j].client
                        });
                    }
                }
                if (values['trip_by']) {
                    let splitrow = frm.add_child('clientwise_expense_split', {
                        trip: exp_entry_row.parent,
                        expense_entry_id: cdn,
                        split_: 100 / selected_count,
                        bill_reference: exp_entry_row.expense_type + ":" + exp_entry_row.bill_no,
                        expense_type: exp_entry_row.expense_type,
                        split_amount: exp_entry_row.bill_amount / selected_count,
                        client: 'SELF'
                    });
                }
                frm.refresh_field('clientwise_expense_split');
                dialog.hide();
            }
        });

        //if (frm.doc.__islocal) {
        if (frm.is_new()) {
            //Skip if the Doc is not yet saved to DB
            frappe.msgprint("New Trip not yet saved. Save and try again");
        } else if (frm.is_dirty()) {
            //Skip if the Doc has some form changes that are not yet updated to DB
            frappe.msgprint("There are unsaved changes. Pls. save and try again");
        } else {
            //Find the position of the current Row of Child Table
            let index = exp_entry_row.idx - 1;
            if ((cur_frm.doc.expense_bills[index].__islocal)) {
                //Skip if the child table row is just added and not yet saved to DB
                frappe.msgprint("Save the Trip before splitting the expenses between clients");
            } else {
                if (exp_entry_row.bill_amount > 0) {
                    dialog.show();
                } else {
                    //Skip if bill amount is not entered
                    frappe.msgprint("Enter the bill amount first");
                }
            }
        }

    },  //split ends

    form_render(frm, cdt, cdn) {
        remove_buttons_from_child_form(frm, 'expense_bills');
    }
});

var clear_add_remove_buttons = function (child_table) {
    //Apply logic only for non-admin users
    if (!(frappe.session.user === 'Administrator' || frappe.user.has_role("System Manager"))) {
        //Remove add/delete row buttons from child table field
        $('*[data-fieldname="' + child_table + '"]').find('.grid-remove-rows').hide();
        $('*[data-fieldname="' + child_table + '"]').find('.grid-add-row').hide();
    }
};

var remove_buttons_from_child_form = function (frm, child_table) {
    //Apply logic only for non-admin users
    if (!(frappe.session.user === 'Administrator' || frappe.user.has_role("System Manager"))) {
        //Here clientwise_expense_split is the table field name
        frm.fields_dict[child_table].grid.wrapper.find('.grid-delete-row').hide();
        frm.fields_dict[child_table].grid.wrapper.find('.grid-duplicate-row').hide();
        frm.fields_dict[child_table].grid.wrapper.find('.grid-move-row').hide();
        frm.fields_dict[child_table].grid.wrapper.find('.grid-append-row').hide();
        frm.fields_dict[child_table].grid.wrapper.find('.grid-insert-row-below').hide();
        frm.fields_dict[child_table].grid.wrapper.find('.grid-insert-row').hide();
        //eg. frm.fields_dict['clientwise_expense_split'].grid.wrapper.find('.grid-insert-row').hide();
    }
}

var testcall = function (){
    console.log("Test called from dialog button");
}
/* Sample code snippets that would work and could be alternative approach
if((cur_frm.doc.expense_bills[index].__islocal) !== undefined && cur_frm.doc.expense_bills[index].__islocal){
if((typeof  (cur_frm.doc.expense_bills[index].__islocal) !== 'undefined' ) && (cur_frm.doc.expense_bills[index].__islocal)=>
if ( typeof exp_entry_row.research_analyst === "undefined") {
frappe.model.set_value(exp_entry_row.doctype, exp_entry_row.name, "research_analyst_name", "");
=======Alternate method=========
exp_entry_row.research_analyst_name = "";
cur_frm.refresh_field("research_team");
}
frappe.db.get_list('Expense Split', {filters:{'parent':exp_entry_row.parent,'expense_entry_id': cdn}}).then(records => {
    frappe.msgprint("Already rows available " +  records.length);
});
    dialog.fields_dict.butn.input.onclick = function(){
            console.log('button pressed ' + dialog.file);
    };



                
//This call results in Not Permitted:  Insufficient Permission for Expense Split
//Failed backend call is  https://erpdev1.bksec.com/api/method/frappe.desk.reportview.get_list?filters={"parent":"TRIP-23-0009","expense_entry_id":19}&doctype=Expense Split&fields=["name"]&limit=20
//DO NOT CALL GET_LIST ON CHILD TABLE                
frappe.db.get_list('Expense Split', { filters: { 'parent': exp_entry_row.parent, 'expense_entry_id': cdn } }).then(records => {
    console.log("Already rows available " + records.length);
});
*/

