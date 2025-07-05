
import express from 'express';
import axios from 'axios';
import { appendLeadToSheet } from '../services/sheetsService.js';

const router = express.Router();

const VERIFY_TOKEN = 'titan_verify';
const PAGE_ACCESS_TOKEN = 'EAATT84b6A0MBOZC5eivZAYnEjkWfZAqxzZCiFacZCNnZCFPLM07ASuRhcw8olsZCx8K1ColBEZBuYH6fTNCPcGSpFx632M7qtCxE3YEphs34ic4ZAc7fqs1CgOUMfehwjAq2qonBU1mfeBKnqUwpVkZBA5KCg4tP8sknOufz1lDBCvANQZBQRrUEn122BqumkfUXU3sUC8u';
router.post('/api/fb-webhook', async (req, res) => {
  try {
    console.log('📨 Webhook POST hit');
    console.log('📦 Raw Body:', JSON.stringify(req.body, null, 2));

    let leadsAdded = 0;
    for (const entry of req.body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === 'leadgen') {
          const leadId = change.value.leadgen_id;
          const formId = change.value.form_id;
          const pageId = change.value.page_id;

          console.log('📥 New Lead ID:', leadId);
          console.log('📝 Form ID:', formId);
          console.log('📄 Page ID:', pageId);

          let lead = {
            leadId,
            project: formId || 'FB Form', // Default project name
            source: 'Facebook',
            formId: formId,
            pageId: pageId,
            created_time: new Date().toISOString(),
          };

          // ✅ Try fetching lead details from FB
          try {
            const response = await axios.get(
              `https://graph.facebook.com/v19.0/${leadId}`,
              {
                params: {
                  access_token: PAGE_ACCESS_TOKEN,
                  fields: 'field_data,created_time'
                }
              }
            );
            console.log('✅ Full Lead Data:', JSON.stringify(response.data, null, 2));

            const fields = response.data.field_data;
            if (Array.isArray(fields)) {
              fields.forEach(f => {
                if (f.name && Array.isArray(f.values)) {
                  // Store the field value
                  lead[f.name] = f.values[0] || '';
                  
                  // Also store with common variations for better mapping
                  const fieldName = f.name.toLowerCase();
                  if (fieldName.includes('name') && !lead.name) {
                    lead.name = f.values[0] || '';
                  }
                  if (fieldName.includes('email') && !lead.email) {
                    lead.email = f.values[0] || '';
                  }
                  if (fieldName.includes('phone') && !lead.phone) {
                    lead.phone = f.values[0] || '';
                  }
                  if (fieldName.includes('city') || fieldName.includes('location') && !lead.city) {
                    lead.city = f.values[0] || '';
                  }
                }
              });
            }
            
            // Add created_time from Facebook if available
            if (response.data.created_time) {
              lead.created_time = response.data.created_time;
            }
          } catch (err) {
            console.error('❌ Lead fetch failed:', err.message, err.response?.data || '');
          }

          // ✅ Always try to send to Google Sheets directly
          try {
            await appendLeadToSheet(lead);
            leadsAdded++;
            console.log('✅ Lead successfully added to Google Sheet:', lead.leadId);
          } catch (sheetErr) {
            console.error('❌ Failed to append to Google Sheet:', sheetErr.message);
          }
        } else {
          console.log('⚠️ Skipping non-leadgen field:', change?.field);
        }
      }
    }

    console.log(`✅ Leads added to sheet: ${leadsAdded}`);
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    res.sendStatus(500);
  }
});

export default router;
