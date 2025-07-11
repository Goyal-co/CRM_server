// import express from 'express';
// import mongoose from 'mongoose';
// import Correction from '../models/Correction.js';

// const router = express.Router();

// // ✅ Define schema (optional here if already in model file)
// const correctionSchema = new mongoose.Schema({
//   project: String,
//   field: String,
//   correctedText: String,
//   markedAsWrong: { type: Boolean, default: false },
//   updatedAt: { type: Date, default: Date.now }
// });

// // ✅ Save Correction
// router.post('/save-correction', async (req, res) => {
//   try {
//     const { project, field, correctedText, markedAsWrong = false, user } = req.body;
//     if (!project || !field) {
//       return res.status(400).json({ error: 'Missing required fields' });
//     }

//     const existing = await Correction.findOne({ project, field });
//     if (existing) {
//       existing.history.push({
//         correctedText: existing.correctedText,
//         status: existing.status,
//         user: existing.user,
//         admin: existing.admin,
//         updatedAt: existing.updatedAt
//       });
//       existing.correctedText = correctedText || existing.correctedText;
//       existing.markedAsWrong = markedAsWrong;
//       existing.status = 'pending';
//       existing.user = user;
//       existing.updatedAt = new Date();
//       await existing.save();
//     } else {
//       await Correction.create({ project, field, correctedText, markedAsWrong, status: 'pending', user, history: [] });
//     }

//     res.json({ success: true });
//   } catch (err) {
//     console.error('Save correction error:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// // ✅ Get All Corrections for a Project
// router.get('/get-corrections', async (req, res) => {
//   try {
//     const { project } = req.query;
//     if (!project) return res.status(400).json({ error: 'Missing project name' });

//     const corrections = await Correction.find({ project });

//     res.json(corrections);
//   } catch (err) {
//     console.error('Fetch corrections error:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// // PATCH: Approve a correction (admin only)
// router.patch('/approve/:id', async (req, res) => {
//   try {
//     const { admin } = req.body;
//     const correction = await Correction.findById(req.params.id);
//     if (!correction) return res.status(404).json({ error: 'Not found' });
//     correction.status = 'approved';
//     correction.admin = admin;
//     correction.history.push({
//       correctedText: correction.correctedText,
//       status: 'approved',
//       user: correction.user,
//       admin,
//       updatedAt: new Date()
//     });
//     correction.updatedAt = new Date();
//     await correction.save();
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: 'Approval failed' });
//   }
// });

// // PATCH: Reject a correction (admin only)
// router.patch('/reject/:id', async (req, res) => {
//   try {
//     const { admin } = req.body;
//     const correction = await Correction.findById(req.params.id);
//     if (!correction) return res.status(404).json({ error: 'Not found' });
//     correction.status = 'rejected';
//     correction.admin = admin;
//     correction.history.push({
//       correctedText: correction.correctedText,
//       status: 'rejected',
//       user: correction.user,
//       admin,
//       updatedAt: new Date()
//     });
//     correction.updatedAt = new Date();
//     await correction.save();
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: 'Rejection failed' });
//   }
// });

// // POST: Submit feedback (thumbs up/down)
// router.post('/feedback', async (req, res) => {
//   try {
//     const { correctionId, user, value } = req.body;
//     if (!correctionId || !user || !['up','down'].includes(value)) {
//       return res.status(400).json({ error: 'Missing or invalid fields' });
//     }
//     const correction = await Correction.findById(correctionId);
//     if (!correction) return res.status(404).json({ error: 'Not found' });
//     correction.feedback.push({ user, value, timestamp: new Date() });
//     await correction.save();
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: 'Feedback failed' });
//   }
// });

// // GET: Correction history
// router.get('/history/:id', async (req, res) => {
//   try {
//     const correction = await Correction.findById(req.params.id);
//     if (!correction) return res.status(404).json({ error: 'Not found' });
//     res.json(correction.history || []);
//   } catch (err) {
//     res.status(500).json({ error: 'History fetch failed' });
//   }
// });

// // ✅ Health check route
// router.get('/', (req, res) => {
//   res.send('✅ PitchPal Corrections API is working');
// });

// // ✅ Delete Correction by ID (for Titan Brain admin control)
// router.delete('/:id', async (req, res) => {
//   try {
//     await Correction.findByIdAndDelete(req.params.id);
//     res.json({ message: 'Correction deleted' });
//   } catch (err) {
//     console.error('Delete correction error:', err);
//     res.status(500).json({ error: 'Failed to delete correction' });
//   }
// });

// export default router;
