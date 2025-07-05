// Test Google Sheets API integration
import { appendLeadToSheet, testGoogleSheetsConnection } from './services/googleSheetsService.js';
import dotenv from 'dotenv';

dotenv.config();

const SPREADSHEET_ID = '1KJB-28QU21Hg-IuavmkzdedxC8ycdguAgageFzYYfDo';

// Test lead data
const testLead = {
  leadId: `TEST-API-${Date.now()}`,
  project: 'Test Project',
  source: 'Facebook',
  name: 'Test User',
  email: 'test@example.com',
  phone: '1234567890',
  city: 'Test City',
  message: 'Test message from API',
  created_time: new Date().toISOString(),
  formId: 'test-form-123',
  pageId: 'test-page-456'
};

async function testConnection() {
  try {
    console.log('🔗 Testing Google Sheets connection...');
    const success = await testGoogleSheetsConnection(SPREADSHEET_ID);
    
    if (success) {
      console.log('✅ Google Sheets connection successful!');
      return true;
    } else {
      console.log('❌ Google Sheets connection failed!');
      return false;
    }
  } catch (error) {
    console.error('❌ Connection test error:', error.message);
    return false;
  }
}

async function testAppendLead() {
  try {
    console.log('\n📝 Testing lead append to Google Sheets...');
    console.log('📦 Test lead:', JSON.stringify(testLead, null, 2));
    
    const success = await appendLeadToSheet(testLead, SPREADSHEET_ID);
    
    if (success) {
      console.log('✅ Lead successfully appended to Google Sheets!');
      return true;
    } else {
      console.log('❌ Failed to append lead to Google Sheets!');
      return false;
    }
  } catch (error) {
    console.error('❌ Append test error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing Google Sheets API Integration...\n');
  
  // Test connection first
  const connectionOk = await testConnection();
  
  if (connectionOk) {
    // Test appending lead
    await testAppendLead();
  } else {
    console.log('❌ Skipping append test due to connection failure');
  }
  
  console.log('\n✅ Tests completed!');
}

runTests().catch(console.error); 