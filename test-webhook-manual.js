// Manual Webhook Testing Script
// Test the Facebook webhook with real data from Graph API

import axios from 'axios';

const WEBHOOK_URL = 'https://pratham-server.onrender.com/api/fb-webhook';
const PAGE_ACCESS_TOKEN = 'EAATT84b6A0MBOZC5eivZAYnEjkWfZAqxzZCiFacZCNnZCFPLM07ASuRhcw8olsZCx8K1ColBEZBuYH6fTNCPcGSpFx632M7qtCxE3YEphs34ic4ZAc7fqs1CgOUMfehwjAq2qonBU1mfeBKnqUwpVkZBA5KCg4tP8sknOufz1lDBCvANQZBQRrUEn122BqumkfUXU3sUC8u';

// Test with a real leadgen_id from your recent webhook
const TEST_LEADGEN_ID = '720376977519534'; // Mr akhil 27
const TEST_LEADGEN_ID_2 = '2857903287931124'; // Kuhukeka Ghosh

// Fetch real lead data from Facebook Graph API
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

// Create webhook payload with real lead data
async function createWebhookPayload(leadgenId) {
  const leadData = await fetchLeadFromGraphAPI(leadgenId);
  
  if (!leadData) {
    console.error('❌ Could not fetch lead data from Graph API');
    return null;
  }
  
  // Create the webhook payload structure
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
  
  return payload;
}

async function testWebhookWithRealData() {
  try {
    console.log('🧪 Testing Facebook Webhook with Real Graph API Data...\n');
    
    // Test with first lead
    console.log('📤 Testing Lead 1:', TEST_LEADGEN_ID);
    const payload1 = await createWebhookPayload(TEST_LEADGEN_ID);
    
    if (payload1) {
      const response1 = await axios.post(WEBHOOK_URL, payload1, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Webhooks/1.0 (https://fb.me/webhooks)',
          'X-Hub-Signature': 'sha1=test-signature',
          'X-Hub-Signature-256': 'sha256=test-signature-256'
        },
        timeout: 30000
      });
      
      console.log('✅ Lead 1 Response Status:', response1.status);
      console.log('📥 Response Data:', response1.data);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test with second lead
    console.log('📤 Testing Lead 2:', TEST_LEADGEN_ID_2);
    const payload2 = await createWebhookPayload(TEST_LEADGEN_ID_2);
    
    if (payload2) {
      const response2 = await axios.post(WEBHOOK_URL, payload2, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Webhooks/1.0 (https://fb.me/webhooks)',
          'X-Hub-Signature': 'sha1=test-signature',
          'X-Hub-Signature-256': 'sha256=test-signature-256'
        },
        timeout: 30000
      });
      
      console.log('✅ Lead 2 Response Status:', response2.status);
      console.log('📥 Response Data:', response2.data);
    }
    
  } catch (error) {
    console.error('❌ Webhook Test Failed:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Test with custom leadgen_id
async function testCustomLead(leadgenId) {
  try {
    console.log(`🧪 Testing Custom Lead: ${leadgenId}`);
    
    const payload = await createWebhookPayload(leadgenId);
    
    if (payload) {
      const response = await axios.post(WEBHOOK_URL, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Webhooks/1.0 (https://fb.me/webhooks)',
          'X-Hub-Signature': 'sha1=test-signature',
          'X-Hub-Signature-256': 'sha256=test-signature-256'
        },
        timeout: 30000
      });
      
      console.log('✅ Custom Lead Response Status:', response.status);
      console.log('📥 Response Data:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Custom Lead Test Failed:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Export functions
export { testWebhookWithRealData, testCustomLead, fetchLeadFromGraphAPI };

// Run the test
console.log('🚀 Starting Webhook Tests with Real Graph API Data...\n');
testWebhookWithRealData(); 