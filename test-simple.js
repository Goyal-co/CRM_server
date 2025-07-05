import { appendLeadToSheet, testGoogleSheetsConnection } from './services/googleSheetsService.js';

// Hardcoded sheet ID
const SPREADSHEET_ID = '1d3G11e2wd9ETH61sCCvOxdR75baRacAF-1ip1g55xBk';

async function testSimple() {
  console.log('🧪 Simple Google Sheets Test');
  console.log('📄 Sheet ID:', SPREADSHEET_ID);
  console.log('🔑 Service Account:', process.env.GOOGLE_SERVICE_ACCOUNT ? '✅ Set' : '❌ Not Set');
  
  if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
    console.error('❌ GOOGLE_SERVICE_ACCOUNT environment variable not set');
    console.log('💡 Add this to your Render environment variables:');
    console.log('GOOGLE_SERVICE_ACCOUNT={"type":"service_account",...}');
    return;
  }
  
  // Test connection
  console.log('\n1️⃣ Testing connection...');
  const connectionTest = await testGoogleSheetsConnection(SPREADSHEET_ID);
  
  if (!connectionTest) {
    console.error('❌ Connection failed!');
    console.error('💡 Please check:');
    console.error('   - Service account has access to the spreadsheet');
    console.error('   - Google Sheets API is enabled');
    return;
  }
  
  // Test appending a lead
  console.log('\n2️⃣ Testing lead append...');
  const testLead = {
    leadId: `SIMPLE-TEST-${Date.now()}`,
    project: 'Simple Test',
    source: 'Test Script',
    name: 'Simple Test User',
    email: 'simple@test.com',
    phone: '1234567890',
    city: 'Test City',
    message: 'Simple test from script',
    created_time: new Date().toISOString(),
    formId: 'SIMPLE_FORM',
    pageId: 'SIMPLE_PAGE'
  };
  
  const appendTest = await appendLeadToSheet(testLead, SPREADSHEET_ID);
  
  if (appendTest) {
    console.log('✅ SUCCESS! Lead added to Google Sheet');
    console.log('📝 Check your sheet to see the new row');
    console.log('\n🎉 Your Google Sheets integration is working!');
  } else {
    console.error('❌ Failed to add lead to sheet');
  }
}

// Run the test
testSimple().catch(console.error); 