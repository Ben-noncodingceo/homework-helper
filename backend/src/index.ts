import express from 'express';
import cors from 'cors';
import path from 'path';
import configRouter from './routes/config';
import homeworkRouter from './routes/homework';
import subjectsRouter from './routes/subjects';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/config', configRouter);
app.use('/api/homework', homeworkRouter);
app.use('/api/subjects', subjectsRouter);

// Serve built frontend in production
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));
app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
