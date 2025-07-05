import { appendLeadToSheet, testGoogleSheetsConnection, getSheetHeaders } from './services/googleSheetsService.js';

// Your Google Sheet ID
const SPREADSHEET_ID = '1d3G11e2wd9ETH61sCCvOxdR75baRacAF-1ip1g55xBk';

async function testNewSheet() {
  console.log('🧪 Testing new Google Sheet integration...\n');
  console.log('📄 Sheet ID:', SPREADSHEET_ID);
  
  // Step 1: Test connection
  console.log('1️⃣ Testing connection...');
  const connectionTest = await testGoogleSheetsConnection(SPREADSHEET_ID);
  
  if (!connectionTest) {
    console.error('❌ Connection failed!');
    console.error('💡 Please check:');
    console.error('   - GOOGLE_SERVICE_ACCOUNT environment variable is set');
    console.error('   - Service account has access to the spreadsheet');
    console.error('   - Google Sheets API is enabled');
    return;
  }
  
  // Step 2: Check headers
  console.log('\n2️⃣ Checking sheet headers...');
  const headers = await getSheetHeaders(SPREADSHEET_ID);
  console.log('📋 Headers found:', headers);
  
  // Step 3: Test appending a lead
  console.log('\n3️⃣ Testing lead append...');
  const testLead = {
    leadId: `NEW-SHEET-TEST-${Date.now()}`,
    project: 'New Sheet Test',
    source: 'Test Script',
    name: 'New Sheet User',
    email: 'newsheet@test.com',
    phone: '5551234567',
    city: 'Test City',
    message: 'Testing the new Google Sheet integration',
    created_time: new Date().toISOString(),
    formId: 'NEW_SHEET_FORM',
    pageId: 'NEW_SHEET_PAGE'
  };
  
  console.log('📦 Test lead data:', JSON.stringify(testLead, null, 2));
  
  const appendTest = await appendLeadToSheet(testLead, SPREADSHEET_ID);
  
  if (appendTest) {
    console.log('✅ SUCCESS! Lead added to your Google Sheet');
    console.log('📝 Check your sheet to see the new row');
    console.log('\n🎉 Your new Google Sheets integration is working!');
  } else {
    console.error('❌ Failed to add lead to sheet');
  }
}

// Run the test
testNewSheet().catch(console.error); 