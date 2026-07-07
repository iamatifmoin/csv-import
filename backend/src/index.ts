import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { importRouter } from './routes/import.route';

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  }),
);

app.use(express.json());
app.use('/api', importRouter);

app.listen(PORT, () => {
  console.log(`✅ GrowEasy backend running on http://localhost:${PORT}`);
});

export default app;
