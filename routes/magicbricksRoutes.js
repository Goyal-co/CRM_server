import express from 'express';
import { appendLeadToSheet } from '../services/googleSheetsService.js';

const router = express.Router();

// Set your Google Sheet ID here (same as fbWebhook for now)
const SPREADSHEET_ID = '1KJB-28QU21Hg-IuavmkzdedxC8ycdguAgageFzYYfDo';

// POST endpoint for MagicBricks lead collection
router.post('/magicbricks/lead', async (req, res) => {
  try {
    // Extract lead data from POST body
    const body = req.body || {};
    // Map incoming fields to a standard lead object
    const lead = {
      leadId: body.leadId || body.id || `MAGICBRICKS-${Date.now()}`,
      project: body.project || body.projectName || body.isd || '',
      source: body.source || 'MagicBricks',
      name: body.name || body.responderName || '',
      email: body.email || body.responderEmail || '',
      phone: body.phone || body.responderPhone || body.mobile || '',
      city: body.city || body.City || '',
      comments: body.comments || body.msg || '',
      created_time: new Date().toISOString(),
      ...body // Include all other fields
    };

    // Append to Google Sheet
    const success = await appendLeadToSheet(lead, SPREADSHEET_ID);
    if (success) {
      res.status(200).json({ status: 'success', message: 'Success: Lead punched in the CRM' });
    } else {
      res.status(500).json({ status: 'error', message: 'Failure: Could not append lead' });
    }
  } catch (err) {
    console.error('❌ MagicBricks webhook error:', err.message);
    res.status(500).json({ status: 'error', message: 'Failure: Internal server error' });
  }
});

export default router; 