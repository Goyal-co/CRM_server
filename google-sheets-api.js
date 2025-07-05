// Google Apps Script to handle direct sheet writes
// Deploy this as a web app and use the URL as your API endpoint

function doPost(e) {
  try {
    // Get the request data
    const data = JSON.parse(e.postData.contents);
    
    // Log the received data for debugging
    console.log('Received data:', JSON.stringify(data, null, 2));
    
    // Your Google Sheet ID (replace with your actual sheet ID)
    const SHEET_ID = '1rdMmTZDGEJ4ZGt4b83tgA__8sMBIRvsPcZurQMzVQOo';
    const SHEET_NAME = 'Leads';
    
    // Open the spreadsheet
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
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
    
    // Append the row to the sheet
    sheet.appendRow(rowData);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Lead added successfully',
        leadId: data.leadId
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput('Google Sheets API is running')
    .setMimeType(ContentService.MimeType.TEXT);
} 