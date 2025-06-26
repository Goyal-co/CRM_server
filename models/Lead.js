import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  project: String,
  source: String,
  assignedTo: String,
  assignedAt: { type: Date, default: Date.now },
  callTime: Date,
  callDelayed: { type: Boolean, default: false },
  status: { type: String, default: "new" },
  createdAt: { type: Date, default: Date.now }
});

const Lead = mongoose.model('Lead', leadSchema);
export default Lead;
