// Copyright (c) 2023, B & K Securities and contributors
// For license information, please see license.txt
frappe.ui.form.on("Bloomberg Upload", {
	onload: function(frm) {
	    frm.set_query("model_company", function() {
        	return {
	            "filters": [
        	        ["Corporate","bb_code","is","set"],
                	["Corporate","disabled","=",0]
	            ]
        	};
	    });
	    if(frm.is_new()){
		frm.set_df_property('upload_status', 'options', ['', 'Ready for Upload']);
	    }else{
		frm.set_read_only('upload_status');
		frm.set_df_property('upload_status', 'options', ['', 'Ready for Upload', 'Uploaded']);
	    }

	},
	after_save: function(frm) {
		frm.set_read_only('upload_status');
	}

});

