import express from 'express';
import axios from 'axios';
import { appendLeadToSheet } from '../services/sheetsService.js'; // ✅ Google Sheets logic

const router = express.Router();

const VERIFY_TOKEN = 'titan_verify';
const PAGE_ACCESS_TOKEN = 'EAAKBnOgTKZBwBO4wkvnG61l9mkCLfsb26mhpfBR8J8uvU842dN5M5XVvgZBAZC4WEmAkZCCdltkfRvWgkA5Irzb9AoH0sF2ropYZCX8eeZBkCg13UPirJclY33t2gmZB3MXQLVQyFlyJBQxqAdqtrZAsUlQseDuicGu7q1dxuAETPJZCZBSH8sqK8IxMf7A8RRH1tnRZBOCnHqP3eAfYwtE9MMr2P8mtFx58QZDZD';

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
            `https://graph.facebook.com/v19.0/${leadId}?access_token=${PAGE_ACCESS_TOKEN}`
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
    console.error('❌ Lead fetch failed:', err.message);
    res.sendStatus(500);
  }
});

export default router;
