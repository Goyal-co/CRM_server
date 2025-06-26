import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const MCUBE_API_KEY = process.env.MCUBE_API_KEY || '029f2e0cebd3e3473f0b4cbbaebd1ed5';

async function testMCUBEAPI() {
  console.log('🔍 MCUBE API Diagnostic Tool');
  console.log('============================');
  
  // Test 1: Check API Key
  console.log('\n1️⃣ Testing API Key...');
  console.log(`API Key: ${MCUBE_API_KEY.substring(0, 8)}...${MCUBE_API_KEY.substring(MCUBE_API_KEY.length - 4)}`);
  
  // Test 2: Test basic connectivity
  console.log('\n2️⃣ Testing MCUBE API connectivity...');
  try {
    const testUrl = `https://mcube.vmc.in/api/outboundcall?apikey=${MCUBE_API_KEY}&exenumber=%2B919014600977&custnumber=%2B919876543210&refid=diagnostic_test`;
    console.log(`Testing URL: ${testUrl.replace(MCUBE_API_KEY, '****')}`);
    
    const response = await axios.get(testUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'CRM-Diagnostic/1.0'
      }
    });
    
    console.log('✅ MCUBE API is reachable');
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${response.data}`);
    
    if (response.data === '') {
      console.log('⚠️  Warning: Empty response from MCUBE API');
      console.log('This might indicate:');
      console.log('   - Invalid API key');
      console.log('   - Agent number not registered');
      console.log('   - MCUBE service issues');
    }
    
  } catch (error) {
    console.log('❌ MCUBE API connection failed');
    console.log(`Error: ${error.message}`);
    
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Response: ${error.response.data}`);
      
      if (error.response.status === 401) {
        console.log('🔑 Issue: Invalid API key');
      } else if (error.response.status === 400) {
        console.log('📞 Issue: Invalid phone number format or parameters');
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.log('🌐 Issue: Cannot connect to MCUBE servers');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('⏰ Issue: Request timed out');
    }
  }
  
  // Test 3: Check with different phone numbers
  console.log('\n3️⃣ Testing with different phone number formats...');
  const testNumbers = [
    '+919014600977',
    '919014600977',
    '9014600977',
    '+91-9014600977'
  ];
  
  for (const number of testNumbers) {
    try {
      const testUrl = `https://mcube.vmc.in/api/outboundcall?apikey=${MCUBE_API_KEY}&exenumber=${encodeURIComponent(number)}&custnumber=%2B919876543210&refid=format_test`;
      const response = await axios.get(testUrl, { timeout: 5000 });
      console.log(`✅ ${number}: ${response.data || 'Empty response'}`);
    } catch (error) {
      console.log(`❌ ${number}: ${error.message}`);
    }
  }
  
  // Test 4: Check MCUBE documentation
  console.log('\n4️⃣ MCUBE API Documentation Check...');
  console.log('📖 MCUBE API Documentation: https://mcube.vmc.in/api/docs');
  console.log('📞 MCUBE Support: Contact MCUBE support for API key and number registration');
  
  console.log('\n📋 Troubleshooting Steps:');
  console.log('1. Verify your MCUBE API key is active and valid');
  console.log('2. Ensure your agent phone number is registered with MCUBE');
  console.log('3. Check if MCUBE service is operational');
  console.log('4. Contact MCUBE support with your API key and phone number');
  console.log('5. Test with MCUBE\'s official test numbers if available');
}

// Run the diagnostic
testMCUBEAPI().catch(console.error); 