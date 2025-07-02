import fetch from 'node-fetch';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase-config.js';

async function batchAnalyze() {
  const querySnapshot = await getDocs(collection(db, 'mcube-callbacks'));
  const calls = [];
  querySnapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (!data.transcript || !data.analysis) {
      calls.push(docSnap.id);
    }
  });
  console.log(`Found ${calls.length} calls to analyze.`);
  for (const docId of calls) {
    try {
      const res = await fetch('https://pratham-server.onrender.com/api/analyze-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId })
      });
      const result = await res.json();
      if (result.success) {
        console.log(`Analyzed call ${docId}`);
      } else {
        console.error(`Failed to analyze call ${docId}:`, result.error);
      }
    } catch (err) {
      console.error(`Error analyzing call ${docId}:`, err);
    }
  }
}

batchAnalyze();
