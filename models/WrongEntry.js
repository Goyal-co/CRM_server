import mongoose from 'mongoose';

const WrongEntrySchema = new mongoose.Schema({
  project: String,
  field: String,
  rejectedItem: String,
  reason: String,
  flaggedBy: String,
  timestamp: { type: Date, default: Date.now }
});

const WrongEntry = mongoose.model("WrongEntry", WrongEntrySchema);
export default WrongEntry;
