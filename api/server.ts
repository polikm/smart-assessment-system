import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db.js';
import { seedData } from './seed.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import studentRoutes from './routes/students.js';
import questionRoutes from './routes/questions.js';
import examRoutes from './routes/exams.js';
import classRoutes from './routes/classes.js';
import noticeRoutes from './routes/notices.js';
import configRoutes from './routes/config.js';
import dashboardRoutes from './routes/dashboard.js';
import courseRoutes from './routes/courses.js';
import aiLogRoutes from './routes/ai-logs.js';

// Load environment variables from .env file
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

// Debug: log if JWT_SECRET is loaded
if (!process.env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET not found in .env file, checking environment...');
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/config', configRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/ai-logs', aiLogRoutes);

async function startServer() {
  await initDb();

  // seedData 失败不应阻止服务器启动
  try {
    await seedData();
  } catch (error: any) {
    console.error('Seed data failed:', error.message);
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});

export default app;
