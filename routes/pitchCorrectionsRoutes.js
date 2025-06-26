import express from 'express';
import mongoose from 'mongoose';
import Correction from '../models/Correction.js';

const router = express.Router();

// ✅ Define schema (optional here if already in model file)
const correctionSchema = new mongoose.Schema({
  project: String,
  field: String,
  correctedText: String,
  markedAsWrong: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
});

// ✅ Save Correction
router.post('/save-correction', async (req, res) => {
  try {
    const { project, field, correctedText, markedAsWrong = false } = req.body;
    if (!project || !field) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await Correction.findOne({ project, field });
    if (existing) {
      existing.correctedText = correctedText || existing.correctedText;
      existing.markedAsWrong = markedAsWrong;
      existing.updatedAt = new Date();
      await existing.save();
    } else {
      await Correction.create({ project, field, correctedText, markedAsWrong });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Save correction error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Get All Corrections for a Project
router.get('/get-corrections', async (req, res) => {
  try {
    const { project } = req.query;
    if (!project) return res.status(400).json({ error: 'Missing project name' });

    const corrections = await Correction.find({ project });

    res.json(corrections);
  } catch (err) {
    console.error('Fetch corrections error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Health check route
router.get('/', (req, res) => {
  res.send('✅ PitchPal Corrections API is working');
});

// ✅ Delete Correction by ID (for Titan Brain admin control)
router.delete('/:id', async (req, res) => {
  try {
    await Correction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Correction deleted' });
  } catch (err) {
    console.error('Delete correction error:', err);
    res.status(500).json({ error: 'Failed to delete correction' });
  }
});

export default router;
