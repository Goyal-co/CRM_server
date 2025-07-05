// Google Apps Script for MCUBE Callback and Lead Management
// Deploy as a web app to receive POST requests from MCUBE

// Helper function to add CORS headers to responses
function addCorsHeaders(response) {
  return response
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
    .setHeader('Access-Control-Allow-Credentials', 'true');
}

function doPost(e) {
  try {
    // Parse the incoming data from MCUBE
    const data = JSON.parse(e.postData.contents);
    
    // Extract all MCUBE callback parameters
    const {
      callid,
      executive,
      customer,
      starttime,
      endtime,
      status,
      callType,
      pulse,
      duration,
      answeredtime,
      filename,
      refid
    } = data;
    
    console.log('MCUBE Callback received:', {
      callid,
      status,
      filename,
      refid
    });

    // Update the lead in the main leads sheet with recording information
    if (refid) {
      updateLeadWithRecording(refid, filename, status, callid);
    }
    
    // Also log to call logs sheet for detailed tracking
    logToCallLogSheet(data);
    
    // Return success response to MCUBE
    return addCorsHeaders(ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Callback processed successfully' }))
      .setMimeType(ContentService.MimeType.JSON));
      
  } catch (error) {
    console.error('Error processing MCUBE callback:', error);
    return addCorsHeaders(ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON));
  }
}

function doGet(e) {
  const action = e.parameter.action;
  
  switch(action) {
    case 'updateLead':
      return updateLead(e.parameter);
    case 'getProjectInfo':
      return getProjectInfo(e.parameter);
    case 'getManualLeads':
      return getManualLeads(e.parameter);
    case 'addManualLead':
      return addManualLead(e.parameter);
    case 'getUserTasks':
      return getUserTasks(e.parameter);
    case 'addUserTask':
      return addUserTask(e.parameter);
    case 'markTaskDone':
      return markTaskDone(e.parameter);
    case 'getStatus':
      return getStatus(e.parameter);
    case 'updateStatus':
      return updateStatus(e.parameter);
    case 'getTeamStatus':
      return getTeamStatus();
    case 'updateTeamStatus':
      return updateTeamStatus(e.parameter);
    case 'getPerformance':
      return getPerformance(e.parameter);
    case 'updateLeadWithRecording':
      return updateLeadWithRecording(e.parameter.leadId, e.parameter.recordingUrl, e.parameter.status, e.parameter.callId);
    case 'getAllLeads':
      return getAllLeads();
    default:
      return addCorsHeaders(ContentService
        .createTextOutput(JSON.stringify({ error: 'Invalid action' }))
        .setMimeType(ContentService.MimeType.JSON));
  }
}

function updateLeadWithRecording(leadId, recordingUrl, status, callId) {
  try {
    const spreadsheet = SpreadsheetApp.openById('1KJB-28QU21Hg-IuavmkzdedxC8ycdguAgageFzYYfDo');
    const sheet = spreadsheet.getSheetByName('Leads');
    
    if (!sheet) {
      throw new Error('Leads sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find the Lead ID column (column A)
    const leadIdCol = 0; // Column A
    const recordingsCol = headers.indexOf('Recordings');
    
    // If Recordings column doesn't exist, add it
    if (recordingsCol === -1) {
      sheet.getRange(1, headers.length + 1).setValue('Recordings');
      sheet.getRange(1, headers.length + 1).setFontWeight('bold');
      sheet.getRange(1, headers.length + 1).setBackground('#4285f4');
      sheet.getRange(1, headers.length + 1).setFontColor('white');
    }
    
    // Find the row with the lead ID
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][leadIdCol] === leadId) {
        rowIndex = i + 1; // +1 because sheet rows are 1-indexed
        break;
      }
    }
    
    if (rowIndex === -1) {
      console.log(`Lead ID ${leadId} not found in sheet`);
      return addCorsHeaders(ContentService
        .createTextOutput(JSON.stringify({ success: false, error: 'Lead not found' }))
        .setMimeType(ContentService.MimeType.JSON));
    }
    
    // Update the recordings column
    const finalRecordingsCol = recordingsCol === -1 ? headers.length + 1 : recordingsCol + 1;
    const recordingInfo = {
      url: recordingUrl || '',
      status: status || '',
      callId: callId || '',
      timestamp: new Date().toISOString()
    };
    
    sheet.getRange(rowIndex, finalRecordingsCol).setValue(JSON.stringify(recordingInfo));
    
    // Also update the "Called" column if it exists
    const calledCol = headers.indexOf('Called');
    if (calledCol !== -1) {
      sheet.getRange(rowIndex, calledCol + 1).setValue('Yes');
    }
    
    // Update "Feedback 1" column with call status
    const feedbackCol = headers.indexOf('Feedback 1');
    if (feedbackCol !== -1) {
      const currentFeedback = sheet.getRange(rowIndex, feedbackCol + 1).getValue();
      const newFeedback = `Call Status: ${status || 'Unknown'} | Call ID: ${callId || 'N/A'}`;
      sheet.getRange(rowIndex, feedbackCol + 1).setValue(newFeedback);
    }
    
    console.log(`Updated lead ${leadId} with recording info`);
    
    return addCorsHeaders(ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Lead updated with recording info' }))
      .setMimeType(ContentService.MimeType.JSON));
      
  } catch (error) {
    console.error('Error updating lead with recording:', error);
    return addCorsHeaders(ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON));
  }
}

function logToCallLogSheet(data) {
  try {
    const {
      callid,
      executive,
      customer,
      starttime,
      endtime,
      status,
      callType,
      pulse,
      duration,
      answeredtime,
      filename,
      refid
    } = data;
    
    // Get the call logs spreadsheet (create if doesn't exist)
    const spreadsheet = getOrCreateCallLogSheet();
    const sheet = spreadsheet.getActiveSheet();
    
    // Prepare row data
    const rowData = [
      new Date(), // Timestamp when callback received
      callid,
      executive,
      customer,
      starttime,
      endtime,
      status,
      callType,
      pulse,
      duration,
      answeredtime,
      filename, // Recording URL
      refid,
      'Pending', // Analysis Status
      '', // Analysis Results
      '', // Notes
      getRecordingDownloadStatus(filename) // Recording Download Status
    ];
    
    // Add the row to the sheet
    sheet.appendRow(rowData);
    
    console.log('Call logged to call logs sheet');
    
  } catch (error) {
    console.error('Error logging to call log sheet:', error);
  }
}

function getOrCreateCallLogSheet() {
  const spreadsheetName = 'MCUBE Call Logs';
  
  try {
    // Try to find existing spreadsheet
    const files = DriveApp.getFilesByName(spreadsheetName);
    if (files.hasNext()) {
      return SpreadsheetApp.open(files.next());
    }
  } catch (error) {
    console.log('No existing spreadsheet found, creating new one');
  }
  
  // Create new spreadsheet
  const spreadsheet = SpreadsheetApp.create(spreadsheetName);
  const sheet = spreadsheet.getActiveSheet();
  
  // Set up headers
  const headers = [
    'Callback Received',
    'Call ID',
    'Executive',
    'Customer',
    'Start Time',
    'End Time',
    'Status',
    'Call Type',
    'Pulse (minutes)',
    'Duration (seconds)',
    'Answered Time (seconds)',
    'Recording URL',
    'Reference ID',
    'Analysis Status',
    'Analysis Results',
    'Notes',
    'Recording Download Status'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format headers
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('white');
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);
  
  return spreadsheet;
}

function getRecordingDownloadStatus(filename) {
  if (!filename) return 'No Recording';
  
  try {
    // Try to access the recording URL to check if it's available
    const response = UrlFetchApp.fetch(filename, { method: 'HEAD' });
    if (response.getResponseCode() === 200) {
      return 'Available';
    } else {
      return 'Not Accessible';
    }
  } catch (error) {
    return 'Error Checking';
  }
}

// Function to manually trigger recording download (can be called from your backend)
function downloadRecording(callId, recordingUrl) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    // Find the row with the call ID
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === callId) { // Call ID is in column B (index 1)
        rowIndex = i + 1; // +1 because sheet rows are 1-indexed
        break;
      }
    }
    
    if (rowIndex === -1) {
      throw new Error('Call ID not found in sheet');
    }
    
    // Download the recording
    const response = UrlFetchApp.fetch(recordingUrl);
    const blob = response.getBlob();
    
    // Create a folder for recordings if it doesn't exist
    const folderName = 'MCUBE Recordings';
    let folder;
    try {
      const folders = DriveApp.getFoldersByName(folderName);
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = DriveApp.createFolder(folderName);
      }
    } catch (error) {
      folder = DriveApp.createFolder(folderName);
    }
    
    // Save the recording to Google Drive
    const file = folder.createFile(blob);
    file.setName(`${callId}.wav`);
    
    // Update the sheet with the Google Drive file ID
    sheet.getRange(rowIndex, 18).setValue(file.getId()); // Column R for Google Drive File ID
    sheet.getRange(rowIndex, 17).setValue('Downloaded to Drive'); // Column Q for Download Status
    
    return {
      success: true,
      fileId: file.getId(),
      fileUrl: file.getUrl()
    };
    
  } catch (error) {
    console.error('Error downloading recording:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// Function to trigger AI analysis (can be called from your backend)
function triggerAnalysis(callId) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    // Find the row with the call ID
    let rowIndex = -1;
    let rowData = null;
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === callId) {
        rowIndex = i + 1;
        rowData = data[i];
        break;
      }
    }
    
    if (rowIndex === -1) {
      throw new Error('Call ID not found in sheet');
    }
    
    // Update analysis status
    sheet.getRange(rowIndex, 14).setValue('Processing'); // Column N for Analysis Status
    
    // Here you would call your AI analysis service
    // For now, we'll just mark it as completed
    sheet.getRange(rowIndex, 14).setValue('Completed');
    sheet.getRange(rowIndex, 15).setValue('Analysis completed for call: ' + callId);
    
    return {
      success: true,
      message: 'Analysis triggered successfully'
    };
    
  } catch (error) {
    console.error('Error triggering analysis:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// Existing functions for lead management
function updateLead(params) {
  try {
    const spreadsheet = SpreadsheetApp.openById('1KJB-28QU21Hg-IuavmkzdedxC8ycdguAgageFzYYfDo');
    const sheet = spreadsheet.getSheetByName('Leads');
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const leadIdCol = headers.indexOf('Lead ID');
    const calledCol = headers.indexOf('Called');
    const feedbackCol = headers.indexOf('Feedback 1');
    
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][leadIdCol] === params.leadId) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) {
      return addCorsHeaders(ContentService
        .createTextOutput(JSON.stringify({ error: 'Lead not found' }))
        .setMimeType(ContentService.MimeType.JSON));
    }
    
    if (calledCol !== -1) {
      sheet.getRange(rowIndex, calledCol + 1).setValue(params.called);
    }
    
    if (feedbackCol !== -1) {
      sheet.getRange(rowIndex, feedbackCol + 1).setValue(params.feedback1);
    }
    
    return addCorsHeaders(ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON));
      
  } catch (error) {
    return addCorsHeaders(ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON));
  }
}

function getProjectInfo(params) {
  try {
    const spreadsheet = SpreadsheetApp.openById('1KJB-28QU21Hg-IuavmkzdedxC8ycdguAgageFzYYfDo');
    const sheet = spreadsheet.getSheetByName('Leads');
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const projectCol = headers.indexOf('Project');
    const leadIdCol = headers.indexOf('Lead ID');
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][leadIdCol] === params.project) {
        const result = {};
        headers.forEach((header, index) => {
          result[header] = data[i][index];
        });
        return addCorsHeaders(ContentService
          .createTextOutput(JSON.stringify(result))
          .setMimeType(ContentService.MimeType.JSON));
      }
    }
    
    return addCorsHeaders(ContentService
      .createTextOutput(JSON.stringify({ error: 'Project not found' }))
      .setMimeType(ContentService.MimeType.JSON));
      
  } catch (error) {
    return addCorsHeaders(ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON));
  }
}

function getManualLeads(params) {
  try {
    const spreadsheet = SpreadsheetApp.openById('1KJB-28QU21Hg-IuavmkzdedxC8ycdguAgageFzYYfDo');
    const sheet = spreadsheet.getSheetByName('Leads');
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const emailCol = headers.indexOf('Email');
    const result = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][emailCol] === params.email) {
        const lead = {};
        headers.forEach((header, index) => {
          lead[header] = data[i][index];
        });
        result.push(lead);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function addManualLead(params) {
  try {
    const spreadsheet = SpreadsheetApp.openById('1KJB-28QU21Hg-IuavmkzdedxC8ycdguAgageFzYYfDo');
    const sheet = spreadsheet.getSheetByName('Leads');
    
    const values = [
      [
        params.leadId,
        params.project,
        'Manual',
        params.name,
        params.email,
        params.phone,
        params.lookingFor,
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
      ]
    ];
    
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, values[0].length).setValues(values);
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getUserTasks(params) {
  try {
    const spreadsheet = SpreadsheetApp.openById('1KJB-28QU21Hg-IuavmkzdedxC8ycdguAgageFzYYfDo');
    const sheet = spreadsheet.getSheetByName('Tasks');
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const emailCol = headers.indexOf('Email');
    const taskCol = headers.indexOf('Task');
    const doneCol = headers.indexOf('Done');
    
    const result = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][emailCol] === params.email && data[i][doneCol] !== 'Yes') {
        result.push(data[i][taskCol]);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function addUserTask(params) {
  try {
    const spreadsheet = SpreadsheetApp.openById('1KJB-28QU21Hg-IuavmkzdedxC8ycdguAgageFzYYfDo');
    let sheet = spreadsheet.getSheetByName('Tasks');
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet('Tasks');
      sheet.getRange(1, 1, 1, 3).setValues([['Email', 'Task', 'Done']]);
    }
    
    const values = [[params.email, params.task, 'No']];
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, 3).setValues(values);
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function markTaskDone(params) {
  try {
    const spreadsheet = SpreadsheetApp.openById('1KJB-28QU21Hg-IuavmkzdedxC8ycdguAgageFzYYfDo');
    const sheet = spreadsheet.getSheetByName('Tasks');
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const emailCol = headers.indexOf('Email');
    const taskCol = headers.indexOf('Task');
    const doneCol = headers.indexOf('Done');
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][emailCol] === params.email && data[i][taskCol] === params.task) {
        sheet.getRange(i + 1, doneCol + 1).setValue('Yes');
        break;
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getStatus(params) {
  try {
    const spreadsheet = SpreadsheetApp.openById('1KJB-28QU21Hg-IuavmkzdedxC8ycdguAgageFzYYfDo');
    const sheet = spreadsheet.getSheetByName('Status');
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'active', breakMinutes: 0 }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const emailCol = headers.indexOf('Email');
    const statusCol = headers.indexOf('Status');
    const breakCol = headers.indexOf('Break Minutes');
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][emailCol] === params.email) {
        return ContentService
          .createTextOutput(JSON.stringify({
            status: data[i][statusCol] || 'active',
            breakMinutes: data[i][breakCol] || 0
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'active', breakMinutes: 0 }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function updateStatus(params) {
  try {
    const spreadsheet = SpreadsheetApp.openById('1KJB-28QU21Hg-IuavmkzdedxC8ycdguAgageFzYYfDo');
    let sheet = spreadsheet.getSheetByName('Status');
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet('Status');
      sheet.getRange(1, 1, 1, 3).setValues([['Email', 'Status', 'Break Minutes']]);
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const emailCol = headers.indexOf('Email');
    const statusCol = headers.indexOf('Status');
    const breakCol = headers.indexOf('Break Minutes');
    
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][emailCol] === params.email) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) {
      sheet.getRange(sheet.getLastRow() + 1, 1, 1, 3).setValues([[params.email, params.status, 0]]);
    } else {
      sheet.getRange(rowIndex, statusCol + 1).setValue(params.status);
      if (params.status === 'break') {
        sheet.getRange(rowIndex, breakCol + 1).setValue(0);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getTeamStatus() {
  try {
    const spreadsheet = SpreadsheetApp.openById('1KJB-28QU21Hg-IuavmkzdedxC8ycdguAgageFzYYfDo');
    const sheet = spreadsheet.getSheetByName('Status');
    
    if (!sheet) {
      return addCorsHeaders(ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON));
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const result = [];
    for (let i = 1; i < data.length; i++) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = data[i][index];
      });
      result.push(row);
    }
    
    return addCorsHeaders(ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON));
      
  } catch (error) {
    return addCorsHeaders(ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON));
  }
}

function updateTeamStatus(params) {
  try {
    const spreadsheet = SpreadsheetApp.openById('1KJB-28QU21Hg-IuavmkzdedxC8ycdguAgageFzYYfDo');
    const sheet = spreadsheet.getSheetByName('Status');
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const emailCol = headers.indexOf('Email');
    const statusCol = headers.indexOf('Status');
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][emailCol] === params.email) {
        sheet.getRange(i + 1, statusCol + 1).setValue(params.status);
        break;
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getPerformance(params) {
  try {
    const spreadsheet = SpreadsheetApp.openById('1KJB-28QU21Hg-IuavmkzdedxC8ycdguAgageFzYYfDo');
    const sheet = spreadsheet.getSheetByName('Leads');
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const emailCol = headers.indexOf('Email');
    const calledCol = headers.indexOf('Called');
    const siteVisitCol = headers.indexOf('Site Visit?');
    const bookedCol = headers.indexOf('Booked?');
    
    let totalCalls = 0;
    let siteVisits = 0;
    let bookings = 0;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][emailCol] === params.email) {
        if (data[i][calledCol] === 'Yes') totalCalls++;
        if (data[i][siteVisitCol] === 'Yes') siteVisits++;
        if (data[i][bookedCol] === 'Yes') bookings++;
      }
    }
    
    return addCorsHeaders(ContentService
      .createTextOutput(JSON.stringify({
        totalCalls,
        delays: 0, // Would need to be calculated from call logs
        siteVisits,
        bookings,
        breakMinutes: 0, // Would need to be calculated from status sheet
        score: Math.round((siteVisits + bookings) / Math.max(totalCalls, 1) * 100)
      }))
      .setMimeType(ContentService.MimeType.JSON));
      
  } catch (error) {
    return addCorsHeaders(ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON));
  }
}

function getAllLeads() {
  try {
    const spreadsheet = SpreadsheetApp.openById('1KJB-28QU21Hg-IuavmkzdedxC8ycdguAgageFzYYfDo');
    const sheet = spreadsheet.getSheetByName('Leads');
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const result = [];
    for (let i = 1; i < data.length; i++) {
      const lead = {};
      headers.forEach((header, index) => {
        lead[header] = data[i][index];
      });
      result.push(lead);
    }
    
    return addCorsHeaders(ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON));
      
  } catch (error) {
    return addCorsHeaders(ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON));
  }
} 