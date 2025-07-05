// Test webhook with Google Sheets API integration
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const WEBHOOK_URL = 'https://pratham-server.onrender.com/webhook/facebook';

// Test lead data
const testLead = {
  leadId: `TEST-${Date.now()}`,
  project: 'Test Project',
  source: 'Facebook',
  name: 'Test User',
  email: 'test@example.com',
  phone: '1234567890',
  city: 'Test City',
  created_time: new Date().toISOString()
};

// Facebook webhook payload format
const webhookPayload = {
  object: 'page',
  entry: [
    {
      id: '123456789',
      time: Math.floor(Date.now() / 1000),
      messaging: [
        {
          sender: { id: '987654321' },
          recipient: { id: '123456789' },
          timestamp: Math.floor(Date.now() / 1000),
          postback: {
            payload: 'GET_STARTED'
          }
        }
      ]
    }
  ]
};

// Lead form submission payload
const leadPayload = {
  object: 'page',
  entry: [
    {
      id: '123456789',
      time: Math.floor(Date.now() / 1000),
      changes: [
        {
          value: {
            form_id: '123456789',
            leadgen_id: testLead.leadId,
            created_time: Math.floor(Date.now() / 1000),
            page_id: '123456789',
            adgroup_id: '123456789',
            ad_id: '123456789',
            form: {
              name: testLead.name,
              email: testLead.email,
              phone_number: testLead.phone,
              city: testLead.city,
              message: testLead.message || 'Test message'
            }
          },
          field: 'leadgen'
        }
      ]
    }
  ]
};

async function testWebhook() {
  try {
    console.log('🧪 Testing webhook with Google Sheets API...');
    console.log('📤 Sending to:', WEBHOOK_URL);
    console.log('📦 Payload:', JSON.stringify(leadPayload, null, 2));
    
    const response = await axios.post(WEBHOOK_URL, leadPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ Response Status:', response.status);
    console.log('📥 Response Data:', response.data);
    
  } catch (error) {
    console.error('❌ Test Failed:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Test webhook health
async function testWebhookHealth() {
  try {
    console.log('\n🏥 Testing webhook health...');
    
    const response = await axios.get(WEBHOOK_URL.replace('/webhook/facebook', '/health'), {
      timeout: 10000
    });
    
    console.log('✅ Health Check Status:', response.status);
    console.log('📥 Health Check Data:', response.data);
    
  } catch (error) {
    console.error('❌ Health Check Failed:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Run tests
async function runTests() {
  await testWebhookHealth();
  console.log('\n' + '='.repeat(50) + '\n');
  await testWebhook();
}

runTests(); 