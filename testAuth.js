// testAuth.js
import { google } from 'googleapis';
import { readFile } from 'fs/promises';

async function test() {
  const raw = await readFile('./google-service-account.json', 'utf-8');
  const credentials = JSON.parse(raw);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.get({
    spreadsheetId: '1rdMmTZDGEJ4ZGt4b83tgA__8sMBIRvsPcZurQMzVQOo'
  });
  console.log('⏳ Using service account:', credentials.client_email);
console.log('🔐 Private key starts with:', credentials.private_key?.slice(0, 40));
console.log('🕒 Time now (UTC):', new Date().toISOString());


  console.log('✅ Sheet title:', res.data.properties.title);
}

test().catch(console.error);
