// import dotenv from 'dotenv';
// dotenv.config(); // 🔐 Load .env variables before anything else

// import express from 'express';  
// import mongoose from 'mongoose';
// import cors from 'cors';
// import path from 'path';
// import { fileURLToPath } from 'url';

// // ✅ Import CJS-compatible routes
// import leadRoutes from './routes/leadRoutes.js';
// import pitchRoutes from './routes/pitchRoutes.js';
// import pitchCorrectionsRoutes from './routes/pitchCorrectionsRoutes.js';
// import pitchAdminRoutes from './routes/pitchAdminRoutes.js';
// import mcubeRoutes from './routes/mcubeRoutes.js';
// import fbWebhookRoutes from './routes/fbWebhook.js';
// import twilioRoutes from './routes/twilioRoutes.js';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();

// // ✅ Middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: false })); // 👈 Required for Twilio webhook

// app.use(cors());

// // ✅ Static file serving (for mp3 playback)
// app.use('/recordings', express.static(path.join(__dirname, 'recordings')));

// // ✅ Register primary API routes
// app.use('/api/leads', leadRoutes);
// app.use('/api', pitchRoutes);
// app.use('/api/pitch-corrections', pitchCorrectionsRoutes);
// app.use('/api/admin', pitchAdminRoutes);
// app.use('/api', mcubeRoutes);
// app.use('/webhook', fbWebhookRoutes);
// app.use('/api/twilio', twilioRoutes); // ✅ Twilio call flow routes

// // ✅ Health Check
// app.get('/', (req, res) => {
//   res.send('🚀 CRM Backend is running successfully!');
// });

// // ✅ Connect to MongoDB and dynamically import ESM routes
// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(async () => {
//   console.log('✅ Connected to MongoDB');

//   // ✅ Dynamically load ESM call analysis route
//   const { default: callAnalysisRoutes } = await import('./routes/callAnalysisRoutes.mjs');
//   app.use('/api', callAnalysisRoutes); // includes /call-analysis & /test-insert-call

//   const PORT = process.env.PORT || 5000;
//   app.listen(PORT, () => {
//     console.log(`🚀 Server is running on http://localhost:${PORT}`);
//   });
// })
// .catch((err) => {
//   console.error('❌ MongoDB connection error:', err);
// });



import dotenv from 'dotenv';
dotenv.config(); // 🔐 Load .env variables

import express from 'express';  
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path'; // ✅ Corrected import: Use built-in Node.js path module
import { fileURLToPath } from 'url';
import adminStatsRoutes from './routes/adminStatsRoutes.js';

// ✅ Import CJS-compatible routes
import leadRoutes from './routes/leadRoutes.js';
import pitchRoutes from './routes/pitchRoutes.js';
import pitchCorrectionsRoutes from './routes/pitchCorrectionsRoutes.js';
import pitchAdminRoutes from './routes/pitchAdminRoutes.js';
import mcubeRoutes from './routes/mcubeRoutes.js';
import fbWebhookRoutes from './routes/fbWebhook.js';
// import twilioRoutes from './routes/twilioRoutes.js'; // ❌ Commented out: Replaced Twilio with MCUBE

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ Validate environment variables (MCUBE only)
const requiredEnvVars = ['MONGO_URI', 'MCUBE_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length) {
  console.error(`❌ Error: Missing environment variables: ${missingEnvVars.join(', ')}. Please update .env file.`);
  process.exit(1);
}

// Warn about missing callback URL for local development
if (!process.env.MCUBE_CALLBACK_URL) {
  console.warn('⚠️  Warning: MCUBE_CALLBACK_URL not set. Callbacks will not work without a public URL (ngrok/deployment).');
}

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // Required for webhooks

// Allow CORS for all origins
app.use(cors());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ✅ Static file serving (for mp3 playback)
app.use('/recordings', express.static(path.join(__dirname, 'recordings')));

// ✅ Register primary API routes
app.use('/api/leads', leadRoutes);
app.use('/api', pitchRoutes);
app.use('/api/pitch-corrections', pitchCorrectionsRoutes);
app.use('/api/admin', pitchAdminRoutes);
app.use('/api', mcubeRoutes);
app.use('/api', fbWebhookRoutes); // This includes /api/fb-webhook and /api/test-webhook
app.use('/api/admin', adminStatsRoutes);
// app.use('/api/twilio', twilioRoutes); // ❌ Commented out: Replaced Twilio with MCUBE

// ✅ Health Check
app.get('/', (req, res) => {
  res.send('🚀 CRM Backend is running successfully!');
});

// ✅ Debug: List all registered routes
app.get('/api/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  res.json({ routes });
});

// ✅ Connect to MongoDB and dynamically import ESM routes
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ Connected to MongoDB');

  // ✅ Dynamically load ESM call analysis route
  const { default: callAnalysisRoutes } = await import('./routes/callAnalysisRoutes.mjs');
  app.use('/api', callAnalysisRoutes); // includes /call-analysis & /test-insert-call

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});