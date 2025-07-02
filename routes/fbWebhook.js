import express from 'express';
import axios from 'axios';
import { appendLeadToSheet } from '../services/sheetsService.js'; // ✅ Google Sheets logic

const router = express.Router();

const VERIFY_TOKEN = 'titan_verify';
// TODO: Move PAGE_ACCESS_TOKEN to environment variable for security
const PAGE_ACCESS_TOKEN = 'EAATT84b6A0MBO1VN1BU3CwindbQ8oETT5C2ZA8wYFCsZBOkSr9HGNp22VXIR7p8XDCWkGs8YPEqw2wllMsjLjax3avlsww3ipybZCeZAGDZCbQRaQiL1ZC79lq5xKhLOyFZB7oZCFSZBraYRwryc0NOWbLkPDnL22JQuBQCmnIdvPd4ZA2uPkKWBNlUxerHhZBhFZCC33XwTR7S2HLwwprFNEGn9rE0jdb5NnEa023s0sUAG';

// ✅ 1. Facebook Webhook Verification
// Make sure this matches your ngrok URL in Facebook Developer Console:
// Example: https://ab71-106-51-69-178.ngrok-free.app/webhook/fb-webhook
router.get('/fb-webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ✅ 2. Webhook POST for incoming leads (multi-entry, multi-change, more metadata)
router.post('/fb-webhook', async (req, res) => {
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

          // Fetch full lead data from Facebook Graph API
          const response = await axios.get(
            `https://graph.facebook.com/v19.0/${leadId}`,
            {
              params: {
                access_token: PAGE_ACCESS_TOKEN,
                fields: 'field_data,created_time' // Add more fields if needed
              }
            }
          );

          console.log('✅ Full Lead Data:', JSON.stringify(response.data, null, 2));

          const fields = response.data.field_data;
          const lead = {
            name: fields.find(f => f.name === 'full_name')?.values?.[0] || '',
            phone: fields.find(f => f.name === 'phone_number')?.values?.[0] || '',
            email: fields.find(f => f.name === 'email')?.values?.[0] || '',
            source: 'Facebook',
            leadId,
            formId,
            pageId,
            receivedAt: new Date().toISOString()
          };

          await appendLeadToSheet(lead); // ✅ Send to Google Sheet
          leadsAdded++;
        } else {
          console.log('⚠️ Not a leadgen field:', change?.field);
        }
      }
    }

    console.log(`✅ Leads added to sheet: ${leadsAdded}`);
    res.sendStatus(200);
  } catch (err) {
    // Improved error logging for Facebook API errors
    if (err.response) {
      console.error('❌ Lead fetch failed:', err.message, '\nResponse data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('❌ Lead fetch failed:', err.message);
    }
    res.sendStatus(500);
  }
});

export default router;
