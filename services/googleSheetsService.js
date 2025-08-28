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

    // Define the columns we want to update from Meta lead form
    const metaLeadColumns = [
      'Lead ID', 'Project', 'Source', 'Name', 'Email', 'Phone', 'City',
      'Size', 'Budget', 'Purpose', 'Priority', 'Work Location'
    ];
    
    // Get all headers to maintain column order
    const headers = await getSheetHeaders(spreadsheetId);
    if (!headers || headers.length === 0) {
      throw new Error('Failed to get sheet headers');
    }

    // Create a row with empty values for all columns
    const rowData = new Array(headers.length).fill('');

    // Map only the Meta lead fields we want to update
    const metaLeadData = {
      'Lead ID': lead.leadId || `LEAD-${Date.now()}`,
      'Project': lead.project || 'Not Specified',
      'Source': lead.source || 'Facebook Lead',
      'Name': lead.name || '',
      'Email': lead.email || '',
      'Phone': lead.phone || '',
      'City': lead.city || '',
      'Size': lead.size || '',
      'Budget': lead.budget || '',
      'Purpose': lead.purpose || '',
      'Priority': lead.priority || 'Medium',
      'Work Location': lead.workLocation || ''
    };

    // Map the data to the correct columns based on header names
    headers.forEach((header, index) => {
      if (metaLeadData.hasOwnProperty(header) && metaLeadColumns.includes(header)) {
        rowData[index] = metaLeadData[header];
      }
    });
    
    console.log('📝 Appending lead with data:', metaLeadData);

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