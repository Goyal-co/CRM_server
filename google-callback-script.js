// Google Apps Script for MCUBE Callback
// Deploy as a web app to receive POST requests from MCUBE

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
    
    // Get the active spreadsheet (create if doesn't exist)
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
    
    // Log the callback
    console.log('MCUBE Callback received:', {
      callid,
      status,
      filename,
      refid
    });
    
    // Return success response to MCUBE
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Callback processed successfully' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error processing MCUBE callback:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
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