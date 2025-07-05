# Google Sheets Integration Setup Guide

## 🎯 Overview
This guide will help you set up a new Google Sheet and Google Cloud service account for your CRM webhook integration.

## 📋 Step-by-Step Instructions

### Step 1: Create a New Google Sheet

1. **Go to Google Sheets**: Visit [sheets.google.com](https://sheets.google.com)
2. **Create New Sheet**: Click the "+" button to create a new spreadsheet
3. **Name Your Sheet**: Give it a meaningful name like "CRM Leads" or "Facebook Leads"
4. **Set Up Headers**: In the first row (Row 1), add these exact headers:

```
A1: leadId
B1: project
C1: source
D1: name
E1: email
F1: phone
G1: city
H1: message
I1: created_time
J1: formId
K1: pageId
```

5. **Copy Sheet ID**: From the URL, copy the sheet ID (the long string between `/d/` and `/edit`)
   - Example: `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit`
   - Sheet ID: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

### Step 2: Set Up Google Cloud Project

1. **Go to Google Cloud Console**: Visit [console.cloud.google.com](https://console.cloud.google.com)
2. **Create New Project**: 
   - Click on the project dropdown (top left)
   - Click "New Project"
   - Name: `CRM Webhook Integration`
   - Click "Create"

3. **Enable APIs**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Sheets API" and enable it
   - Search for "Google Drive API" and enable it

### Step 3: Create Service Account

1. **Go to Credentials**: 
   - "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "Service Account"

2. **Fill Service Account Details**:
   - Service account name: `crm-webhook-service`
   - Description: `Service account for CRM webhook integration`
   - Click "Create and Continue"

3. **Skip Role Assignment**: Click "Continue" (we'll handle permissions manually)

4. **Finish**: Click "Done"

### Step 4: Generate JSON Key

1. **Find Your Service Account**: In the credentials page, click on your service account
2. **Go to Keys Tab**: Click the "Keys" tab
3. **Add Key**: 
   - Click "Add Key" → "Create new key"
   - Select "JSON" format
   - Click "Create"
4. **Download**: The JSON file will download automatically

### Step 5: Share Google Sheet

1. **Open Your Google Sheet**
2. **Share Settings**: Click the "Share" button (top right)
3. **Add Service Account**: 
   - Add the email from your JSON file (looks like `crm-webhook-service@project-id.iam.gserviceaccount.com`)
   - Give it "Editor" access
   - Click "Send" (you can uncheck "Notify people")

### Step 6: Set Environment Variables

1. **Open your JSON key file** and copy the entire content
2. **In Render Dashboard**:
   - Go to your app settings
   - Add environment variable: `GOOGLE_SERVICE_ACCOUNT`
   - Value: Paste the entire JSON content (as a single line)

3. **Add Spreadsheet ID**:
   - Environment variable: `GOOGLE_SPREADSHEET_ID`
   - Value: Your sheet ID (e.g., `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`)

### Step 7: Update Your Code

1. **Update the webhook** to use the new service:
   ```javascript
   import { appendLeadToSheet } from './services/googleSheetsService.js';
   
   // Replace the old appendLeadToSheetSimple function with:
   const success = await appendLeadToSheet(lead, process.env.GOOGLE_SPREADSHEET_ID);
   ```

2. **Test the setup**:
   ```bash
   node setup-google-sheets.js
   ```

## 🧪 Testing

### Test 1: Setup Script
```bash
node setup-google-sheets.js
```

### Test 2: Webhook Test
```bash
node test-render.js
```

### Test 3: Manual Curl Test
```bash
curl -X POST https://pratham-server.onrender.com/api/test-webhook \
  -H "Content-Type: application/json" \
  -d '{"leadId":"TEST-123","name":"Test User","email":"test@example.com"}'
```

## 🔧 Troubleshooting

### Common Issues:

1. **"Service account not found"**
   - Check that the service account email is correct
   - Ensure the sheet is shared with the service account

2. **"Permission denied"**
   - Make sure the service account has "Editor" access to the sheet
   - Check that the Google Sheets API is enabled

3. **"Invalid spreadsheet ID"**
   - Verify the sheet ID from the URL
   - Make sure the sheet exists and is accessible

4. **"Environment variable not set"**
   - Check that `GOOGLE_SERVICE_ACCOUNT` is set in Render
   - Ensure the JSON is properly formatted

## 📞 Support

If you encounter issues:
1. Check the console logs in Render
2. Verify all environment variables are set
3. Test the connection using the setup script
4. Ensure the Google Sheet has the correct headers

## 🎉 Success Indicators

- ✅ Setup script runs without errors
- ✅ Test lead appears in your Google Sheet
- ✅ Webhook responds with 200 status
- ✅ No errors in Render logs 