import express from 'express'; 
import { OpenAI } from 'openai';
import WrongEntry from '../models/WrongEntry.js';
import Correction from '../models/Correction.js';

const router = express.Router();

router.post('/generate-pitch', async (req, res) => {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { projectInfo } = req.body;

    if (!projectInfo || !projectInfo["Project Name"]) {
      return res.status(400).json({ error: "Missing or invalid project info" });
    }

    // Fetch all wrong entries for this project
    const wrongEntries = await WrongEntry.find({ project: projectInfo["Project Name"] });
    // Group corrections by field
    const corrections = {};
    for (const entry of wrongEntries) {
      if (!corrections[entry.field]) corrections[entry.field] = [];
      corrections[entry.field].push(entry.rejectedItem);
    }

    const prompt = `
You are a real estate sales assistant helping a team pitch a residential project.

Here are the project details:

- Project Name: ${projectInfo["Project Name"]}
- Location: ${projectInfo["Location"]}
- Land Price Nearby: ${projectInfo["Price (per sq ft)"]}
- Metro Station Nearby: ${projectInfo["Metro Nearby"]}
- Possession: ${projectInfo["Possession"]}
- Configuration: ${projectInfo["Configuration"]}
- Amenities: ${projectInfo["Amenities"]}

Please generate the following sections in a clean numbered format:
1. Why This Project?
2. Top 3 Nearby Under-Construction Projects (include name, distance, and price per sq ft)
3. Best Pitch Lines (3–5 emotional or practical one-liners)
4. Top FAQs (3–5 most common queries)
5. WhatsApp Message (1 short message to send to leads)
6. Price Justification (2–3 strong lines)
7. Objection Handler (2–3 lines to overcome objections)
8. Finance & Tax Tips (real estate tax savings or home loan insights)
`.trim();

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const raw = response.choices[0].message.content;
    console.log("\n🔍 RAW GPT RESPONSE:\n====================\n", raw, "\n====================\n");

    const sections = raw.split(/\n?\s*\d+\.\s+/).filter(Boolean);

    // Helper to filter or replace with correction for a field
    function filterOrCorrectSection(sectionArr, field) {
      if (!Array.isArray(sectionArr)) return sectionArr;
      if (!corrections[field]) return sectionArr;
      // Map rejected items to their correction if available, else filter out
      return sectionArr.flatMap(item => {
        const idx = corrections[field].findIndex((rej, i) => {
          // If correction exists, match by rejectedItem
          if (typeof rej === 'object' && rej.rejectedItem) return rej.rejectedItem === item;
          return rej === item;
        });
        if (idx !== -1) {
          const corr = corrections[field][idx];
          if (typeof corr === 'object' && corr.correction) {
            return [corr.correction]; // Use the correction
          }
          // If no correction, filter out
          return [];
        }
        return [item];
      });
    }

    // Refetch corrections as objects (not just rejectedItem string)
    const wrongEntriesFull = await WrongEntry.find({ project: projectInfo["Project Name"] });
    const correctionsFull = {};
    for (const entry of wrongEntriesFull) {
      if (!correctionsFull[entry.field]) correctionsFull[entry.field] = [];
      correctionsFull[entry.field].push({ rejectedItem: entry.rejectedItem, correction: entry.correction });
    }

    let result = {
      whyThis: filterOrCorrectSection(sections[0]?.split("\n").map(l => l.trim()).filter(Boolean) || [], "whyThis"),
      nearbyProjects: filterOrCorrectSection(sections[1]?.split("\n").map(l => l.trim()).filter(Boolean) || [], "nearbyProjects"),
      pitchLines: filterOrCorrectSection(sections[2]?.split("\n").map(l => l.trim()).filter(Boolean) || [], "pitchLines"),
      faqs: filterOrCorrectSection(sections[3]?.split("\n").map(l => l.trim()).filter(Boolean) || [], "faqs"),
      whatsappMessage: correctionsFull["whatsappMessage"] && correctionsFull["whatsappMessage"][0]?.correction ? correctionsFull["whatsappMessage"][0].correction : (sections[4]?.trim() || ""),
      priceJustification: filterOrCorrectSection(sections[5]?.split("\n").map(l => l.trim()).filter(Boolean) || [], "priceJustification"),
      objectionHandler: filterOrCorrectSection(sections[6]?.split("\n").map(l => l.trim()).filter(Boolean) || [], "objectionHandler"),
      financeTips: filterOrCorrectSection(sections[7]?.split("\n").map(l => l.trim()).filter(Boolean) || [], "financeTips"),
    };

    res.json(result);

  } catch (err) {
    console.error("❌ AI generation failed:", err);
    res.status(500).json({ error: "Something went wrong with AI generation" });
  }
});

export default router;
