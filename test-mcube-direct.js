const axios = require('axios');

const MCUBE_API_KEY = '029f2e0cebd3e3473f0b4cbbaebd1ed5';
const agent = '+919014600977';
const customer = '+919620660817';
const leadId = 'test123';

// Test without callback URL
const apiUrl = `https://mcube.vmc.in/api/outboundcall?apikey=${MCUBE_API_KEY}&exenumber=${encodeURIComponent(agent)}&custnumber=${encodeURIComponent(customer)}&refid=${encodeURIComponent(leadId)}`;

console.log('Testing MCUBE API without callback URL...');
console.log('URL:', apiUrl.replace(MCUBE_API_KEY, '****'));
console.log('Parameters:', { agent, customer, leadId });

async function testMCUBE() {
  try {
    const response = await axios.get(apiUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'CRM-System/1.0'
      }
    });
    
    console.log('\n✅ MCUBE API Response:');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    console.log('Headers:', response.headers);
    
  } catch (error) {
    console.log('\n❌ MCUBE API Error:');
    console.log('Message:', error.message);
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    console.log('Code:', error.code);
  }
}

testMCUBE(); 