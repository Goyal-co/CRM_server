import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

async function transcribeAudio(filePath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('model', 'whisper-1');
  form.append('response_format', 'text'); // You can also use 'json' or 'srt'

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );
    return response.data; // This will be plain text
  } catch (error) {
    console.error("❌ Whisper transcription error:", error.response?.data || error.message);
    return null;
  }
}

export default transcribeAudio;
