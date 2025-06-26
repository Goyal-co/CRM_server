import { Router } from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { OpenAI } from 'openai';
import CallLog from '../models/CallLog.js';
import CallAnalysis from '../models/CallAnalysis.js';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const downloadFile = async (url, outputPath) => {
  const writer = fs.createWriteStream(outputPath);
  const response = await axios({ url, method: 'GET', responseType: 'stream' });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(outputPath));
    writer.on('error', reject);
  });
};

// ✅ POST: Analyze Call & Save to CallLog + CallAnalysis
router.post('/analyze-call', async (req, res) => {
  const { recordingUrl, callId, agentName = "Unknown", callDate = new Date().toISOString().split("T")[0] } = req.body;

  try {
    const filePath = path.join(__dirname, `../recordings/${callId}.mp3`);

    if (!fs.existsSync(filePath)) {
      await downloadFile(recordingUrl, filePath);
    }

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-1'
    });

    const transcript = transcription.text;

    const gptPrompt = `
You are a call review assistant for a real estate company.
Analyze the following transcript and return a JSON with:

- summary
- pitchScore (1–10)
- mistakes (list)
- customerTone (e.g., Interested, Rude, Neutral, Unconvinced)
- recommendation
- followUpSuggestion

Transcript:
"""
${transcript}
"""
    `;

    const gptRes = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: gptPrompt }],
      temperature: 0.5
    });

    const parsed = JSON.parse(gptRes.choices[0].message.content);

    await CallLog.findOneAndUpdate(
      { callSid: callId },
      {
        transcript,
        summary: parsed.summary,
        pitchScore: parsed.pitchScore,
        mistakes: parsed.mistakes,
        customerTone: parsed.customerTone,
        recommendation: parsed.recommendation,
        followUpSuggestion: parsed.followUpSuggestion
      },
      { upsert: true, new: true }
    );

    await CallAnalysis.create({
      date: callDate,
      agent: agentName,
      summary: parsed.summary,
      pitchScore: parsed.pitchScore,
      mistakes: parsed.mistakes.join(", "),
      tone: parsed.customerTone,
      recommendation: parsed.followUpSuggestion,
      filePath: `/recordings/${callId}.mp3`
    });

    res.json({ success: true, analysis: parsed });
  } catch (err) {
    console.error('❌ AI Analysis Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ GET: Fetch Call Analysis for Admin Dashboard
router.get('/call-analysis', async (req, res) => {
  try {
    const { member = "", dateRange = "" } = req.query;

    const filter = {};
    if (member) {
      filter.agent = new RegExp(member, "i");
    }

    if (dateRange) {
      const now = new Date();
      let from;
      if (dateRange === "7d") from = new Date(now.getTime() - 7 * 86400000);
      else if (dateRange === "30d") from = new Date(now.getTime() - 30 * 86400000);
      else if (dateRange === "thisMonth") from = new Date(now.getFullYear(), now.getMonth(), 1);

      if (from) {
        filter.date = { $gte: from.toISOString().split("T")[0] };
      }
    }

    const results = await CallAnalysis.find(filter).sort({ date: -1 });
    res.json(results);
  } catch (err) {
    console.error("❌ Error fetching call analysis:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ❌ TEMP TEST ROUTE (REMOVE LATER)
router.post('/test-insert-call', async (req, res) => {
  try {
    const data = req.body;
    await CallAnalysis.create(data);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to insert test call analysis' });
  }
});

// ✅ Always export the router
export default router;
