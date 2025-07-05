import { google } from 'googleapis';

// Google Sheets API configuration
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Initialize Google Sheets API
function getGoogleSheetsAPI() {
  try {
    // Get service account credentials from environment variable
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    
    if (!credentials) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT environment variable not set');
    }
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: SCOPES,
    });

    return google.sheets({ version: 'v4', auth });
  } catch (error) {
    console.error('❌ Error initializing Google Sheets API:', error.message);
    throw error;
  }
}

// Append lead to Google Sheet
export async function appendLeadToSheet(lead, spreadsheetId) {
  try {
    const sheets = getGoogleSheetsAPI();
    
    // Prepare the row data
    const rowData = [
      lead.leadId || '',
      lead.project || '',
      lead.source || '',
      lead.name || '',
      lead.email || '',
      lead.phone || '',
      lead.city || '',
      lead.message || '',
      lead.created_time || new Date().toISOString(),
      lead.formId || '',
      lead.pageId || ''
    ];

    const request = {
      spreadsheetId,
      range: 'Leads!A:K', // Use the correct sheet name "Leads"
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [rowData]
      }
    };

    const response = await sheets.spreadsheets.values.append(request);
    
    console.log('✅ Lead appended to Google Sheet:', response.data.updates?.updatedRange);
    return true;
    
  } catch (error) {
    console.error('❌ Error appending to Google Sheet:', error.message);
    return false;
  }
}

// Test function to verify Google Sheets connection
export async function testGoogleSheetsConnection(spreadsheetId) {
  try {
    const sheets = getGoogleSheetsAPI();
    
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      ranges: ['Leads!A1:K1'], // Get headers from "Leads" sheet
      fields: 'sheets.properties.title,sheets.data.rowData'
    });
    
    console.log('✅ Google Sheets connection successful');
    console.log('📄 Sheet title:', response.data.sheets[0].properties.title);
    return true;
    
  } catch (error) {
    console.error('❌ Google Sheets connection failed:', error.message);
    return false;
  }
}

// Get sheet headers
export async function getSheetHeaders(spreadsheetId) {
  try {
    const sheets = getGoogleSheetsAPI();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Leads!A1:K1'
    });
    
    return response.data.values?.[0] || [];
    
  } catch (error) {
    console.error('❌ Error getting sheet headers:', error.message);
    return [];
  }
} 