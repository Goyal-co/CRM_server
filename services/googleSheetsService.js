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

    // Map lead data to specific column indices (0-based)
    // A:1, B:2, ..., Z:26, AA:27, AB:28, AC:29, AD:30, AE:31, AF:32, AG:33, AH:34, AI:35, AJ:36
    const columnMapping = {
      // Column A (1-based index 0)
      0: lead.leadId || `LEAD-${Date.now()}`,  // Lead ID
      
      // Column B (1-based index 1)
      1: lead.project || 'Not Specified',  // Project
      
      // Column C (1-based index 2)
      2: lead.source || 'Facebook Lead',  // Source
      
      // Column D (1-based index 3)
      3: lead.name || '',  // Name
      
      // Column E (1-based index 4)
      4: lead.email || '',  // Email
      
      // Column F (1-based index 5)
      5: lead.phone || '',  // Phone
      
      // Column G (1-based index 6)
      6: lead.city || '',  // City
      
      // Column AF (1-based index 31)
      31: lead.size || '',  // Size
      
      // Column AG (1-based index 32)
      32: lead.budget || '',  // Budget
      
      // Column AH (1-based index 33)
      33: lead.purpose || '',  // Purpose
      
      // Column AI (1-based index 34)
      34: lead.priority || 'Medium',  // Priority
      
      // Column AJ (1-based index 35)
      35: lead.workLocation || ''  // Work Location
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
    console.log('📊 Data fields included:', Object.keys(columnMap).join(', '));
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