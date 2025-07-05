import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

const GOOGLE_SCRIPT_BASE = 'https://script.google.com/macros/s/AKfycbznX9Q-zsf-Trlal1aBSn4WPngHIOeBAycoI8XrmzKUq85aNQ-Mwk0scn86ty-4gsjA/exec';

router.get('/team-status', async (req, res) => {
  try {
    const url = `${GOOGLE_SCRIPT_BASE}?action=getTeamStatus`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch team status' });
  }
});

router.get('/admin-stats', async (req, res) => {
  try {
    const params = new URLSearchParams(req.query).toString();
    const url = `${GOOGLE_SCRIPT_BASE}?action=getAdminStats&${params}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

export default router; 