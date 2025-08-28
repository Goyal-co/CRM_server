import express from 'express';
import axios from 'axios';
import { appendLeadToSheet } from '../services/googleSheetsService.js';

const router = express.Router();

const VERIFY_TOKEN = 'goyalco_verify';
const PAGE_ACCESS_TOKEN = 'EAATT84b6A0MBPU8UxXAKMHauyhK17X9tUINdjaNqg9N9WCs7vMWlVUwjxmtb8bVmPbQ2KTw8vFhroQB0vQIrLAmZB6ubxSau7PNGemgCwGhauUIqFnD9kz2e9Nl0QIVm262ju85jC0nVJqOIwTtJcp2WuVXY9DsCteUu9ZCAo5erE0Cc66php2n8JRWH80csbBQCgs';

// Google Sheets API integration using service account
async function appendLeadToSheetSimple(lead) {
  try {
    const spreadsheetId = '1KJB-28QU21Hg-IuavmkzdedxC8ycdguAgageFzYYfDo';
    const success = await appendLeadToSheet(mapLeadToSheetColumns(lead), spreadsheetId);
    
    if (success) {
      console.log('✅ Lead added to Google Sheet via API');
      return true;
    } else {
      console.error('❌ Google Sheets API error');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to send to Google Sheets:', error.message);
    return false;
  }
}

// Helper to normalize project names across all sources
function normalizeProjectName(projectName) {
  if (!projectName) return '';
  
  // Remove extra spaces and trim
  let normalized = projectName.trim();
  
  // Convert to title case (first letter of each word capitalized)
  normalized = normalized.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  
  // Handle specific project name mappings
  const projectMappings = {
    'RIVIERA UNO': 'Riviera Uno',
    'Riviera Uno ': 'Riviera Uno', // Remove extra space
    'ORCHID SALISBURY': 'Orchid Salisbury',
    'ORCHID PLATINUM': 'Orchid Platinum',
    'ORCHID LIFE': 'Orchid Life',
    'ORCHID BLOOMSBERRY': 'Orchid Bloomsberry'
  };
  
  return projectMappings[normalized] || normalized;
}

// Helper to map all columns for Google Sheet with proper column order
function mapLeadToSheetColumns(lead) {
  return {
    'Lead ID': lead.leadId || `LEAD-${Date.now()}`,
    'Project': normalizeProjectName(lead.project) || 'Not Specified',
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
}

// Webhook verification endpoint
router.get('/fb-webhook', (req, res) => {
  // Parse the query params
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Respond with 200 OK and challenge token from the request
      console.log('✅ Webhook verified successfully');
      return res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      console.error('❌ Verification failed. Tokens do not match.');
      return res.sendStatus(403);
    }
  } else {
    console.error('❌ Missing verify token or mode');
    return res.sendStatus(400);
  }
});

// Webhook POST endpoint
router.post('/fb-webhook', async (req, res) => {
  try {
    console.log('📨 Webhook POST hit');
    console.log('📦 Raw Body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 Raw form ID from webhook (raw):', req.body?.entry?.[0]?.changes?.[0]?.value?.form_id);
    console.log('🔍 Raw form ID type:', typeof req.body?.entry?.[0]?.changes?.[0]?.value?.form_id);
    console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
    console.log('🔍 Body type:', typeof req.body);
    console.log('🔍 Body keys:', Object.keys(req.body || {}));

    let leadsAdded = 0;
    
    // Handle different webhook formats
    if (req.body.entry && Array.isArray(req.body.entry)) {
      // Facebook leadgen webhook format
      console.log('📥 Processing Facebook leadgen webhook format');
      for (const entry of req.body.entry) {
        for (const change of entry.changes || []) {
          if (change.field === 'leadgen') {
            const leadId = change.value.leadgen_id;
            const formId = change.value.form_id;
            const pageId = change.value.page_id;

            console.log('🔍 Form ID from webhook:', formId);
            console.log('🔍 Known project mappings:', JSON.stringify({
              '2394313481022296': 'Orchid Salisbury',
              '1672153646791838': 'Orchid Platinum',
              '2808675605994341': 'Orchid Bloomsberry',
              '756944660385195': 'Orchid Life',
              '775382491742653': 'Riviera Uno'
            }, null, 2));

            console.log('📥 New Lead ID:', leadId);
            console.log('📝 Form ID:', formId);
            console.log('📄 Page ID:', pageId);

            // Fix the project mapping (remove extra space)
            const getProjectName = (formId) => {
              // Convert formId to string to ensure consistent type comparison
              const formIdStr = String(formId).trim();
              
              const projectMap = {
                '2394313481022296': 'Orchid Salisbury',
                '1672153646791838': 'Orchid Platinum',
                '2808675605994341': 'Orchid Bloomsberry',
                '756944660385195': 'Orchid Life',
                '775382491742653': 'Riviera Uno',
                // Add new form ID mappings here as needed
                // Format: 'FORM_ID': 'Project Name'
              };
              
              // Debug: Check for direct match and partial matches
              const debugInfo = {
                receivedFormId: formId,
                normalizedFormId: formIdStr,
                typeOfFormId: typeof formId,
                availableFormIds: Object.keys(projectMap),
                exactMatch: projectMap[formIdStr] ? 'Yes' : 'No',
                matchedProject: projectMap[formIdStr] || 'None'
              };
              
              // Check for exact match first
              if (projectMap[formIdStr]) {
                console.log('✅ Exact match found for form ID:', debugInfo);
                return projectMap[formIdStr];
              }
              
              // If no exact match, check for partial matches (in case of extra characters)
              const matchedKey = Object.keys(projectMap).find(key => 
                formIdStr.includes(key) || key.includes(formIdStr)
              );
              
              if (matchedKey) {
                console.log('🔍 Partial match found for form ID:', {
                  ...debugInfo,
                  matchedKey,
                  project: projectMap[matchedKey]
                });
                return projectMap[matchedKey];
              }
              
              console.log('❌ No match found for form ID:', debugInfo);
              return 'Facebook Lead Form';
            };

            let lead = {
              leadId,
              project: getProjectName(formId),
              source: 'Facebook',
              formId: formId,
              pageId: pageId,
              created_time: new Date().toISOString(),
            };

            // ✅ Try fetching lead details from FB
            try {
              const response = await axios.get(
                `https://graph.facebook.com/v19.0/${leadId}`,
                {
                  params: {
                    access_token: PAGE_ACCESS_TOKEN,
                    fields: 'field_data,created_time'
                  }
                }
              );
              console.log('✅ Full Lead Data:', JSON.stringify(response.data, null, 2));

              const fields = response.data.field_data;
              if (Array.isArray(fields)) {
                fields.forEach(f => {
                  if (f.name && Array.isArray(f.values)) {
                    const value = f.values[0] || '';
                    const fieldName = f.name.toLowerCase().trim();
                    
                    // Store the raw field value
                    lead[f.name] = value;
                    
                    // Map fields based on common naming patterns
                    const fieldMappings = {
                      // Standard contact info
                      name: ['full name', 'first name', 'name', 'contact name', 'your name'],
                      email: ['email', 'email address', 'e-mail', 'e-mail address'],
                      phone: ['phone', 'mobile', 'phone number', 'mobile number', 'contact number', 'whatsapp'],
                      city: ['city', 'location', 'current city', 'residence city', 'preferred location'],
                      
                      // Project details
                      project: ['project', 'property', 'project name', 'project interested in', 'interested project'],
                      source: ['source', 'lead source', 'how did you hear about us', 'lead origin'],
                      
                      // Lead details
                      size: ['size', 'property size', 'area', 'carpet area', 'built-up area', 'super built-up area'],
                      budget: ['budget', 'price range', 'expected budget', 'investment range', 'affordability'],
                      purpose: ['purpose', 'requirement', 'property purpose', 'end use', 'usage'],
                      priority: ['priority', 'urgency', 'timeline', 'timeframe', 'when to buy'],
                      workLocation: ['work location', 'office location', 'workplace', 'office area', 'job location'],
                      
                      // Additional fields
                      called: ['called', 'contacted', 'follow up done'],
                      callTime: ['call time', 'best time to call', 'preferred call time'],
                      siteVisit: ['site visit', 'property visit', 'schedule visit', 'interested in site visit'],
                      siteVisitDate: ['visit date', 'preferred date', 'date of visit', 'site visit date'],
                      leadQuality: ['lead quality', 'lead score', 'hot/warm/cold', 'lead status'],
                      notes: ['notes', 'comments', 'additional information', 'message', 'requirements']
                    };
                    
                    // Apply field mappings
                    Object.entries(fieldMappings).forEach(([field, patterns]) => {
                      if (!lead[field] && patterns.some(pattern => fieldName.includes(pattern))) {
                        lead[field] = value;
                      }
                    });
                    
                    // Special handling for priority to standardize values
                    if (fieldName.includes('priority') || fieldName.includes('urgency')) {
                      const priorityValue = value.toLowerCase();
                      if (priorityValue.includes('high') || priorityValue.includes('urgent') || priorityValue.includes('immediate')) {
                        lead.priority = 'High';
                      } else if (priorityValue.includes('medium') || priorityValue.includes('moderate')) {
                        lead.priority = 'Medium';
                      } else if (priorityValue.includes('low') || priorityValue.includes('no rush') || priorityValue.includes('casual')) {
                        lead.priority = 'Low';
                      }
                    }
                    
                    // Special handling for budget to standardize format
                    if ((fieldName.includes('budget') || fieldName.includes('price')) && value) {
                      // Remove any non-digit characters and convert to number
                      const numericValue = value.replace(/[^0-9.]/g, '');
                      if (!isNaN(numericValue)) {
                        // Format as currency if it's a valid number
                        lead.budget = new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(numericValue);
                      } else {
                        lead.budget = value; // Keep original if not a number
                      }
                    }
                  }
                });
              }
              
              // Add created_time from Facebook if available
              if (response.data.created_time) {
                lead.created_time = response.data.created_time;
              }
            } catch (err) {
              console.error('❌ Lead fetch failed:', err.message, err.response?.data || '');
            }

            // ✅ Always try to send to Google Sheets via HTTP API
            try {
              const success = await appendLeadToSheetSimple(mapLeadToSheetColumns(lead));
              if (success) {
                leadsAdded++;
                console.log('✅ Lead successfully added to Google Sheet:', lead.leadId);
              }
            } catch (sheetErr) {
              console.error('❌ Failed to append to Google Sheet:', sheetErr.message);
            }
          } else {
            console.log('⚠️ Skipping non-leadgen field:', change?.field);
          }
        }
      }
    } else if (req.body.object === 'page' || req.body.object === 'application') {
      // Handle page webhook verification or other formats
      console.log('📥 Processing page/application webhook format');
      console.log('📋 Webhook object:', req.body.object);
      
      // If it's a test webhook or verification, just respond
      if (req.body.mode === 'test' || req.body.challenge) {
        console.log('✅ Webhook verification/test received');
        res.sendStatus(200);
        return;
      }
      
      // Process any lead data in this format
      if (req.body.entry) {
        for (const entry of req.body.entry) {
          if (entry.messaging || entry.changes) {
            console.log('📥 Processing messaging/changes entry');
            // Add processing logic here if needed
          }
        }
      }
    } else {
      // Handle direct lead data or other formats
      console.log('📥 Processing direct lead data format');
      console.log('📋 Processing body as direct lead data');
      
      // Try to process the body as a direct lead
      if (req.body && typeof req.body === 'object') {
        const lead = {
          leadId: req.body.leadId || req.body.id || `LEAD-${Date.now()}`,
          project: normalizeProjectName(getProjectName(req.body.formId)),
          source: req.body.source || 'Webhook',
          name: req.body.name || req.body.full_name || '',
          email: req.body.email || req.body.email_address || '',
          phone: req.body.phone || req.body.phone_number || '',
          city: req.body.city || req.body.location || '',
          created_time: new Date().toISOString(),
          formId: req.body.formId || '',
          ...req.body // Include all other fields
        };
        
        try {
          const success = await appendLeadToSheetSimple(mapLeadToSheetColumns(lead));
          if (success) {
            leadsAdded++;
            console.log('✅ Direct lead successfully added to Google Sheet:', lead.leadId);
          }
        } catch (sheetErr) {
          console.error('❌ Failed to append direct lead to Google Sheet:', sheetErr.message);
        }
      }
    }

    console.log(`✅ Leads added to sheet: ${leadsAdded}`);
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    console.error('❌ Error stack:', err.stack);
    res.sendStatus(500);
  }
});

// Test endpoint to verify Google Sheets integration
// router.post('/test-webhook', async (req, res) => {
//   try {
//     console.log('🧪 Test webhook hit');
    
//     const testLead = {
//       leadId: `TEST-${Date.now()}`,
//       project: 'Test Project',
//       source: 'Test Webhook',
//       name: 'Test User',
//       email: 'test@example.com',
//       phone: '1234567890',
//       city: 'Test City',
//       message: 'This is a test lead from webhook',
//       created_time: new Date().toISOString(),
//       formId: 'TEST_FORM'
//     };
    
//     try {
//       const success = await appendLeadToSheetSimple(testLead);
//       if (success) {
//         console.log('✅ Test lead added successfully');
        
//         res.json({ 
//           success: true, 
//           message: 'Test lead added to Google Sheet',
//           leadId: testLead.leadId 
//         });
//       } else {
//         res.json({ 
//           success: false, 
//           message: 'Failed to add test lead to Google Sheet',
//           leadId: testLead.leadId 
//         });
//       }
//     } catch (err) {
//       console.error('❌ Test webhook error:', err.message);
//       res.status(500).json({ 
//         success: false, 
//         error: err.message 
//       });
//     }
//   } catch (err) {
//     console.error('❌ Test webhook error:', err.message);
//     res.status(500).json({ 
//       success: false, 
//       error: err.message 
//     });
//   }
// });

export default router;
