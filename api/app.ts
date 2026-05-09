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

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
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
