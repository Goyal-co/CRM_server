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

    // Create a row with empty values for all columns (assuming we have at least 36 columns)
    const rowData = new Array(36).fill('');

    // Map only the specified columns from lead data (0-based indices)
    const columnMapping = {
      // Column A (0): Lead ID
      0: lead.leadId || `LEAD-${Date.now()}`,
      
      // Column B (1): Project
      1: lead.project || 'Not Specified',
      
      // Column C (2): Source
      2: lead.source || 'Facebook Lead',
      
      // Column D (3): Name
      3: lead.name || '',
      
      // Column E (4): Email
      4: lead.email || '',
      
      // Column F (5): Phone
      5: lead.phone || '',
      
      // Column G (6): City
      6: lead.city || '',
      
      // Column AF (31): Size
      31: lead.size || '',
      
      // Column AG (32): Budget
      32: lead.budget || '',
      
      // Column AH (33): Purpose
      33: lead.purpose || '',
      
      // Column AI (34): Priority
      34: lead.priority || 'Medium',
      
      // Column AJ (35): Work Location
      35: lead.workLocation || ''
    };

    // Apply the mapping to the row data
    Object.entries(columnMapping).forEach(([index, value]) => {
      rowData[parseInt(index)] = value;
    });
    
    console.log('📝 Appending lead with data:', columnMapping);

    const request = {
      spreadsheetId,
      range: 'Leads!A1',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [rowData]
      }
    };

    const response = await sheets.spreadsheets.values.append(request);
    console.log('✅ Lead appended to Google Sheet:', response.data.updates?.updatedRange);
    console.log('📊 Data fields included:', Object.keys(columnMapping).map(k => {
      const colNames = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      const colNum = parseInt(k);
      let colName = '';
      if (colNum >= 26) {
        colName = 'A' + colNames[colNum - 26];
      } else {
        colName = colNames[colNum];
      }
      return `${colName} (${colNum + 1})`;
    }).join(', '));
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
      ranges: ['Leads!A1:Z1'], // Get headers from "Leads" sheet (extended range)
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
      range: 'Leads!1:1', // Get first row (headers)
      majorDimension: 'ROWS',
      range: 'Leads!A1:Z1'
    });
    
    return response.data.values?.[0] || [];
    
  } catch (error) {
    console.error('❌ Error getting sheet headers:', error.message);
    return [];
  }
} 