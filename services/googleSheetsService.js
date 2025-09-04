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

    // Log the incoming lead data for debugging
    console.log('📥 Incoming lead data:', JSON.stringify(lead, null, 2));

    // Create a row with only the fields that exist in the lead object
    const row = [];
    
    // Define the column mapping to match exact Google Sheets structure (38 columns)
    const columnMapping = [
      // Column 1: Lead ID
      { 
        key: 'leadId', 
        aliases: ['leadid', 'id', 'lead_id', 'lead id'], 
        defaultValue: `LEAD-${Date.now()}` 
      },
      // Column 2: Project
      { 
        key: 'project', 
        aliases: ['project', 'projectname', 'project_name', 'project name', 'projectname'], 
        defaultValue: 'Facebook Lead' 
      },
      // Column 3: Source
      { 
        key: 'source', 
        aliases: ['source', 'leadsource', 'lead_source', 'lead source'], 
        defaultValue: 'Facebook' 
      },
      // Column 4: Name
      { 
        key: 'name', 
        aliases: [
          'name', 'fullname', 'full_name', 'full name', 'contactname', 'contact_name', 
          'contact name', 'fullname', 'Full name', 'Full Name', 'FULL NAME', 'Full_Name',
          'Full name', 'Full Name', 'FULL_NAME', 'Fullname', 'FULLNAME', 'Contact Name'
        ], 
        defaultValue: '' 
      },
      // Column 5: Email
      { 
        key: 'email', 
        aliases: [
          'email', 'emailaddress', 'email_address', 'email address', 'email-address',
          'Email', 'Email Address', 'EMAIL', 'Email_Address', 'Email-Address',
          'emailaddress', 'EmailAddress', 'EMAIL_ADDRESS', 'email-address'
        ], 
        defaultValue: '' 
      },
      // Column 6: Phone
      { 
        key: 'phone', 
        aliases: [
          'phone', 'phonenumber', 'phone_number', 'mobile', 'contactnumber', 'contact_number',
          'Phone', 'Phone Number', 'PHONE', 'Phone_Number', 'Phone-Number', 'phone number',
          'Phone number', 'PHONE_NUMBER', 'phone-number', 'Mobile', 'MOBILE', 'Mobile Number',
          'mobile number', 'Mobile_Number', 'mobile_number', 'contact', 'Contact', 'CONTACT',
          'Contact Number', 'contact number', 'Contact_Number', 'contact_number'
        ], 
        defaultValue: '' 
      },
      // Column 7: City
      { 
        key: 'city', 
        aliases: [
          'city', 'location', 'cityname', 'city_name', 'city name', 'City', 'CITY',
          'Location', 'LOCATION', 'City Name', 'cityName', 'CityName', 'CITY_NAME'
        ], 
        defaultValue: '' 
      },
      // Columns 8-31: Empty placeholders for existing sheet structure
      { key: 'assignedTo', aliases: [], defaultValue: '' },
      { key: 'assignedEmail', aliases: [], defaultValue: '' },
      { key: 'assignedTime', aliases: [], defaultValue: '' },
      { key: 'called', aliases: [], defaultValue: '' },
      { key: 'callTime', aliases: [], defaultValue: '' },
      { key: 'callDelay', aliases: [], defaultValue: '' },
      { key: 'siteVisit', aliases: [], defaultValue: '' },
      { key: 'booked', aliases: [], defaultValue: '' },
      { key: 'leadQuality', aliases: [], defaultValue: '' },
      { key: 'feedback1', aliases: [], defaultValue: '' },
      { key: 'time1', aliases: [], defaultValue: '' },
      { key: 'feedback2', aliases: [], defaultValue: '' },
      { key: 'time2', aliases: [], defaultValue: '' },
      { key: 'feedback3', aliases: [], defaultValue: '' },
      { key: 'time3', aliases: [], defaultValue: '' },
      { key: 'feedback4', aliases: [], defaultValue: '' },
      { key: 'time4', aliases: [], defaultValue: '' },
      { key: 'feedback5', aliases: [], defaultValue: '' },
      { key: 'time5', aliases: [], defaultValue: '' },
      { key: 'siteVisitDate', aliases: [], defaultValue: '' },
      { key: 'oldProject', aliases: [], defaultValue: '' },
      { key: 'transferReason', aliases: [], defaultValue: '' },
      { key: 'transferred', aliases: [], defaultValue: '' },
      { key: 'transferTime', aliases: [], defaultValue: '' },
      // Column 32: Size
      { 
        key: 'size', 
        aliases: [
          'size', 'preferredsize', 'size_preference', 'size preference', 'preferred size',
          'Size', 'SIZE', 'Size_Preference', 'size-preference', 'Preferred Size',
          'preferred_size', 'Preferred_Size', 'PREFERRED_SIZE', 'Your preferred size?',
          'your preferred size', 'your_preferred_size', 'your-preferred-size', 'Your_Preferred_Size',
          'YOUR_PREFERRED_SIZE', 'YourPreferredSize', 'yourpreferredsize', 'YOURPREFERREDSIZE'
        ], 
        defaultValue: '' 
      },
      // Column 33: Budget
      { 
        key: 'budget', 
        aliases: [
          'budget', 'budgetrange', 'budget_range', 'budget range', 'Budget', 'BUDGET',
          'Budget Range', 'budget-range', 'Budget_Range', 'BUDGET_RANGE', 'BudgetRange',
          'budgetRange', 'BUDGETRANGE', 'Budget (Above 4.8Cr)', 'Budget (Above 4.8Cr)',
          'budget_above_4.8cr', 'budget-above-4.8cr', 'Budget_Above_4.8Cr', 'BUDGET_ABOVE_4.8CR',
          'Budget Dropdown', 'budget_dropdown', 'budget-dropdown', 'Budget_Dropdown',
          'BUDGET_DROPDOWN', 'BudgetDropdown', 'budgetdropdown', 'BUDGETDROPDOWN'
        ], 
        defaultValue: '' 
      },
      // Column 34: Purpose
      { 
        key: 'purpose', 
        aliases: [
          'purpose', 'requirement', 'purposeofpurchase', 'purpose of purchase', 'purpose_of_purchase',
          'Purpose', 'PURPOSE', 'Purpose of Purchase', 'purpose-of-purchase', 'Purpose_Of_Purchase',
          'PURPOSE_OF_PURCHASE', 'PurposeOfPurchase', 'purposeOfPurchase', 'PURPOSEOFPURCHASE',
          'Requirement', 'REQUIREMENT', 'requirement', 'requirements', 'Requirements', 'REQUIREMENTS'
        ], 
        defaultValue: '' 
      },
      // Column 35: Priority
      { 
        key: 'priority', 
        aliases: [
          'priority', 'prioritylevel', 'leadpriority', 'priority level', 'lead priority',
          'Priority', 'PRIORITY', 'Priority Level', 'priority-level', 'Priority_Level',
          'PRIORITY_LEVEL', 'PriorityLevel', 'priorityLevel', 'PRIORITYLEVEL',
          'Top Priority ( Lifestyle / Connectivity / Amenities etc)', 'Top Priority',
          'top_priority', 'top-priority', 'Top_Priority', 'TOP_PRIORITY', 'TopPriority',
          'topPriority', 'TOPPRIORITY', 'Lifestyle / Connectivity / Amenities',
          'lifestyle_connectivity_amenities', 'lifestyle-connectivity-amenities',
          'Lifestyle_Connectivity_Amenities', 'LIFESTYLE_CONNECTIVITY_AMENITIES',
          'LifestyleConnectivityAmenities', 'lifestyleConnectivityAmenities',
          'LIFESTYLECONNECTIVITYAMENITIES', 'Top Priority ( Lifestyle/ Connectivity/ Amenities etc)'
        ], 
        defaultValue: '' 
      },
      // Column 36: Work Location
      { 
        key: 'workLocation', 
        aliases: [
          'worklocation', 'work_location', 'officelocation', 'office_location', 'work location',
          'office location', 'Work Location', 'Work_Location', 'WORK_LOCATION', 'WorkLocation',
          'workLocation', 'WORKLOCATION', 'Office Location', 'office_location', 'Office_Location',
          'OFFICE_LOCATION', 'OfficeLocation', 'officeLocation', 'OFFICELOCATION',
          'Work Address', 'work_address', 'work-address', 'Work_Address', 'WORK_ADDRESS',
          'WorkAddress', 'workAddress', 'WORKADDRESS'
        ], 
        defaultValue: '' 
      },
      // Columns 37-38: Site Visit Done fields
      { key: 'siteVisitDone', aliases: [], defaultValue: '' },
      { key: 'siteVisitDoneDate', aliases: [], defaultValue: '' }
    ];
    
    // Build the row with case-insensitive field matching and handle special characters
    columnMapping.forEach(column => {
      let value = column.defaultValue; // Start with default value
      let found = false;
      
      // Function to normalize strings for comparison
      const normalize = (str) => {
        if (!str) return '';
        return str.toString()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')  // Remove all non-alphanumeric characters
          .trim();
      };

      // First try exact match
      if (lead[column.key] !== undefined && lead[column.key] !== null && lead[column.key] !== '') {
        value = lead[column.key];
        console.log(`✅ Exact match for '${column.key}':`, value);
        found = true;
      } 
      
      // If no exact match, try case-insensitive match with normalized keys
      if (!found) {
        const leadKeys = Object.keys(lead);
        
        // First try direct match with normalized keys
        for (const leadKey of leadKeys) {
          if (normalize(leadKey) === normalize(column.key)) {
            value = lead[leadKey];
            console.log(`🔄 Mapped field '${leadKey}' to '${column.key}':`, value);
            found = true;
            break;
          }
        }
        
        // If still no match, try aliases
        if (!found && column.aliases) {
          for (const leadKey of leadKeys) {
            const normalizedLeadKey = normalize(leadKey);
            const matchingAlias = column.aliases.find(alias => 
              normalize(alias) === normalizedLeadKey
            );
            
            if (matchingAlias) {
              value = lead[leadKey];
              console.log(`🔄 Mapped alias '${leadKey}' (${matchingAlias}) to '${column.key}':`, value);
              found = true;
              break;
            }
          }
        }
      }
      
      // Handle field names in values (e.g., "Your preferred size?: 3 BHK" -> "3 BHK")
      if (typeof value === 'string') {
        // Try matching any of the possible field names in the value
        const fieldPatterns = [
          column.key,
          ...(column.aliases || [])
        ];
        
        for (const pattern of fieldPatterns) {
          const regex = new RegExp(`^${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\s:]+`, 'i');
          if (regex.test(value)) {
            value = value.replace(regex, '').trim();
            console.log(`✨ Extracted value for '${column.key}':`, value);
            break;
          }
        }
      }
      
      // If we still don't have a value, use the default
      if ((value === undefined || value === '') && column.defaultValue !== undefined) {
        console.log(`ℹ️ Using default for '${column.key}':`, column.defaultValue);
        value = column.defaultValue;
      }
      
      row.push(value);
    });
    
    // Add any additional fields that weren't in our mapping
    const mappedKeys = columnMapping.flatMap(col => [col.key, ...(col.aliases || [])].map(k => k.toLowerCase()));
    const additionalFields = Object.entries(lead)
      .filter(([key]) => !mappedKeys.includes(key.toLowerCase()))
      .reduce((obj, [key, value]) => (obj[key] = value, obj), {});
    
    if (Object.keys(additionalFields).length > 0) {
      console.log('📝 Additional fields:', additionalFields);
      // Append additional fields to the row
      Object.values(additionalFields).forEach(value => {
        row.push(value);
      });
    }
    
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