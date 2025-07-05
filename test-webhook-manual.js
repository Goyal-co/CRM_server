// Manual Webhook Testing Script
// Test the Facebook webhook with the recent lead data

import axios from 'axios';

const WEBHOOK_URL = 'https://pratham-server.onrender.com/api/fb-webhook';

// Payload based on the recent lead from the server logs
const testPayload = {
  "entry": [
    {
      "id": "724302907610309",
      "time": 1751736582,
      "changes": [
        {
          "value": {
            "adgroup_id": "6798698439993",
            "ad_id": "6798698439993",
            "created_time": 1751736579,
            "leadgen_id": "1958340478236214",
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

async function testWebhook() {
  try {
    console.log('🧪 Testing Facebook Webhook...');
    console.log('📤 Sending payload to:', WEBHOOK_URL);
    console.log('📦 Payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await axios.post(WEBHOOK_URL, testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Webhooks/1.0 (https://fb.me/webhooks)',
        'X-Hub-Signature': 'sha1=test-signature',
        'X-Hub-Signature-256': 'sha256=test-signature-256'
      },
      timeout: 30000 // 30 second timeout
    });
    
    console.log('✅ Webhook Response Status:', response.status);
    console.log('📥 Response Data:', response.data);
    
  } catch (error) {
    console.error('❌ Webhook Test Failed:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Alternative: Test with direct lead data (simulating the processed lead)
const directLeadPayload = {
  "leadId": "1958340478236214",
  "project": "793235552669212",
  "source": "Facebook",
  "formId": "793235552669212",
  "pageId": "724302907610309",
  "email": "shanoorpendari721@gmail.com",
  "full_name": "shanoor",
  "phone_number": "+918884550785",
  "created_time": "2025-07-05T17:29:39+0000"
};

async function testDirectLead() {
  try {
    console.log('\n🧪 Testing Direct Lead Data...');
    console.log('📤 Sending direct lead to:', WEBHOOK_URL);
    console.log('📦 Direct Lead:', JSON.stringify(directLeadPayload, null, 2));
    
    const response = await axios.post(WEBHOOK_URL, directLeadPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ Direct Lead Response Status:', response.status);
    console.log('📥 Response Data:', response.data);
    
  } catch (error) {
    console.error('❌ Direct Lead Test Failed:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Run both tests
async function runAllTests() {
  console.log('🚀 Starting Webhook Tests...\n');
  
  await testWebhook();
  console.log('\n' + '='.repeat(50) + '\n');
  await testDirectLead();
  
  console.log('\n✅ All tests completed!');
}

// Export for use in other scripts
export { testWebhook, testDirectLead, runAllTests };

// Run if this file is executed directly
runAllTests(); 