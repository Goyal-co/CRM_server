import express from 'express';
import { appendLeadToSheet } from '../services/googleSheetsService.js';

const router = express.Router();

// Set your Google Sheet ID here (same as fbWebhook for now)
const SPREADSHEET_ID = '1KJB-28QU21Hg-IuavmkzdedxC8ycdguAgageFzYYfDo';

// Helper to normalize project names across all sources
function normalizeProjectName(projectName) {
  if (!projectName) return '';
  
  // Remove extra spaces and trim
  let normalized = projectName.trim();
  
  // Convert to title case (first letter of each word capitalized)
  normalized = normalized.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  
  // Handle specific project name mappings
  const projectMappings = {
    'RIVIERA UNO': 'Riviera Uno',
    'Riviera Uno ': 'Riviera Uno', // Remove extra space
    'ORCHID SALISBURY': 'Orchid Salisbury',
    'ORCHID PLATINUM': 'Orchid Platinum',
    'ORCHID LIFE': 'Orchid Life',
    'ORCHID BLOOMSBERRY': 'Orchid Bloomsberry'
  };
  
  return projectMappings[normalized] || normalized;
}

// POST endpoint for MagicBricks lead collection
router.post('/magicbricks/lead', async (req, res) => {
  try {
    // Extract lead data from POST body
    const body = req.body || {};
    
    // Validate required fields
    if (!body.responderName || !body.responderPhone || !body.responderEmail || !body.projectName) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Failure: Missing required fields (responderName, responderPhone, responderEmail, projectName)' 
      });
    }
    
    // Map incoming fields to a standard lead object with correct column order
    const lead = {
      leadId: `MAGICBRICKS-${Date.now()}`,
      project: normalizeProjectName(body.projectName),
      source: 'MagicBricks',
      name: body.responderName,
      email: body.responderEmail,
      phone: body.responderPhone,
      city: body.city || '', // Get city if available, otherwise leave empty
      created_time: new Date().toISOString()
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