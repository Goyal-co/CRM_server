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
    
    // Create a comprehensive array with all available data
    const values = [
      [
        lead.leadId || '',
        lead.project || lead.formId || 'FB Form',
        lead.source || 'Facebook',
        lead.name || lead.full_name || lead.first_name || lead.last_name || '',
        lead.email || lead.email_address || '',
        lead.phone || lead.phone_number || lead.mobile || lead.telephone || '',
        lead.city || lead.location || lead.address || '',
        '', // Assigned To (will be filled by CRM)
        '', // Assigned Email (will be filled by CRM)
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
        // Additional Facebook fields - append all extra data
        lead.message || lead.comments || lead.description || '',
        lead.company || lead.organization || '',
        lead.job_title || lead.position || lead.occupation || '',
        lead.budget || lead.price_range || '',
        lead.timeline || lead.timeframe || lead.when_to_start || '',
        lead.property_type || lead.property_interest || '',
        lead.bedrooms || lead.beds || '',
        lead.location_preference || lead.area || lead.neighborhood || '',
        lead.lead_source || lead.how_did_you_hear || lead.referral_source || '',
        lead.urgency || lead.priority || lead.timeline_urgency || '',
        lead.additional_requirements || lead.special_requests || lead.notes || '',
        lead.facebook_page_id || lead.page_id || '',
        lead.facebook_form_id || lead.form_id || '',
        lead.created_time || lead.submission_date || '',
        // Add any other fields that might be in the lead object
        ...Object.keys(lead)
          .filter(key => !['leadId', 'project', 'source', 'name', 'email', 'phone', 'city', 'formId', 'full_name', 'first_name', 'last_name', 'email_address', 'phone_number', 'mobile', 'telephone', 'location', 'address', 'message', 'comments', 'description', 'company', 'organization', 'job_title', 'position', 'occupation', 'budget', 'price_range', 'timeline', 'timeframe', 'when_to_start', 'property_type', 'property_interest', 'bedrooms', 'beds', 'location_preference', 'area', 'neighborhood', 'lead_source', 'how_did_you_hear', 'referral_source', 'urgency', 'priority', 'timeline_urgency', 'additional_requirements', 'special_requests', 'notes', 'facebook_page_id', 'page_id', 'facebook_form_id', 'created_time', 'submission_date'].includes(key))
          .map(key => lead[key] || '')
      ]
    ];

    const request = {
      spreadsheetId,
      range: 'Leads!A1',
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
      range: 'Leads!A1:Z1'
    });
    
    return response.data.values?.[0] || [];
    
  } catch (error) {
    console.error('❌ Error getting sheet headers:', error.message);
    return [];
  }
} 