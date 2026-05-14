/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import questionsRoutes from './routes/questions.js'
import aiLogsRoutes from './routes/ai-logs.js'
import examsRoutes from './routes/exams.js'
import studentsRoutes from './routes/students.js'
import usersRoutes from './routes/users.js'
import coursesRoutes from './routes/courses.js'
import classesRoutes from './routes/classes.js'
import noticesRoutes from './routes/notices.js'
import dashboardRoutes from './routes/dashboard.js'
import configRoutes from './routes/config.js'
import knowledgeRoutes from './routes/knowledge.js'
import certificatesRoutes from './routes/certificates.js'
import faqRoutes from './routes/faq.js'
import { initDb } from './db.js'
import { initAllDimensions } from './services/dimensionService.js'
import { migrationService } from './services/migrationService.js'
import { authMiddleware } from './middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/questions', questionsRoutes)
app.use('/api/ai-logs', aiLogsRoutes)
app.use('/api/exams', examsRoutes)
app.use('/api/students', studentsRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/courses', coursesRoutes)
app.use('/api/classes', classesRoutes)
app.use('/api/notices', noticesRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/config', configRoutes)
app.use('/api/knowledge', knowledgeRoutes)
app.use('/api/certificates', certificatesRoutes)
app.use('/api/faq', faqRoutes)

// 迁移API
app.post('/api/migrate', authMiddleware, async (req: any, res) => {
  try {
    const result = await migrationService.migrateStudentProfiles();
    res.json(result);
  } catch (error) {
    console.error('[Migration] API error:', error);
    res.status(500).json({ success: false, error: 'Migration failed' });
  }
});

async function initServer() {
  try {
    await initDb();
    console.log('[Server] Database initialized');
    await initAllDimensions();
    console.log('[Server] Dimensions initialized');
  } catch (err) {
    console.error('[Server] Initialization error:', err);
  }
}
initServer();

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
