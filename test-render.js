import axios from 'axios';

// Your Render deployment URL
const RENDER_URL = 'https://pratham-server.onrender.com';

// Test payload for the webhook
const testPayload = {
  leadId: `RENDER-TEST-${Date.now()}`,
  project: 'Render Test Project',
  source: 'Render Test',
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '1234567890',
  city: 'New York',
  message: 'This is a test payload from Render deployment',
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
            leadgen_id: `RENDER-LEAD-${Date.now()}`,
            form_id: 'RENDER_FORM_123',
            page_id: 'RENDER_PAGE_456'
          }
        }
      ]
    }
  ]
};

async function testHealth() {
  try {
    console.log('🏥 Testing health endpoint...');
    const response = await axios.get(`${RENDER_URL}/`, { timeout: 10000 });
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testWebhook() {
  try {
    console.log('🚀 Testing webhook with payload...');
    console.log('📦 Payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await axios.post(`${RENDER_URL}/api/test-webhook`, testPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
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
    
    const response = await axios.post(`${RENDER_URL}/api/fb-webhook`, facebookWebhookPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
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

async function main() {
  console.log('🧪 Starting Render webhook tests...\n');
  console.log('🌐 Testing against:', RENDER_URL);
  
  // Test health first
  const isHealthy = await testHealth();
  
  if (isHealthy) {
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 1: Simple webhook
    await testWebhook();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Facebook webhook format
    await testFacebookWebhook();
  } else {
    console.log('\n💡 Please check your Render deployment URL and ensure the server is running.');
  }
  
  console.log('\n✅ All tests completed!');
}

main(); 