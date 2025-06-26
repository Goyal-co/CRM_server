require('dotenv').config();
const { OpenAI } = require("openai");
const fs = require("fs");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

(async () => {
  const transcript = fs.readFileSync("./recordings/test-call.txt", "utf-8");

  const prompt = `
You are an AI call analyst for a real estate sales team. Analyze the following transcript of a sales call and return a smart JSON summary.

Transcript:
"""
${transcript}
"""

Respond in the following JSON format:
{
  "summary": "Short summary of the call",
  "pitch_score": 1-10,
  "mistakes": ["List any mistakes by the salesperson"],
  "customer_tone": "e.g. interested, frustrated, confused",
  "recommendation": "What the salesperson should do next (call again, WhatsApp, drop)",
  "follow_up_suggestion": "Morning, evening, or WhatsApp only"
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7
  });

  console.log("\n🧠 TitanVoice AI Output:\n", response.choices[0].message.content);
})();
