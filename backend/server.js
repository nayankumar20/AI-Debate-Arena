import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: '512kb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ai-debate-arena-api' });
});

app.use('/api', routes);

app.use((_req, _res, next) => {
  next(Object.assign(new Error('Not Found'), { statusCode: 404 }));
});

app.use(errorHandler);

await connectDB();

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
