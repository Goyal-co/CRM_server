import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const MCUBE_API_KEY = process.env.MCUBE_API_KEY || '34b4391e00592dc6aa2a117da495e0f5';

async function testMCUBEOfficial() {
  console.log('🧪 MCUBE Official Test');
  console.log('=====================');
  
  // Test 1: Check if MCUBE has a status endpoint
  console.log('\n1️⃣ Testing MCUBE status endpoint...');
  try {
    const statusUrl = 'https://mcube.vmc.in/api/status';
    const response = await axios.get(statusUrl, { timeout: 5000 });
    console.log('✅ Status endpoint response:', response.data);
  } catch (error) {
    console.log('❌ Status endpoint not available:', error.message);
  }
  
  // Test 2: Try different MCUBE API endpoints
  console.log('\n2️⃣ Testing different MCUBE endpoints...');
  const endpoints = [
    'https://mcube.vmc.in/api/test',
    'https://mcube.vmc.in/api/health',
    'https://mcube.vmc.in/api/ping',
    'https://mcube.vmc.in/api/version'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(endpoint, { timeout: 5000 });
      console.log(`✅ ${endpoint}: ${response.data}`);
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }
  
  // Test 3: Try with different API key format
  console.log('\n3️⃣ Testing API key variations...');
  const apiKeyVariations = [
    MCUBE_API_KEY,
    MCUBE_API_KEY.toUpperCase(),
    MCUBE_API_KEY.toLowerCase()
  ];
  
  for (const key of apiKeyVariations) {
    try {
      const testUrl = `https://mcube.vmc.in/api/outboundcall?apikey=${key}&exenumber=%2B919014600977&custnumber=%2B919876543210&refid=key_test`;
      const response = await axios.get(testUrl, { timeout: 5000 });
      console.log(`✅ Key ${key.substring(0, 8)}...: ${response.data || 'Empty'}`);
    } catch (error) {
      console.log(`❌ Key ${key.substring(0, 8)}...: ${error.message}`);
    }
  }
  
  // Test 4: Check MCUBE documentation
  console.log('\n4️⃣ MCUBE Documentation Links...');
  console.log('📖 API Docs: https://mcube.vmc.in/api/docs');
  console.log('📖 Developer Portal: https://mcube.vmc.in/developer');
  console.log('📖 Support: https://mcube.vmc.in/support');
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Contact MCUBE support at support@mcube.vmc.in');
  console.log('2. Provide your API key: ' + MCUBE_API_KEY);
  console.log('3. Request agent number registration for: +919014600977');
  console.log('4. Ask for test credentials or demo account');
  console.log('5. Verify if MCUBE service is operational in your region');
}

testMCUBEOfficial().catch(console.error); 