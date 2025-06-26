// services/sheetsService.js
import { google } from 'googleapis';
import { readFile } from 'fs/promises';

const SPREADSHEET_ID = '1rdMmTZDGEJ4ZGt4b83tgA__8sMBIRvsPcZurQMzVQOo';
const SHEET_NAME = 'Leads'; // Update if your sheet/tab name is different

async function authorizeGoogle() {
  const credentials = JSON.parse(
    await readFile('./google-service-account.json', 'utf-8') // 👈 rename your JSON key to this and place in root folder
  );

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

export async function appendLeadToSheet(lead) {
  const sheets = await authorizeGoogle();

  const values = [
    [
      lead.leadId || '',
      '', // Project (blank by default)
      lead.source || 'Facebook',
      lead.name || '',
      lead.email || '',
      lead.phone || '',
      '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
    ]
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values,
    },
  });

  console.log('✅ Lead pushed to Google Sheet');
}
