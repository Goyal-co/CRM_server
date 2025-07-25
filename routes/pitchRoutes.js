import express from 'express'; 
import { OpenAI } from 'openai';
import WrongEntry from '../models/WrongEntry.js';
import Correction from '../models/Correction.js';
import { db as adminDb } from '../firebase-admin.js';

const router = express.Router();

// CORS middleware for all routes
const addCorsHeaders = (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
};

router.use(addCorsHeaders);

router.post('/generate-pitch', async (req, res) => {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Get project info and corrections from request
    let { projectInfo, corrections, projectName } = req.body;
    
    // If projectInfo is missing or empty, require projectName
    if (!projectInfo || Object.keys(projectInfo).length === 0) {
      projectName = projectName || req.body.projectName;
      if (!projectName) {
        return res.status(400).json({ error: "Missing project info or project name" });
      }
      
      // Compose prompt for full content generation
      const prompt = `You are a real estate sales assistant helping a team pitch a residential project.\n\nGenerate a full pitch for the project named: ${projectName}.\n\nInclude:\n1. Why This Project?\n2. Top 3 Nearby Under-Construction Projects (name, distance, price per sq ft)\n3. Best Pitch Lines (3–5)\n4. Top FAQs (3–5)\n5. WhatsApp Message\n6. Price Justification\n7. Objection Handler\n8. Finance & Tax Tips\n\nIf you don't know the real data, make an educated guess based on similar projects in India. Format as clean numbered sections.`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });
      
      const raw = response.choices[0].message.content;
      const sections = raw.split(/\n?\s*\d+\.\s+/).filter(Boolean);
      
      let result = {
        whyThis: sections[0]?.split("\n").map(l => l.trim()).filter(Boolean) || [],
        nearbyProjects: sections[1]?.split("\n").map(l => l.trim()).filter(Boolean) || [],
        pitchLines: sections[2]?.split("\n").map(l => l.trim()).filter(Boolean) || [],
        faqs: sections[3]?.split("\n").map(l => l.trim()).filter(Boolean) || [],
        whatsappMessage: sections[4]?.trim() || "",
        priceJustification: sections[5]?.split("\n").map(l => l.trim()).filter(Boolean) || [],
        objectionHandler: sections[6]?.split("\n").map(l => l.trim()).filter(Boolean) || [],
        financeTips: sections[7]?.split("\n").map(l => l.trim()).filter(Boolean) || [],
        projectInfo: { notes: `Generated by AI for project: ${projectName}` },
        usedAI: true
      };
      
      return res.json(result);
    }

    // Build corrections context for GPT
    let correctionsContext = "";
    if (corrections && corrections.length > 0) {
      correctionsContext = "\n\nIMPORTANT: Avoid or replace the following flagged content:\n";
      corrections.forEach(correction => {
        correctionsContext += `- Field \"${correction.field}\": \"${correction.rejectedItem}\" (Reason: ${correction.reason})\n`;
      });
      correctionsContext += "\nPlease avoid using any of the above flagged content in your response.";
    }

    // Compose prompt using project info and corrections
    const prompt = `\nYou are a real estate sales assistant helping a team pitch a residential project.\n\nHere are the project details:\n${Object.entries(projectInfo).map(([key, value]) => `- ${key}: ${value}`).join('\n')}\n\n${correctionsContext}\n\nPlease generate the following sections in a clean numbered format:\n1. Why This Project?\n2. Top 3 Nearby Under-Construction Projects (include name, distance, and price per sq ft)\n3. Best Pitch Lines (3–5 emotional or practical one-liners)\n4. Top FAQs (3–5 most common queries)\n5. WhatsApp Message (1 short message to send to leads)\n6. Price Justification (2–3 strong lines)\n7. Objection Handler (2–3 lines to overcome objections)\n8. Finance & Tax Tips (real estate tax savings or home loan insights)\n\nMake sure to avoid any flagged content mentioned above and provide fresh, engaging content.`.trim();

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const raw = response.choices[0].message.content;
    const sections = raw.split(/\n?\s*\d+\.\s+/).filter(Boolean);

    let result = {
      whyThis: sections[0]?.split("\n").map(l => l.trim()).filter(Boolean) || [],
      nearbyProjects: sections[1]?.split("\n").map(l => l.trim()).filter(Boolean) || [],
      pitchLines: sections[2]?.split("\n").map(l => l.trim()).filter(Boolean) || [],
      faqs: sections[3]?.split("\n").map(l => l.trim()).filter(Boolean) || [],
      whatsappMessage: sections[4]?.trim() || "",
      priceJustification: sections[5]?.split("\n").map(l => l.trim()).filter(Boolean) || [],
      objectionHandler: sections[6]?.split("\n").map(l => l.trim()).filter(Boolean) || [],
      financeTips: sections[7]?.split("\n").map(l => l.trim()).filter(Boolean) || [],
      projectInfo,
    };

    res.json(result);

  } catch (err) {
    console.error("❌ AI generation failed:", err);
    res.status(500).json({ error: "Something went wrong with AI generation", details: err.message });
  }
});

router.get('/generate-project-info', async (req, res) => {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const { name } = req.query;
    if (!name) return res.status(400).json({ error: 'Missing project name' });
    
    const prompt = `You are a real estate expert. Give a concise summary (max 8 lines) of the residential project named "${name}" in India. Include location, builder, key amenities, unique selling points, and any awards or highlights. If you don't know, make an educated guess based on similar projects.`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });
    
    const notes = response.choices[0].message.content.trim();
    res.json({ projectInfo: { notes } });
  } catch (err) {
    console.error('❌ AI project info generation failed:', err);
    res.status(500).json({ error: 'Failed to generate project info', details: err.message });
  }
});

export default router;
