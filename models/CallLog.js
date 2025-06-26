// models/CallLog.js
import mongoose from 'mongoose';

const callLogSchema = new mongoose.Schema({
  callSid: { type: String, required: true },            // UUID to track this call
  agentNumber: { type: String, required: true },
  customerNumber: { type: String, required: true },
  agentEmail: { type: String },
  project: { type: String },
  status: { type: String, default: 'initiated' },       // initiated, completed, etc.
  twilioCallSid: { type: String },                      // Twilio-provided call SID
  recordingUrl: { type: String },
  endTime: { type: Date }
}, { timestamps: true });

const CallLog = mongoose.model('CallLog', callLogSchema);
export default CallLog;
