import express from 'express';
import Lead from '../models/Lead.js';
import getNextAssignee from '../utils/team.js';

const router = express.Router();

// ✅ Add new lead
router.post('/add', async (req, res) => {
  try {
    const newLead = new Lead({
      ...req.body,
      assignedTo: getNextAssignee()
    });
    await newLead.save();

    res.status(201).json({
      message: "Lead saved successfully",
      assignedTo: newLead.assignedTo,
      id: newLead._id
    });
  } catch (error) {
    console.error("Error saving lead:", error);
    res.status(500).json({ message: "Failed to save lead" });
  }
});

// ✅ Update call time for lead
router.put('/:id/call', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    const now = new Date();
    const delayInMinutes = (now - lead.assignedAt) / (1000 * 60);

    lead.callTime = now;
    lead.callDelayed = delayInMinutes > 10;

    await lead.save();
    res.json({
      message: 'Call time recorded',
      delay: lead.callDelayed ? `${delayInMinutes.toFixed(2)} mins (Delayed)` : 'On time'
    });
  } catch (error) {
    console.error("Call update error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Get leads (with optional filters)
router.get('/', async (req, res) => {
  try {
    const query = {};

    if (req.query.assignedTo) query.assignedTo = req.query.assignedTo;
    if (req.query.callDelayed === 'true') query.callDelayed = true;
    if (req.query.callDelayed === 'false') query.callDelayed = false;
    if (req.query.source) query.source = req.query.source;
    if (req.query.project) query.project = req.query.project;

    const leads = await Lead.find(query).sort({ createdAt: -1 });
    res.json(leads);
  } catch (error) {
    console.error("Fetch leads error:", error);
    res.status(500).json({ message: "Server error fetching leads" });
  }
});

export default router;
