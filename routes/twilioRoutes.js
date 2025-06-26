// routes/twilioRoutes.js

// ✅ Load .env before anything else
import '../configEnv.js';

import express from 'express';
import twilio from 'twilio';
import { v4 as uuidv4 } from 'uuid';
import CallLog from '../models/CallLog.js';

const router = express.Router();

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE || '+19343867896';
const client = twilio(accountSid, authToken);

// ✅ Your current Ngrok URL (change this when you regenerate)
const TUNNEL_BASE = "https://72ad-106-51-69-178.ngrok-free.app";

console.log("🐛 TWILIO_PHONE being used:", twilioNumber);

//
// 1️⃣ Start Call
//
router.post('/start-call', async (req, res) => {
  const { agentNumber, customerNumber, agentEmail, project } = req.body;

  if (!agentNumber || !customerNumber) {
    return res.status(400).json({ success: false, error: 'Missing phone numbers' });
  }

  try {
    const callSid = uuidv4();

    // ✅ Clean customer number
    const formattedCustomerNumber = customerNumber.startsWith('+')
      ? customerNumber
      : `+${customerNumber.replace(/\D/g, '')}`;

    const call = await client.calls.create({
      url: `${TUNNEL_BASE}/api/twilio/connect-customer?customerNumber=${encodeURIComponent(formattedCustomerNumber)}&callSid=${callSid}`,
      to: agentNumber,
      from: twilioNumber,
      record: true,
      statusCallback: `${TUNNEL_BASE}/api/twilio/call-status`,
      statusCallbackMethod: 'POST',
      statusCallbackEvent: ['completed']
    });

    await CallLog.create({
      callSid,
      agentNumber,
      customerNumber: formattedCustomerNumber,
      agentEmail,
      project,
      status: "initiated",
      twilioCallSid: call.sid
    });

    return res.json({ success: true, sid: call.sid });
  } catch (error) {
    console.error("❌ Twilio call failed:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});


// 2️⃣ Connect Agent to Customer
router.post('/connect-customer', (req, res) => {
  try {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();

    let customerNumber = req.query.customerNumber?.trim();

    if (!customerNumber) {
      console.error("❌ Missing customer number");
      return res.status(400).send("Missing customer number");
    }

    if (!customerNumber.startsWith("+")) {
      customerNumber = `+${customerNumber}`;
    }

    console.log("📞 Connecting to:", customerNumber);

    const dial = response.dial({
      callerId: twilioNumber,
      record: 'record-from-answer-dual'
    });

    dial.number({}, customerNumber);

    res.type('text/xml');
    res.send(response.toString());
  } catch (err) {
    console.error("❌ Error in connect-customer:", err);
    res.status(500).send("Internal TwiML error");
  }
});



//
// 3️⃣ Call Status Webhook
//
router.post('/call-status', async (req, res) => {
  const { CallSid, RecordingUrl, CallStatus } = req.body;

  try {
    await CallLog.findOneAndUpdate(
      { twilioCallSid: CallSid },
      {
        status: CallStatus,
        recordingUrl: RecordingUrl,
        endTime: new Date()
      }
    );

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Failed to update call log:", err);
    res.sendStatus(500);
  }
});

export default router;
