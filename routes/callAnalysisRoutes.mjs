import express from 'express';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase-config.js';
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const router = express.Router();

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

// POST: Analyze a call (download, transcribe, analyze, store)
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

export default router;
