# 📞 Call System Guide (Without ngrok)

## Overview
This guide explains how to use the CRM call system without requiring ngrok or a public server deployment.

## ✅ What Works Without ngrok

### 1. **Call Triggering**
- ✅ Initiate calls through MCUBE API
- ✅ Your phone will ring when calls are triggered
- ✅ Call logs are created in the system

### 2. **Manual Status Updates**
- ✅ Update call status manually after completing calls
- ✅ Add notes and feedback for each call
- ✅ Lead status is updated in Google Sheets

## ❌ What Doesn't Work Without ngrok

### 1. **Automatic Callbacks**
- ❌ MCUBE cannot send call status automatically
- ❌ Call recordings are not automatically downloaded
- ❌ AI analysis is not triggered automatically

### 2. **Real-time Updates**
- ❌ No automatic status updates during calls
- ❌ No call duration tracking
- ❌ No automatic lead status updates

## 🚀 How to Use

### Step 1: Start the Server
```bash
cd crm-backend1
node server.js
```

### Step 2: Test the System
1. Open `test-call-system.html` in your browser
2. Click "Check Server" to verify the backend is running
3. Test call triggering with sample numbers
4. Test manual status updates

### Step 3: Use in CRM Dashboard
1. Navigate to the Leads page in your CRM dashboard
2. Click "Call Now" on any lead
3. Your phone will ring (if MCUBE is configured correctly)
4. After completing the call, you'll be prompted to update the status manually

## 📋 Manual Call Status Update Process

### When You Complete a Call:
1. **5 seconds after call initiation**, you'll see a prompt asking if you want to update the call status
2. **Click "OK"** to update the status manually
3. **Enter the call status** (e.g., "Connected", "Not Answered", "Busy", "Wrong Number")
4. **Add optional notes** about the call
5. **The system will update** the lead status in Google Sheets

### Available Status Options:
- `Connected` - Call was successful
- `Not Answered` - Customer didn't pick up
- `Busy` - Customer's phone was busy
- `Wrong Number` - Invalid phone number
- `Not Interested` - Customer declined
- `Call Back Later` - Customer asked to call later
- `Site Visit Scheduled` - Customer agreed to visit
- `Booking Confirmed` - Customer made a booking

## 🔧 Configuration

### Required Environment Variables:
```env
MONGO_URI=your_mongodb_connection_string
MCUBE_API_KEY=your_mcube_api_key
```

### Optional Environment Variables:
```env
MCUBE_CALLBACK_URL=http://localhost:5000/api/mcube-callback
GOOGLE_SCRIPT_URL=your_google_apps_script_url
```

## 🧪 Testing

### Test File: `test-call-system.html`
This file provides a simple interface to test:
- Call triggering
- Manual status updates
- Server connectivity

### Test Commands:
```powershell
# Test call trigger
Invoke-WebRequest -Uri "http://localhost:5000/api/trigger-call?agent=%2B919014600977&customer=%2B919876543210&leadId=test123" -Method GET

# Test status update
Invoke-WebRequest -Uri "http://localhost:5000/api/update-call-status" -Method POST -ContentType "application/json" -Body '{"leadId":"test123","status":"Connected","notes":"Test call"}'
```

## 📊 API Endpoints

### 1. Trigger Call
```
GET /api/trigger-call?agent={agent_number}&customer={customer_number}&leadId={lead_id}
```

### 2. Manual Status Update
```
POST /api/update-call-status
Content-Type: application/json

{
  "leadId": "lead_id",
  "status": "call_status",
  "notes": "optional_notes"
}
```

### 3. Callback (Only works with public URL)
```
POST /api/mcube-callback
```

## 🚨 Troubleshooting

### Call Not Triggering:
1. Check if server is running on port 5000
2. Verify MCUBE_API_KEY is correct
3. Ensure phone numbers are in correct format (+91...)
4. Check browser console for errors

### Status Update Failing:
1. Verify lead ID exists in Google Sheets
2. Check Google Apps Script URL is correct
3. Ensure server is running

### Phone Not Ringing:
1. Verify MCUBE account is active
2. Check if agent number is registered with MCUBE
3. Contact MCUBE support if issues persist

## 🔄 Migration to Production

When you're ready to deploy to production:

1. **Deploy backend** to a public server (AWS, Heroku, etc.)
2. **Set MCUBE_CALLBACK_URL** to your public server URL
3. **Enable automatic callbacks** by uncommenting callback URL in MCUBE routes
4. **Test full functionality** including automatic status updates

## 📞 Support

For issues with:
- **MCUBE API**: Contact MCUBE support
- **Backend/CRM**: Check server logs and browser console
- **Google Sheets**: Verify Apps Script permissions

---

**Note**: This setup allows you to use the call system for development and testing without requiring ngrok or public deployment. For production use with full functionality, deploy to a public server. 