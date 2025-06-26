require('dotenv').config(); // 👈 load .env
const transcribeAudio = require('./utils/transcribe');

(async () => {
  const transcript = await transcribeAudio('./recordings/test-call.mp3');
  console.log("🎧 Transcript Output:\n", transcript);
})();
