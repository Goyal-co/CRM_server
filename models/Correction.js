import mongoose from 'mongoose';

const correctionSchema = new mongoose.Schema({
  project: String,
  field: String,
  correctedText: String,
  markedAsWrong: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
});

const Correction = mongoose.models.Correction || mongoose.model("Correction", correctionSchema);
export default Correction;
