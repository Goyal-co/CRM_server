import mongoose from 'mongoose';

const WrongEntrySchema = new mongoose.Schema({
  project: String,
  field: String,
  rejectedItem: String,
  reason: String,
  flaggedBy: String,
  correction: String, // New field for the corrected value
  timestamp: { type: Date, default: Date.now }
});

const WrongEntry = mongoose.model("WrongEntry", WrongEntrySchema);
export default WrongEntry;
