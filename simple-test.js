import axios from 'axios';

// Simple test payload
const testPayload = {
  leadId: `SIMPLE-TEST-${Date.now()}`,
  name: 'Test User',
  email: 'test@example.com',
  phone: '9876543210',
  city: 'Test City',
  message: 'Simple test payload'
};

async function testSimpleWebhook() {
  try {
    console.log('🚀 Testing simple webhook...');
    console.log('📦 Payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await axios.post('http://localhost:5000/api/test-webhook', testPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    console.log('✅ Success! Status:', response.status);
    console.log('📄 Response:', response.data);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Server is not running. Please start the server first.');
    } else if (error.response) {
      console.error('📄 Error response:', error.response.data);
      console.error('📊 Status:', error.response.status);
    }
  }
}

// Test health endpoint first
async function testHealth() {
  try {
    console.log('🏥 Testing health endpoint...');
    const response = await axios.get('http://localhost:5000/', { timeout: 3000 });
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🧪 Starting simple webhook test...\n');
  
  // Test health first
  const isHealthy = await testHealth();
  
  if (isHealthy) {
    console.log('\n' + '='.repeat(50) + '\n');
    await testSimpleWebhook();
  } else {
    console.log('\n💡 Please start the server first with: npm start');
  }
  
  console.log('\n✅ Test completed!');
}

main(); 