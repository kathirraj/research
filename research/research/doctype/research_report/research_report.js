// Copyright (c) 2020, B & K Securities and contributors
// For license information, please see license.txt

frappe.ui.form.on('Research Report', {
	before_save: function(frm) {
		frm.doc.report_title =  (frm.doc.corporate? ( frm.doc.corporate + '-'): ( frm.doc.sector? ( frm.doc.sector + '-'):'')) + frm.doc.report_type + '-' + frm.doc.report_date;
	}
});
