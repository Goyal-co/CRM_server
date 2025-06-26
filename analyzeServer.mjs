import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import callAnalysisRoutes from './routes/callAnalysis.mjs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', callAnalysisRoutes);

const PORT = 6000;
app.listen(PORT, () => {
  console.log(`🧠 AI Call Analyzer running at http://localhost:${PORT}`);
});
