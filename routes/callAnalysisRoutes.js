import { Router } from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { OpenAI } from 'openai';
import CallLog from '../models/CallLog.js';
import CallAnalysis from '../models/CallAnalysis.js';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase-config.js';
import fetch from 'node-fetch';
import FormData from 'form-data';

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
  const { docId } = req.body;
  const openAIApiKey = process.env.OPENAI_API_KEY;
  try {
    // 1. Fetch callback doc
    const docRef = doc(db, 'mcube-callbacks', docId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return res.status(404).json({ error: 'Callback not found' });
    const callData = JSON.parse(docSnap.data().data);
    const callId = callData.callid;
    const recordingUrl = callData.filename;

    // 2. Download recording
    const response = await fetch(recordingUrl);
    if (!response.ok) throw new Error('Failed to download audio');
    const filePath = path.join('recordings', `${callId}.wav`);
    const dest = fs.createWriteStream(filePath);
    await new Promise((resolve, reject) => {
      response.body.pipe(dest);
      response.body.on('error', reject);
      dest.on('finish', resolve);
    });

    // 3. Transcribe with Whisper
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('model', 'whisper-1');
    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openAIApiKey}` },
      body: form
    });
    if (!whisperRes.ok) throw new Error('Whisper transcription failed');
    const whisperData = await whisperRes.json();
    const transcript = whisperData.text;

    // 4. Analyze with OpenAI GPT
    const prompt = `You are a call review assistant for a real estate company.\nAnalyze the following transcript and return a JSON with:\n- summary\n- pitchScore (1–10)\n- mistakes (list)\n- customerTone (e.g., Interested, Rude, Neutral, Unconvinced)\n- recommendation\n- followUpSuggestion\n\nTranscript:\n"""\n${transcript}\n"""`;
    const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5
      })
    });
    if (!gptRes.ok) throw new Error('OpenAI analysis failed');
    const gptData = await gptRes.json();
    const analysis = JSON.parse(gptData.choices[0].message.content);

    // 5. Store analysis and transcript in Firestore
    await setDoc(docRef, { analysis, transcript }, { merge: true });

    res.json({ success: true, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

// GET: Fetch all call recordings from Firestore
router.get('/call-recordings', async (req, res) => {
  try {
    const querySnapshot = await getDocs(collection(db, 'mcube-callbacks'));
    const recordings = [];
    querySnapshot.forEach(docSnap => {
      const rawData = docSnap.data();
      let callData = {};
      try {
        callData = JSON.parse(rawData.data);
      } catch (e) {
        return;
      }
      recordings.push({
        ...callData,
        receivedAt: rawData.receivedAt,
        docId: docSnap.id
      });
    });
    res.json({ recordings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch call recordings' });
  }
});

// GET: Fetch leads data from Google Sheets for name mapping
router.get('/leads-data', async (req, res) => {
  try {
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbznX9Q-zsf-Trlal1aBSn4WPngHIOeBAycoI8XrmzKUq85aNQ-Mwk0scn86ty-4gsjA/exec';
    const response = await fetch(`${scriptUrl}?action=getAllLeads`);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    res.json({ leads: data });
  } catch (err) {
    console.error('Error fetching leads data:', err);
    res.status(500).json({ error: 'Failed to fetch leads data' });
  }
});

// ✅ Always export the router
export default router;
