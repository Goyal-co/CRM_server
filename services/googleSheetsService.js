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

    // Get all headers to maintain column order
    const headers = await getSheetHeaders(spreadsheetId);
    if (!headers || headers.length === 0) {
      throw new Error('Failed to get sheet headers');
    }

    // Create a row with empty values for all columns
    const rowData = new Array(headers.length).fill('');

    // Map lead data to the correct columns based on header names
    const columnMap = {
      'Lead ID': lead.leadId || `LEAD-${Date.now()}`,
      'Project': lead.project || 'Not Specified',
      'Source': lead.source || 'Facebook Lead',
      'Name': lead.name || '',
      'Email': lead.email || '',
      'Phone': lead.phone || '',
      'City': lead.city || '',
      'Assigned To': lead.assignedTo || '',
      'Assigned Email': lead.assignedEmail || '',
      'Assigned Time': lead.assignedTime || new Date().toISOString(),
      'Called?': lead.called || 'No',
      'Call Time': lead.callTime || '',
      'Call Delay?': lead.callDelay || 'No',
      'Site Visit?': lead.siteVisit || 'No',
      'Booked?': lead.booked || 'No',
      'Lead Quality': lead.leadQuality || 'Cold',
      'Feedback 1': lead.feedback1 || '',
      'Time 1': lead.time1 || '',
      'Feedback 2': lead.feedback2 || '',
      'Time 2': lead.time2 || '',
      'Feedback 3': lead.feedback3 || '',
      'Time 3': lead.time3 || '',
      'Feedback 4': lead.feedback4 || '',
      'Time 4': lead.time4 || '',
      'Feedback 5': lead.feedback5 || '',
      'Time 5': lead.time5 || '',
      'Site Visit Date': lead.siteVisitDate || '',
      'Old Project': lead.oldProject || '',
      'Transfer Reason': lead.transferReason || '',
      'Transferred': lead.transferred || 'No',
      'Transfer Time': lead.transferTime || '',
      'Size': lead.size || '',
      'Budget': lead.budget || '',
      'Purpose': lead.purpose || '',
      'Priority': lead.priority || 'Medium',
      'Work Location': lead.workLocation || ''
    };

    // Map the data to the correct columns based on header names
    headers.forEach((header, index) => {
      if (columnMap.hasOwnProperty(header)) {
        rowData[index] = columnMap[header];
      }
    });
    
    console.log('📝 Appending lead with data:', rowData);

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