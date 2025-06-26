import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const RECORDINGS_DIR = path.resolve('./recordings');

async function analyzeFile(filename) {
  const callId = filename.replace(".mp3", "");
  const recordingUrl = `http://localhost:5000/recordings/${filename}`;

  const payload = {
    recordingUrl,
    callId,
    agentName: "AutoBatch",
    callDate: new Date().toISOString().split("T")[0]
  };

  try {
    const res = await axios.post("http://localhost:5000/api/analyze-call", payload);
    console.log(`✅ Analyzed ${filename}:`, res.data.analysis.summary);
  } catch (err) {
    console.error(`❌ Failed to analyze ${filename}:`, err.message);
  }
}

const files = fs.readdirSync(RECORDINGS_DIR).filter(f => f.endsWith(".mp3"));

for (const file of files) {
  await analyzeFile(file);
}
