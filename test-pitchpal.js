#!/usr/bin/env node

/**
 * PitchPal Test Script
 * Tests all PitchPal functionality to ensure everything works correctly
 */

const API_URL = process.env.VITE_API_URL || 'https://api.goyalhariyanacrm.in/';

console.log('🧪 Testing PitchPal functionality...');
console.log('API URL:', API_URL);

// Test 1: Backend Health Check
async function testBackendHealth() {
  console.log('\n1️⃣ Testing backend health...');
  try {
    const response = await fetch(`${API_URL}/`);
    if (response.ok) {
      console.log('✅ Backend is running');
      return true;
    } else {
      console.log('❌ Backend returned status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend connection failed:', error.message);
    return false;
  }
}

// Test 2: CORS Headers
async function testCORS() {
  console.log('\n2️⃣ Testing CORS headers...');
  try {
    const response = await fetch(`${API_URL}/api/generate-pitch`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    const corsHeaders = {
      'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
      'access-control-allow-headers': response.headers.get('access-control-allow-headers')
    };
    
    console.log('CORS Headers:', corsHeaders);
    
    if (corsHeaders['access-control-allow-origin']) {
      console.log('✅ CORS headers are set');
      return true;
    } else {
      console.log('❌ CORS headers missing');
      return false;
    }
  } catch (error) {
    console.log('❌ CORS test failed:', error.message);
    return false;
  }
}

// Test 3: AI Generation (Project Name Only)
async function testAIGeneration() {
  console.log('\n3️⃣ Testing AI generation with project name...');
  try {
    const response = await fetch(`${API_URL}/api/generate-pitch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectName: 'Test Project'
      })
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.log('❌ AI generation failed:', response.status, text);
      return false;
    }
    
    const data = await response.json();
    
    if (data.whyThis && data.pitchLines && data.faqs) {
      console.log('✅ AI generation successful');
      console.log('Generated sections:', Object.keys(data).filter(key => key !== 'projectInfo' && key !== 'usedAI'));
      return true;
    } else {
      console.log('❌ AI generation returned incomplete data');
      return false;
    }
  } catch (error) {
    console.log('❌ AI generation test failed:', error.message);
    return false;
  }
}

// Test 4: AI Generation (With Project Info)
async function testAIGenerationWithInfo() {
  console.log('\n4️⃣ Testing AI generation with project info...');
  try {
    const response = await fetch(`${API_URL}/api/generate-pitch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectInfo: {
          name: 'Test Project',
          location: 'Test Location',
          price: '₹5000/sq ft',
          amenities: 'Pool, Gym, Garden'
        },
        corrections: [
          {
            field: 'pitchLines',
            rejectedItem: 'This is a bad pitch line',
            reason: 'Too generic'
          }
        ]
      })
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.log('❌ AI generation with info failed:', response.status, text);
      return false;
    }
    
    const data = await response.json();
    
    if (data.whyThis && data.pitchLines && data.faqs) {
      console.log('✅ AI generation with project info successful');
      return true;
    } else {
      console.log('❌ AI generation with info returned incomplete data');
      return false;
    }
  } catch (error) {
    console.log('❌ AI generation with info test failed:', error.message);
    return false;
  }
}

// Test 5: Project Info Generation
async function testProjectInfoGeneration() {
  console.log('\n5️⃣ Testing project info generation...');
  try {
    const response = await fetch(`${API_URL}/api/generate-project-info?name=Orchid%20Platinum`);
    
    if (!response.ok) {
      const text = await response.text();
      console.log('❌ Project info generation failed:', response.status, text);
      return false;
    }
    
    const data = await response.json();
    
    if (data.projectInfo && data.projectInfo.notes) {
      console.log('✅ Project info generation successful');
      return true;
    } else {
      console.log('❌ Project info generation returned incomplete data');
      return false;
    }
  } catch (error) {
    console.log('❌ Project info generation test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  const tests = [
    testBackendHealth,
    testCORS,
    testAIGeneration,
    testAIGenerationWithInfo,
    testProjectInfoGeneration
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test();
      results.push(result);
    } catch (error) {
      console.log('❌ Test failed with error:', error.message);
      results.push(false);
    }
  }
  
  console.log('\n📊 Test Results:');
  console.log('================');
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! PitchPal is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the errors above.');
  }
  
  return passed === total;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runAllTests }; 