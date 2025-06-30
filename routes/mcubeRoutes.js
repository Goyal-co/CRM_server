import express from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, getDocs, query, where, orderBy, updateDoc } from 'firebase/firestore';
import { storage, db } from '../firebase-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  // Use the working MCUBE API format without callback URL
  const apiUrl = `https://mcube.vmc.in/api/outboundcall?apikey=029f2e0cebd3e3473f0b4cbbaebd1ed5&exenumber=${encodeURIComponent(agentNumber)}&custnumber=${encodeURIComponent(customerNumber)}&refid=${encodeURIComponent(leadId)}`;

  // 🐞 Debug: Print full MCUBE API URL (do not mask API key for troubleshooting)
  console.log(`[${new Date().toISOString()}] Calling MCUBE URL: ${apiUrl}`);
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

    let firebaseRecordingUrl = null;
    let firebaseFileId = null;

    // Download and upload to Firebase if filename exists
    if (filename) {
      try {
        console.log(`[${new Date().toISOString()}] Downloading recording from: ${filename}`);
        
        // Download the file from MCUBE
        const response = await axios.get(filename, { 
          responseType: 'arraybuffer',
          timeout: 60000 // 60 second timeout for large files
        });
        
        // Create a temporary file
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const tempFilePath = path.join(tempDir, `${callid}.wav`);
        fs.writeFileSync(tempFilePath, response.data);
        
        console.log(`[${new Date().toISOString()}] Downloaded to temp: ${tempFilePath}`);

        // Upload to Firebase Storage
        const storageRef = ref(storage, `call-recordings/${callid}.wav`);
        const fileBuffer = fs.readFileSync(tempFilePath);
        
        console.log(`[${new Date().toISOString()}] Uploading to Firebase Storage...`);
        const uploadResult = await uploadBytes(storageRef, fileBuffer, {
          contentType: 'audio/wav'
        });
        
        // Get the download URL
        firebaseRecordingUrl = await getDownloadURL(uploadResult.ref);
        firebaseFileId = uploadResult.ref.fullPath;
        
        console.log(`[${new Date().toISOString()}] Uploaded to Firebase: ${firebaseRecordingUrl}`);
        
        // Clean up temp file
        fs.unlinkSync(tempFilePath);
        
      } catch (uploadErr) {
        console.error(`[${new Date().toISOString()}] Error uploading to Firebase:`, uploadErr);
        firebaseRecordingUrl = null;
        firebaseFileId = null;
      }
    }

    // Store call metadata in Firestore
    try {
      const callData = {
        callId: callid,
        executive: executive,
        customer: customer,
        startTime: starttime,
        endTime: endtime,
        status: status,
        callType: callType,
        duration: duration,
        answeredTime: answeredtime,
        mcubeRecordingUrl: filename,
        firebaseRecordingUrl: firebaseRecordingUrl,
        firebaseFileId: firebaseFileId,
        refId: refid,
        createdAt: new Date(),
        analysisStatus: 'pending',
        analysisResults: null
      };
      
      const docRef = await addDoc(collection(db, 'call-logs'), callData);
      console.log(`[${new Date().toISOString()}] Call data stored in Firestore with ID: ${docRef.id}`);
      
    } catch (firestoreErr) {
      console.error(`[${new Date().toISOString()}] Error storing in Firestore:`, firestoreErr);
    }

    // 🔁 Trigger Titan AI Call Analysis if recording exists (use Firebase URL if available)
    if (firebaseRecordingUrl) {
      try {
        console.log(`[${new Date().toISOString()}] Triggering AI analysis with Firebase recording: ${firebaseRecordingUrl}`);
        
        await axios.post(`${process.env.CALL_ANALYSIS_API || 'http://localhost:5000/api/call-analysis'}`, {
          leadId: refid,
          recordingUrl: firebaseRecordingUrl,
          callId: callid,
          source: 'mcube',
          status: status,
          duration: duration,
          firebaseFileId: firebaseFileId
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`[${new Date().toISOString()}] AI analysis triggered successfully for callid: ${callid}`);
      } catch (analysisError) {
        console.error(`[${new Date().toISOString()}] Call analysis error:`, analysisError.message);
      }
    } else if (filename && process.env.CALL_ANALYSIS_API) {
      // Fallback: use MCUBE URL if Firebase upload failed
      try {
        await axios.post(process.env.CALL_ANALYSIS_API, {
          leadId: refid,
          recordingUrl: filename,
          source: 'mcube',
        });
        console.log(`[${new Date().toISOString()}] Call analysis triggered with MCUBE URL for callid: ${callid}`);
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
        feedback1: firebaseRecordingUrl || filename || ''
      });
      await axios.get(GOOGLE_SCRIPT_URL, { params });
      console.log(`[${new Date().toISOString()}] Lead updated for refid: ${refid}`);
    } catch (scriptError) {
      console.error(`[${new Date().toISOString()}] Google Apps Script error:`, scriptError.message);
    }

    res.status(200).json({ 
      success: true, 
      recordingUploaded: !!firebaseRecordingUrl,
      firebaseUrl: firebaseRecordingUrl,
      firebaseFileId: firebaseFileId
    });
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

// 4️⃣ List all call recordings from Firebase
router.get('/recordings', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, callId } = req.query;
    const offset = (page - 1) * limit;
    
    // Build Firestore query
    let q = collection(db, 'call-logs');
    
    if (status) {
      q = query(q, where('status', '==', status));
    }
    
    if (callId) {
      q = query(q, where('callId', '==', callId));
    }
    
    // Order by creation date (newest first)
    q = query(q, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const recordings = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      recordings.push({
        id: doc.id,
        callId: data.callId,
        executive: data.executive,
        customer: data.customer,
        startTime: data.startTime,
        endTime: data.endTime,
        status: data.status,
        duration: data.duration,
        answeredTime: data.answeredTime,
        firebaseRecordingUrl: data.firebaseRecordingUrl,
        mcubeRecordingUrl: data.mcubeRecordingUrl,
        refId: data.refId,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        analysisStatus: data.analysisStatus,
        analysisResults: data.analysisResults
      });
    });
    
    // Apply pagination
    const total = recordings.length;
    const paginatedRecordings = recordings.slice(offset, offset + parseInt(limit));
    
    res.json({ 
      recordings: paginatedRecordings, 
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error listing recordings:`, err);
    res.status(500).json({ error: 'Failed to list recordings' });
  }
});

// 5️⃣ Get specific call recording details
router.get('/recordings/:callId', async (req, res) => {
  try {
    const { callId } = req.params;
    
    const q = query(
      collection(db, 'call-logs'), 
      where('callId', '==', callId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return res.status(404).json({ error: 'Call recording not found' });
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    const recording = {
      id: doc.id,
      callId: data.callId,
      executive: data.executive,
      customer: data.customer,
      startTime: data.startTime,
      endTime: data.endTime,
      status: data.status,
      callType: data.callType,
      duration: data.duration,
      answeredTime: data.answeredTime,
      firebaseRecordingUrl: data.firebaseRecordingUrl,
      mcubeRecordingUrl: data.mcubeRecordingUrl,
      refId: data.refId,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      analysisStatus: data.analysisStatus,
      analysisResults: data.analysisResults
    };
    
    res.json(recording);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error getting recording:`, err);
    res.status(500).json({ error: 'Failed to get recording' });
  }
});

// 6️⃣ Get call statistics
router.get('/call-stats', async (req, res) => {
  try {
    const querySnapshot = await getDocs(collection(db, 'call-logs'));
    
    const stats = {
      total: 0,
      completed: 0,
      busy: 0,
      failed: 0,
      totalDuration: 0,
      averageDuration: 0,
      recordingsWithAudio: 0
    };
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      stats.total++;
      
      if (data.status === 'Call complete') {
        stats.completed++;
      } else if (data.status === 'Customer Busy') {
        stats.busy++;
      } else {
        stats.failed++;
      }
      
      if (data.duration) {
        stats.totalDuration += parseInt(data.duration);
      }
      
      if (data.firebaseRecordingUrl) {
        stats.recordingsWithAudio++;
      }
    });
    
    stats.averageDuration = stats.total > 0 ? Math.round(stats.totalDuration / stats.total) : 0;
    
    res.json(stats);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error getting call stats:`, err);
    res.status(500).json({ error: 'Failed to get call statistics' });
  }
});

// 7️⃣ Update analysis results
router.put('/recordings/:callId/analysis', async (req, res) => {
  try {
    const { callId } = req.params;
    const { analysisResults, analysisStatus } = req.body;
    
    const q = query(
      collection(db, 'call-logs'), 
      where('callId', '==', callId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return res.status(404).json({ error: 'Call recording not found' });
    }
    
    const doc = querySnapshot.docs[0];
    await updateDoc(doc.ref, {
      analysisResults,
      analysisStatus: analysisStatus || 'completed',
      analyzedAt: new Date()
    });
    
    res.json({ success: true, message: 'Analysis results updated' });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error updating analysis:`, err);
    res.status(500).json({ error: 'Failed to update analysis results' });
  }
});

// 8️⃣ Manual Download Recording from MCUBE
router.post('/download-recording', async (req, res) => {
  try {
    const { callId, leadId, agent, customer } = req.body;
    
    if (!callId) {
      return res.status(400).json({ error: 'Call ID is required' });
    }

    console.log(`[${new Date().toISOString()}] Manual download requested for callId: ${callId}`);

    // Try to get recording URL from MCUBE (you might need to check MCUBE docs for this)
    // For now, we'll construct a possible URL pattern
    const possibleRecordingUrl = `https://mcube.vmctechnologies.com/sounds/${callId}.wav`;
    
    let firebaseRecordingUrl = null;
    let firebaseFileId = null;

    try {
      console.log(`[${new Date().toISOString()}] Attempting to download from: ${possibleRecordingUrl}`);
      
      // Download the file from MCUBE
      const response = await axios.get(possibleRecordingUrl, { 
        responseType: 'arraybuffer',
        timeout: 60000
      });
      
      // Create a temporary file
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempFilePath = path.join(tempDir, `${callId}.wav`);
      fs.writeFileSync(tempFilePath, response.data);
      
      console.log(`[${new Date().toISOString()}] Downloaded to temp: ${tempFilePath}`);

      // Upload to Firebase Storage
      const storageRef = ref(storage, `call-recordings/${callId}.wav`);
      const fileBuffer = fs.readFileSync(tempFilePath);
      
      console.log(`[${new Date().toISOString()}] Uploading to Firebase Storage...`);
      const uploadResult = await uploadBytes(storageRef, fileBuffer, {
        contentType: 'audio/wav'
      });
      
      // Get the download URL
      firebaseRecordingUrl = await getDownloadURL(uploadResult.ref);
      firebaseFileId = uploadResult.ref.fullPath;
      
      console.log(`[${new Date().toISOString()}] Uploaded to Firebase: ${firebaseRecordingUrl}`);
      
      // Clean up temp file
      fs.unlinkSync(tempFilePath);
      
    } catch (downloadErr) {
      console.error(`[${new Date().toISOString()}] Error downloading recording:`, downloadErr);
      return res.status(404).json({ 
        error: 'Recording not found or not accessible',
        details: downloadErr.message,
        callId: callId
      });
    }

    // Store call metadata in Firestore
    try {
      const callData = {
        callId: callId,
        executive: agent,
        customer: customer,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        status: 'Call complete',
        callType: 'Outbound',
        duration: 0,
        answeredTime: 0,
        mcubeRecordingUrl: possibleRecordingUrl,
        firebaseRecordingUrl: firebaseRecordingUrl,
        firebaseFileId: firebaseFileId,
        refId: leadId,
        createdAt: new Date(),
        analysisStatus: 'pending',
        analysisResults: null,
        manuallyDownloaded: true
      };
      
      const docRef = await addDoc(collection(db, 'call-logs'), callData);
      console.log(`[${new Date().toISOString()}] Call data stored in Firestore with ID: ${docRef.id}`);
      
    } catch (firestoreErr) {
      console.error(`[${new Date().toISOString()}] Error storing in Firestore:`, firestoreErr);
    }

    // Trigger AI analysis
    if (firebaseRecordingUrl) {
      try {
        console.log(`[${new Date().toISOString()}] Triggering AI analysis with Firebase recording: ${firebaseRecordingUrl}`);
        
        await axios.post(`${process.env.CALL_ANALYSIS_API || 'http://localhost:5000/api/call-analysis'}`, {
          leadId: leadId,
          recordingUrl: firebaseRecordingUrl,
          callId: callId,
          source: 'mcube',
          status: 'Call complete',
          duration: 0,
          firebaseFileId: firebaseFileId
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`[${new Date().toISOString()}] AI analysis triggered successfully for callid: ${callId}`);
      } catch (analysisError) {
        console.error(`[${new Date().toISOString()}] Call analysis error:`, analysisError.message);
      }
    }

    res.json({ 
      success: true, 
      message: 'Recording downloaded and uploaded to Firebase successfully',
      firebaseUrl: firebaseRecordingUrl,
      firebaseFileId: firebaseFileId
    });

  } catch (err) {
    console.error(`[${new Date().toISOString()}] Manual download failed:`, err.message);
    res.status(500).json({ error: 'Failed to download recording', details: err.message });
  }
});

export default router;