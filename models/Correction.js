import mongoose from 'mongoose';

const correctionSchema = new mongoose.Schema({
  project: String,
  field: String,
  correctedText: String,
  markedAsWrong: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  user: { type: String }, // user who submitted
  admin: { type: String }, // admin who approved/rejected
  history: [
    {
      correctedText: String,
      status: String,
      user: String,
      admin: String,
      updatedAt: Date
    }
  ],
  feedback: [
    {
      user: String,
      value: { type: String, enum: ['up', 'down'] },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Correction = mongoose.models.Correction || mongoose.model("Correction", correctionSchema);
export default Correction;
