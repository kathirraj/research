# Copyright (c) 2023, B & K Securities and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document
from frappe.utils import now
class BloombergUpload(Document):
    def before_save(self):
        if (self.upload_request_time is not None):
            if (self.uploaded_time is None):
                self.uploaded_time = now()
        else:
            self.upload_request_time = now()
