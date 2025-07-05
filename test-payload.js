import axios from 'axios';

// Test payload for the webhook
const testPayload = {
  leadId: `TEST-${Date.now()}`,
  project: 'Test Project',
  source: 'Test Webhook',
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '1234567890',
  city: 'New York',
  message: 'This is a test lead from webhook payload',
  created_time: new Date().toISOString()
};

// Facebook webhook format payload
const facebookWebhookPayload = {
  object: 'page',
  entry: [
    {
      id: '123456789',
      time: Math.floor(Date.now() / 1000),
      changes: [
        {
          field: 'leadgen',
          value: {
            leadgen_id: `LEAD-${Date.now()}`,
            form_id: 'TEST_FORM_123',
            page_id: 'TEST_PAGE_456'
          }
        }
      ]
    }
  ]
};

async function testWebhook() {
  try {
    console.log('🚀 Testing webhook with payload...');
    console.log('📦 Payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await axios.post('http://localhost:5000/api/test-webhook', testPayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Response status:', response.status);
    console.log('📄 Response data:', response.data);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('📄 Error response:', error.response.data);
      console.error('📊 Status:', error.response.status);
    }
  }
}

async function testFacebookWebhook() {
  try {
    console.log('🚀 Testing Facebook webhook format...');
    console.log('📦 Facebook payload:', JSON.stringify(facebookWebhookPayload, null, 2));
    
    const response = await axios.post('http://localhost:5000/api/fb-webhook', facebookWebhookPayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Response status:', response.status);
    console.log('📄 Response data:', response.data);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('📄 Error response:', error.response.data);
      console.error('📊 Status:', error.response.status);
    }
  }
}

// Run both tests
console.log('🧪 Starting webhook tests...\n');

// Test 1: Simple webhook
await testWebhook();
console.log('\n' + '='.repeat(50) + '\n');

// Test 2: Facebook webhook format
await testFacebookWebhook();

console.log('\n✅ All tests completed!'); 