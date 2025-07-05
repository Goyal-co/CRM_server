import { appendLeadToSheet, testGoogleSheetsConnection, getSheetHeaders } from './services/googleSheetsService.js';

// Configuration - Update these values
const SPREADSHEET_ID = '1d3G11e2wd9ETH61sCCvOxdR75baRacAF-1ip1g55xBk';
const SHEET_NAME = 'Sheet1'; // Update if your sheet has a different name

async function setupGoogleSheets() {
  console.log('🔧 Setting up Google Sheets integration...\n');
  
  // Step 1: Test connection
  console.log('1️⃣ Testing Google Sheets connection...');
  const connectionTest = await testGoogleSheetsConnection(SPREADSHEET_ID);
  
  if (!connectionTest) {
    console.error('❌ Connection failed. Please check:');
    console.error('   - GOOGLE_SERVICE_ACCOUNT environment variable is set');
    console.error('   - Service account has access to the spreadsheet');
    console.error('   - Spreadsheet ID is correct');
    return;
  }
  
  // Step 2: Get headers
  console.log('\n2️⃣ Checking sheet headers...');
  const headers = await getSheetHeaders(SPREADSHEET_ID);
  console.log('📋 Current headers:', headers);
  
  // Step 3: Test appending a lead
  console.log('\n3️⃣ Testing lead append...');
  const testLead = {
    leadId: `SETUP-TEST-${Date.now()}`,
    project: 'Setup Test',
    source: 'Setup Script',
    name: 'Setup Test User',
    email: 'setup@test.com',
    phone: '9876543210',
    city: 'Setup City',
    message: 'This is a setup test lead',
    created_time: new Date().toISOString(),
    formId: 'SETUP_FORM',
    pageId: 'SETUP_PAGE'
  };
  
  const appendTest = await appendLeadToSheet(testLead, SPREADSHEET_ID);
  
  if (appendTest) {
    console.log('✅ Setup completed successfully!');
    console.log('📝 Test lead added to your Google Sheet');
    console.log('\n🎉 Your webhook is ready to use!');
  } else {
    console.error('❌ Setup failed. Please check the error messages above.');
  }
}

// Instructions for setup
console.log('📋 GOOGLE SHEETS SETUP INSTRUCTIONS');
console.log('=====================================');
console.log('');
console.log('1. Create a new Google Sheet with these headers:');
console.log('   A1: leadId | B1: project | C1: source | D1: name | E1: email');
console.log('   F1: phone | G1: city | H1: message | I1: created_time | J1: formId | K1: pageId');
console.log('');
console.log('2. Get your Spreadsheet ID from the URL:');
console.log('   https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID_HERE/edit');
console.log('');
console.log('3. Create a Google Cloud Service Account:');
console.log('   - Go to console.cloud.google.com');
console.log('   - Create a new project');
console.log('   - Enable Google Sheets API');
console.log('   - Create a service account');
console.log('   - Download the JSON key file');
console.log('');
console.log('4. Share your Google Sheet with the service account email');
console.log('');
console.log('5. Set the environment variable:');
console.log('   GOOGLE_SERVICE_ACCOUNT={"type":"service_account",...}');
console.log('');
console.log('6. Update SPREADSHEET_ID in this file and run: node setup-google-sheets.js');
console.log('');

// Check if spreadsheet ID is set
if (SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID_HERE') {
  console.log('⚠️  Please update SPREADSHEET_ID in this file before running the setup.');
} else {
  setupGoogleSheets();
} 