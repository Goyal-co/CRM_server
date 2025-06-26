import express from 'express';
import axios from 'axios';

const router = express.Router();

const MCUBE_API_KEY = process.env.MCUBE_API_KEY || '029f2e0cebd3e3473f0b4cbbaebd1ed5';
console.log('Using MCUBE API Key:', MCUBE_API_KEY.substring(0, 6) + '...' + MCUBE_API_KEY.slice(-4));
// For local development without ngrok, we'll use a dummy callback URL
const CALLBACK_URL = process.env.MCUBE_CALLBACK_URL || 'https://pratham-frontend-whah.onrender.com/api/mcube-callback';
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbyWzCFNuv-8Ugr-pzD4VJ08-QJ20RxvENe1bocm2Ya_2A02lrxH_WvmWddKqB_P8Ccm/exec';

// 1️⃣ Trigger MCUBE Call (Works without ngrok)
router.get('/trigger-call', async (req, res) => {
  const { agent, customer, leadId } = req.query;

  if (!agent || !customer || !leadId) {
    return res.status(400).json({ error: 'Missing agent, customer, or leadId' });
  }

  // Validate phone number format (accept both +91XXXXXXXXXX and XXXXXXXXXX)
  const phoneRegex = /^(\+91)?\d{10}$/;
  if (!phoneRegex.test(agent)) {
    return res.status(400).json({ 
      error: 'Invalid agent phone number format. Must be +91XXXXXXXXXX or XXXXXXXXXX',
      received: agent 
    });
  }
  if (!phoneRegex.test(customer)) {
    return res.status(400).json({ 
      error: 'Invalid customer phone number format. Must be +91XXXXXXXXXX or XXXXXXXXXX',
      received: customer 
    });
  }

  // Format phone numbers without +91 prefix for MCUBE API
  const agentNumber = agent.replace('+91', '');
  const customerNumber = customer.replace('+91', '');

  // Use the working MCUBE API format (without +91 prefix, without refid)
  const apiUrl = `https://mcube.vmc.in/api/outboundcall?apikey=34b4391e00592dc6aa2a117bcd495e0f5&exenumber=${encodeURIComponent(agentNumber)}&custnumber=${encodeURIComponent(customerNumber)}`;

  // 🐞 Debug: Print full MCUBE API URL (mask API key for security)
  console.log(`[${new Date().toISOString()}] Calling MCUBE URL: ${apiUrl.replace(MCUBE_API_KEY, '****')}`);
  console.log(`[${new Date().toISOString()}] Call parameters:`, { agent, customer, leadId });

  try {
    const response = await axios.get(apiUrl, {
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'CRM-System/1.0'
      }
    });
    
    console.log(`[${new Date().toISOString()}] MCUBE API response status:`, response.status);
    console.log(`[${new Date().toISOString()}] MCUBE API response data:`, response.data);
    
    // Log the call attempt for manual tracking
    console.log(`[${new Date().toISOString()}] Call initiated:`, {
      agent,
      customer,
      leadId,
      response: response.data,
      status: response.status
    });

    // Check if MCUBE response indicates success
    const responseData = response.data;
    console.log(`[${new Date().toISOString()}] MCUBE response data:`, responseData);
    
    // Handle JSON response from MCUBE
    if (responseData && typeof responseData === 'object' && responseData.msg === 'success') {
      return res.json({ 
        success: true, 
        message: 'MCUBE call triggered successfully! Your phone should ring shortly.',
        note: `Call ID: ${responseData.callid}`,
        mcubeResponse: responseData,
        debug: {
          agent,
          customer,
          leadId,
          agentNumber,
          customerNumber,
          apiUrl: apiUrl.replace(MCUBE_API_KEY, '****')
        }
      });
    } else if (responseData && typeof responseData === 'string' && responseData.includes('success')) {
      return res.json({ 
        success: true, 
        message: 'MCUBE call triggered successfully! Your phone should ring shortly.',
        note: 'Call status and recording will not be available without a public callback URL.',
        mcubeResponse: responseData,
        debug: {
          agent,
          customer,
          leadId,
          agentNumber,
          customerNumber,
          apiUrl: apiUrl.replace(MCUBE_API_KEY, '****')
        }
      });
    } else {
      return res.json({ 
        success: false, 
        message: 'MCUBE API responded but may not have triggered the call.',
        note: 'Check MCUBE dashboard or contact MCUBE support.',
        mcubeResponse: responseData,
        debug: {
          agent,
          customer,
          leadId,
          agentNumber,
          customerNumber,
          apiUrl: apiUrl.replace(MCUBE_API_KEY, '')
        }
      });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] MCUBE call error:`, {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      code: error.code
    });
    
    let errorMessage = 'Failed to trigger call';
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Cannot connect to MCUBE API. Check internet connection.';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'MCUBE API request timed out. Please try again.';
    } else if (error.response?.status === 401) {
      errorMessage = 'Invalid MCUBE API key. Please check your configuration.';
    } else if (error.response?.status === 400) {
      errorMessage = 'Invalid request parameters. Check phone numbers and lead ID.';
    }
    
    return res.status(error.response?.status || 500).json({
      success: false,
      error: errorMessage,
      details: error.message,
      debug: {
        agent,
        customer,
        leadId,
        apiUrl: apiUrl.replace(MCUBE_API_KEY, '****')
      }
    });
  }
});

// 2️⃣ Callback Route (Only works with public URL like ngrok)
router.post('/mcube-callback', async (req, res) => {
  try {
    const {
      callid,
      executive,
      customer,
      starttime,
      endtime,
      status,
      duration,
      answeredtime,
      callType,
      filename,
      refid,
    } = req.body;

    console.log(`[${new Date().toISOString()}] MCUBE Callback Received:`, {
      callid,
      refid,
      status,
      filename,
      executive,
      customer
    });

    // 🔁 Trigger Titan AI Call Analysis if recording exists
    if (filename && process.env.CALL_ANALYSIS_API) {
      try {
        await axios.post(process.env.CALL_ANALYSIS_API, {
          leadId: refid,
          recordingUrl: filename,
          source: 'mcube',
        });
        console.log(`[${new Date().toISOString()}] Call analysis triggered for callid: ${callid}`);
      } catch (analysisError) {
        console.error(`[${new Date().toISOString()}] Call analysis error:`, analysisError.message);
      }
    }

    // 🔄 Update lead via Google Apps Script
    try {
      const params = new URLSearchParams({
        action: 'updateLead',
        leadId: refid,
        called: status === 'Customer Busy' ? 'Yes' : 'No',
        feedback1: filename || ''
      });
      await axios.get(GOOGLE_SCRIPT_URL, { params });
      console.log(`[${new Date().toISOString()}] Lead updated for refid: ${refid}`);
    } catch (scriptError) {
      console.error(`[${new Date().toISOString()}] Google Apps Script error:`, scriptError.message);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Callback handling failed:`, err.message);
    res.status(500).json({ error: 'Callback processing error', details: err.message });
  }
});

// 3️⃣ Manual Call Status Update (For local development)
router.post('/update-call-status', async (req, res) => {
  try {
    const { leadId, status, notes } = req.body;
    
    console.log(`[${new Date().toISOString()}] Manual call status update:`, {
      leadId,
      status,
      notes
    });

    // Update lead via Google Apps Script
    try {
      const params = new URLSearchParams({
        action: 'updateLead',
        leadId: leadId,
        called: 'Yes',
        feedback1: `Status: ${status} | Notes: ${notes || 'Manual update'}`
      });
      await axios.get(GOOGLE_SCRIPT_URL, { params });
      console.log(`[${new Date().toISOString()}] Lead updated for refid: ${leadId}`);
    } catch (scriptError) {
      console.error(`[${new Date().toISOString()}] Google Apps Script error:`, scriptError.message);
    }

    res.json({ success: true, message: 'Call status updated manually' });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Manual status update failed:`, err.message);
    res.status(500).json({ error: 'Failed to update call status', details: err.message });
  }
});

export default router;