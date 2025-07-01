# 📞 Call Recording System Guide

## Overview

The call recording system now stores MCUBE callback responses directly in the Google Sheet used for leads management. This provides a centralized location for all call data and recording links.

## How It Works

### 1. MCUBE Callback Flow
- When a call is made via MCUBE API, the callback URL is set to the Google Apps Script
- MCUBE sends POST requests to the Google Apps Script with call details including recording URLs
- The script automatically adds a "Recordings" column to the leads sheet if it doesn't exist
- Call data is stored in JSON format in the Recordings column

### 2. Google Apps Script Functions

#### `doPost(e)` - MCUBE Callback Handler
- Receives MCUBE callback data via POST
- Updates the lead in the main sheet with recording information
- Also logs to a separate "MCUBE Call Logs" sheet for detailed tracking

#### `updateLeadWithRecording(leadId, recordingUrl, status, callId)`
- Updates a specific lead with recording information
- Stores data in JSON format: `{"url": "...", "status": "...", "callId": "...", "timestamp": "..."}`
- Updates "Called" column to "Yes"
- Updates "Feedback 1" column with call status

#### `getAllLeads()`
- Returns all leads from the sheet
- Used by the frontend to display recordings

### 3. Frontend Integration

#### CallRecordingsPanel Component
- Displays all leads that have recordings
- Shows call details, status, and recording URLs
- Provides buttons to play or download recordings
- Accessible at `/admin/recordings` (admin only)

## Data Structure

### Recordings Column Format
```json
{
  "url": "https://mcube.vmc.in/recordings/recording-123.wav",
  "status": "Call complete",
  "callId": "CALL123456",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### MCUBE Callback Parameters
- `callid`: Unique call identifier
- `executive`: Agent phone number
- `customer`: Customer phone number
- `starttime`: Call start time
- `endtime`: Call end time
- `status`: Call status (Call complete, Customer Busy, etc.)
- `duration`: Call duration in seconds
- `answeredtime`: Time to answer in seconds
- `filename`: Recording URL
- `refid`: Lead ID (used to match with lead in sheet)

## Setup Instructions

### 1. Deploy Google Apps Script
1. Copy the code from `google-callback-script.js`
2. Create a new Google Apps Script project
3. Paste the code and save
4. Deploy as a web app (Execute as: Me, Who has access: Anyone)
5. Copy the deployment URL

### 2. Update MCUBE API Call
The MCUBE API call now includes the Google Apps Script URL as the callback:

```javascript
const googleScriptUrl = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
const apiUrl = `https://mcube.vmc.in/api/outboundcall?apikey=${MCUBE_API_KEY}&exenumber=${agentNumber}&custnumber=${customerNumber}&callbackurl=${encodeURIComponent(googleScriptUrl)}`;
```

### 3. Test the System
Use the test file `test-google-script.html` to:
- Test MCUBE callback simulation
- Test lead update with recording data
- Verify Google Apps Script functionality

## Features

### ✅ Automatic Recording Storage
- MCUBE callbacks automatically update the leads sheet
- Recording URLs are stored with call metadata
- No manual intervention required

### ✅ Easy Access
- All recordings are visible in the admin panel
- Direct links to play recordings
- Download functionality for local storage

### ✅ Call Tracking
- Complete call history in the leads sheet
- Status tracking and feedback integration
- Timestamp and duration information

### ✅ Manual Updates
- Manual call status updates also work
- Recording information can be added manually if needed
- Flexible for different use cases

## Troubleshooting

### Recording URLs Not Appearing
1. Check if MCUBE is sending callbacks to the Google Apps Script
2. Verify the Google Apps Script URL is correct in the MCUBE API call
3. Check Google Apps Script logs for errors

### Google Apps Script Errors
1. Ensure the script has permission to access the Google Sheet
2. Check that the spreadsheet ID is correct
3. Verify the sheet name matches exactly

### Frontend Issues
1. Check browser console for API errors
2. Verify the Google Apps Script URL is accessible
3. Ensure admin permissions for accessing recordings

## Benefits

1. **Centralized Data**: All call information in one place
2. **Easy Access**: No need for separate recording management
3. **Automatic Updates**: Real-time callback processing
4. **Flexible**: Works with existing lead management system
5. **Cost Effective**: Uses existing Google Sheets infrastructure

## Future Enhancements

- AI analysis integration for call recordings
- Automatic transcription services
- Call quality scoring
- Integration with CRM workflows
- Advanced filtering and search capabilities 