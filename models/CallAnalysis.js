import mongoose from 'mongoose';

const callAnalysisSchema = new mongoose.Schema({
  date: String, // Format: "YYYY-MM-DD"
  agent: String,
  summary: String,
  pitchScore: Number,
  mistakes: String,
  tone: String,
  recommendation: String,
  filePath: String
});

const CallAnalysis = mongoose.model("CallAnalysis", callAnalysisSchema);
export default CallAnalysis;
