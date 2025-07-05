// Test Custom Lead from Facebook Graph API
import axios from 'axios';

const WEBHOOK_URL = 'https://pratham-server.onrender.com/api/fb-webhook';
const PAGE_ACCESS_TOKEN = 'EAATT84b6A0MBOZC5eivZAYnEjkWfZAqxzZCiFacZCNnZCFPLM07ASuRhcw8olsZCx8K1ColBEZBuYH6fTNCPcGSpFx632M7qtCxE3YEphs34ic4ZAc7fqs1CgOUMfehwjAq2qonBU1mfeBKnqUwpVkZBA5KCg4tP8sknOufz1lDBCvANQZBQRrUEn122BqumkfUXU3sUC8u';

// Get leadgen_id from command line argument
const leadgenId = process.argv[2];

if (!leadgenId) {
  console.log('❌ Please provide a leadgen_id as argument');
  console.log('Usage: node test-custom-lead.js <leadgen_id>');
  console.log('Example: node test-custom-lead.js 720376977519534');
  process.exit(1);
}

async function fetchLeadFromGraphAPI(leadgenId) {
  try {
    console.log(`📡 Fetching lead data from Graph API for ID: ${leadgenId}`);
    
    const response = await axios.get(
      `https://graph.facebook.com/v19.0/${leadgenId}`,
      {
        params: {
          access_token: PAGE_ACCESS_TOKEN,
          fields: 'field_data,created_time'
        }
      }
    );
    
    console.log('✅ Graph API Response:', JSON.stringify(response.data, null, 2));
    return response.data;
    
  } catch (error) {
    console.error('❌ Graph API Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return null;
  }
}

async function testCustomLead(leadgenId) {
  try {
    console.log(`🧪 Testing Custom Lead: ${leadgenId}`);
    
    // Fetch real data from Graph API
    const leadData = await fetchLeadFromGraphAPI(leadgenId);
    
    if (!leadData) {
      console.error('❌ Could not fetch lead data from Graph API');
      return;
    }
    
    // Create webhook payload
    const payload = {
      "entry": [
        {
          "id": "724302907610309",
          "time": Math.floor(Date.now() / 1000),
          "changes": [
            {
              "value": {
                "adgroup_id": "6798196962793",
                "ad_id": "6798196962793",
                "created_time": Math.floor(Date.now() / 1000),
                "leadgen_id": leadgenId,
                "page_id": "724302907610309",
                "form_id": "793235552669212"
              },
              "field": "leadgen"
            }
          ]
        }
      ],
      "object": "page"
    };
    
    console.log('📤 Sending webhook payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Webhooks/1.0 (https://fb.me/webhooks)',
        'X-Hub-Signature': 'sha1=test-signature',
        'X-Hub-Signature-256': 'sha256=test-signature-256'
      },
      timeout: 30000
    });
    
    console.log('✅ Webhook Response Status:', response.status);
    console.log('📥 Response Data:', response.data);
    
  } catch (error) {
    console.error('❌ Custom Lead Test Failed:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Run the test
console.log('🚀 Testing Custom Lead with Graph API Data...\n');
testCustomLead(leadgenId); 