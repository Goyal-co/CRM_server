const axios = require('axios');

// Test the URL format from the web search
const apiUrl = 'https://mcube.vmc.in/api/outboundcall?apikey=029f2e0cebd3e3473f0b4cbbaebd1ed5&exenumber=9014600977&custnumber=8187802142';

console.log('Testing MCUBE API with new format...');
console.log('URL:', apiUrl);

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
    console.log('Data Type:', typeof response.data);
    console.log('Data Length:', response.data ? response.data.length : 0);
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