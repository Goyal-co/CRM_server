// Google Apps Script to handle direct sheet writes
// Deploy this as a web app and use the URL as your API endpoint

// === Universal Gmail Lead Extractor ===
function extractLeadsFromGmail() {
  // ... (your full extractLeadsFromGmail code here, unchanged)
}

function extract(text, start, end) {
  // ... (your extract function here, unchanged)
}

function onEdit(e) {
  // ... (your onEdit function here, unchanged)
}

function assignUnassignedLeadsWithTeamStatus() {
  // ... (your assignUnassignedLeadsWithTeamStatus function here, unchanged)
}

function markCallDelays() {
  // ... (your markCallDelays function here, unchanged)
}

function logBreak() {
  // ... (your logBreak function here, unchanged)
}

function updatePerformanceTracker() {
  // ... (your updatePerformanceTracker function here, unchanged)
}

function sendAssignmentEmail(row) {
  // ... (your sendAssignmentEmail function here, unchanged)
}

// === UNIFIED doGet ===
function doGet(e) {
  try {
    // Health check: if no params, just return sheet status
    if (!e.parameter || Object.keys(e.parameter).length === 0) {
      const SHEET_ID = '1rdMmTZDGEJ4ZGt4b83tgA__8sMBIRvsPcZurQMzVQOo';
      const SHEET_NAME = 'Leads';
      const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
      const sheet = spreadsheet.getSheetByName(SHEET_NAME);
      const lastRow = sheet.getLastRow();
      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'Google Sheets API is running',
          sheetId: SHEET_ID,
          sheetName: SHEET_NAME,
          lastRow: lastRow,
          access: 'successful'
        }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeader('Access-Control-Allow-Origin', '*')
        .setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
        .setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // === Your existing doGet logic below ===
    // (Paste your full doGet logic here, unchanged)
    // ... (all your CRM API logic for actions, etc.) ...
    // (This is the long block you already have for all your CRM API endpoints)
    // (Paste your full doGet logic here, unchanged)
    // (You can copy-paste your current doGet logic after the health check above.)

    // --- BEGIN: Your existing doGet logic ---
    // (Paste your full doGet logic here, unchanged)
    // --- END: Your existing doGet logic ---

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'Error',
        error: error.toString(),
        stack: error.stack
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
      .setHeader('Access-Control-Allow-Credentials', 'true');
  }
}

// === UNIFIED doPost for webhook/lead appending ===
function doPost(e) {
  try {
    // Get the request data
    const data = JSON.parse(e.postData.contents);

    // Log the received data for debugging
    console.log('Received data:', JSON.stringify(data, null, 2));

    // Your Google Sheet ID (replace with your actual sheet ID)
    const SHEET_ID = '1rdMmTZDGEJ4ZGt4b83tgA__8sMBIRvsPcZurQMzVQOo';
    const SHEET_NAME = 'Leads';

    // Log sheet access attempt
    console.log('Attempting to access sheet:', SHEET_ID);

    // Open the spreadsheet
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    console.log('Spreadsheet opened successfully');

    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    console.log('Sheet accessed:', SHEET_NAME);

    // Prepare the row data
    const rowData = [
      data.leadId || '',
      data.project || data.formId || 'FB Form',
      data.source || 'Facebook',
      data.name || data.full_name || '',
      data.email || data.email_address || '',
      data.phone || data.phone_number || '',
      data.city || data.location || '',
      '', // Assigned To
      '', // Assigned Email
      new Date().toLocaleString('en-GB'), // Assigned Time
      '', // Called?
      '', // Call Time
      '', // Call Delay?
      '', // Site Visit?
      '', // Booked?
      '', // Lead Quality
      '', // Feedback 1
      '', // Time 1
      '', // Feedback 2
      '', // Time 2
      '', // Feedback 3
      '', // Time 3
      '', // Feedback 4
      '', // Time 4
      '', // Feedback 5
      '', // Time 5
      // Additional fields
      data.message || data.comments || '',
      data.company || data.organization || '',
      data.job_title || data.position || '',
      data.budget || data.price_range || '',
      data.timeline || data.timeframe || '',
      data.property_type || data.property_interest || '',
      data.bedrooms || data.beds || '',
      data.location_preference || data.area || '',
      data.lead_source || data.how_did_you_hear || '',
      data.urgency || data.priority || '',
      data.additional_requirements || data.special_requests || '',
      data.facebook_page_id || data.page_id || '',
      data.facebook_form_id || data.form_id || '',
      data.created_time || new Date().toISOString()
    ];

    // Add any additional fields from the data object
    Object.keys(data).forEach(key => {
      if (!['leadId', 'project', 'source', 'name', 'email', 'phone', 'city', 'formId', 'full_name', 'email_address', 'phone_number', 'location', 'message', 'comments', 'company', 'organization', 'job_title', 'position', 'budget', 'price_range', 'timeline', 'timeframe', 'property_type', 'property_interest', 'bedrooms', 'beds', 'location_preference', 'area', 'lead_source', 'how_did_you_hear', 'urgency', 'priority', 'additional_requirements', 'special_requests', 'facebook_page_id', 'page_id', 'facebook_form_id', 'created_time'].includes(key)) {
        rowData.push(data[key] || '');
      }
    });

    // Log the row data being appended
    console.log('Appending row data:', JSON.stringify(rowData, null, 2));

    // Append the row to the sheet
    sheet.appendRow(rowData);
    console.log('Row appended successfully');

    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Lead added successfully',
        leadId: data.leadId,
        rowData: rowData
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
      .setHeader('Access-Control-Allow-Credentials', 'true');

  } catch (error) {
    // Log the error details
    console.error('Error in doPost:', error.toString());
    console.error('Error stack:', error.stack);

    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        stack: error.stack
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
      .setHeader('Access-Control-Allow-Credentials', 'true');
  }
} 