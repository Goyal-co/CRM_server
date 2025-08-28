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

    // Create a row with only the fields that exist in the lead object
    const row = [];
    
    // Define the column mapping in order
    const columnMapping = [
      { key: 'leadId', defaultValue: `LEAD-${Date.now()}` },
      { key: 'project', defaultValue: 'Facebook Lead' },
      { key: 'source', defaultValue: 'Facebook' },
      { key: 'name', defaultValue: '' },
      { key: 'email', defaultValue: '' },
      { key: 'phone', defaultValue: '' },
      { key: 'city', defaultValue: '' },
      { key: 'size', defaultValue: '' },
      { key: 'budget', defaultValue: '' },
      { key: 'purpose', defaultValue: '' },
      { key: 'priority', defaultValue: 'Medium' },
      { key: 'workLocation', defaultValue: '' }
    ];
    
    // Build the row with only the fields that exist in the lead object
    columnMapping.forEach(column => {
      if (lead[column.key] !== undefined && lead[column.key] !== null && lead[column.key] !== '') {
        row.push(lead[column.key]);
      } else {
        row.push(column.defaultValue);
      }
    });
    
    // Add the row to the values array
    const values = [row];
    
    // Set the range to only include the columns we're updating
    const range = `Leads!A1:${String.fromCharCode(65 + row.length - 1)}1`;

    const request = {
      spreadsheetId,
      range: range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values
      }
    };

    const response = await sheets.spreadsheets.values.append(request);
    console.log('✅ Lead appended to Google Sheet:', response.data.updates?.updatedRange);
    console.log('📊 Data fields included:', Object.keys(lead).join(', '));
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
      ranges: ['Leads!A1:AJ1'], // Get headers from "Leads" sheet (extended range)
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
      range: 'Leads!A1:AJ1'
    });
    
    return response.data.values?.[0] || [];
    
  } catch (error) {
    console.error('❌ Error getting sheet headers:', error.message);
    return [];
  }
} 