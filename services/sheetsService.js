import { google } from 'googleapis';

const SPREADSHEET_ID = '1rdMmTZDGEJ4ZGt4b83tgA__8sMBIRvsPcZurQMzVQOo';
const SHEET_NAME = 'Leads';

async function authorizeGoogle() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}


export async function appendLeadToSheet(lead) {
  const sheets = await authorizeGoogle();

<<<<<<< HEAD
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
=======
  const values = [
    [
      lead.leadId || '',
      '', // Project (blank by default)
      lead.source || 'Facebook',
      lead.name || '',
      lead.email || '',
      lead.phone || '',
      '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
>>>>>>> 90f45fab72e0ae96e596192cb76ae5165d88fc70
    ]
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values,
    },
  });

<<<<<<< HEAD
  console.log('✅ Lead pushed to Google Sheet with all available data');
  console.log('📊 Data fields included:', Object.keys(lead).join(', '));
=======
  console.log('✅ Lead pushed to Google Sheet');
>>>>>>> 90f45fab72e0ae96e596192cb76ae5165d88fc70
}
