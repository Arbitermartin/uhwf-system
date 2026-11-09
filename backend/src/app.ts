
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { env } from './config'
import { prisma } from './prisma'
import { errorHandler } from './middleware/error'
import authRoutes from './routes/auth'
import admissionRoutes from './routes/admission'
import userRoutes from './routes/users'
import departmentRoutes from './routes/departments'
import applicationRoutes from './routes/application'
import applicationsRoutes from './routes/applications'
import adminDashboardRoutes from './routes/adminDashboard'
import notificationRoutes from './routes/notifications'
import ticketRoutes from './routes/tickets'
import ictRoutes from './routes/ict'
import maintenanceRoutes from './routes/maintenance'
import adminSettingsRoutes from './routes/adminSettings'
import courseRoutes from './routes/courses'
import contactRoutes from './routes/contact'
import messageRoutes from './routes/messages'
import profileRoutes from './routes/profile'
import photoRoutes from './routes/photos'
import lecturerRoutes from './routes/lecturer'
import studentRoutes from './routes/student'
import adminNewsRoutes from './routes/adminNews'
import adminEventsRoutes from './routes/adminEvents'
import publicContentRoutes from './routes/publicContent'
import innovationsRoutes from './routes/innovations'
import innovationReviewRoutes from './routes/innovationReview'
import adminEnrollmentsRoutes from './routes/adminEnrollments'
import ictAccountsRoutes from './routes/ictAccounts'
import adminJobsRoutes from './routes/adminJobs'
import publicJobsRoutes from './routes/publicJobs'
import memberRoutes from './routes/members'

export const app = express()

app.disable('x-powered-by')

// NEW: the host puts a proxy in front of Node. Without this, Express thinks every request is
// plain http, so secure login cookies can be dropped and rate limits see one shared address.
app.set('trust proxy', 1)

app.use(helmet())
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // NEW
    allowedHeaders: ['Content-Type', 'X-HTTP-Method-Override'], // NEW
  }),
)
app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())

// private responses must never be cached or shared with other users.  
app.set('etag', false)
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'private, no-store, no-cache, must-revalidate')
  res.set('Pragma', 'no-cache')
  res.set('Expires', '0')
  res.set('Vary', 'Cookie')
  next()

})

// NEW: some hosts block PATCH, PUT and DELETE. The website sends them as POST with this header,
// and here they are turned back into the real method before any route runs.
app.use((req, _res, next) => {
  const wanted = req.headers['x-http-method-override']
  if (req.method === 'POST' && typeof wanted === 'string') {
    const method = wanted.toUpperCase()
    if (method === 'PUT' || method === 'PATCH' || method === 'DELETE') req.method = method
  }
  next()
})

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', database: 'connected' })
  } catch {
    res.status(503).json({ status: 'error', database: 'unreachable' })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/admission', admissionRoutes)
app.use('/api/users', userRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/application', applicationRoutes)
app.use('/api/applications', applicationsRoutes)
app.use('/api/admin/dashboard', adminDashboardRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/ict', ictRoutes)
app.use('/api/maintenance', maintenanceRoutes)
app.use('/api/admin/settings', adminSettingsRoutes)
app.use('/api/admin/courses', courseRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/admin/messages', messageRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/photos', photoRoutes)
app.use('/api/lecturer', lecturerRoutes)
app.use('/api/student', studentRoutes)
app.use('/api/admin/news', adminNewsRoutes)
app.use('/api/admin/events', adminEventsRoutes)
app.use('/api/public', publicContentRoutes)
app.use('/api/public/innovations', innovationsRoutes)
app.use('/api/innovations', innovationReviewRoutes)
app.use('/api/admin/enrollments', adminEnrollmentsRoutes)
app.use('/api/ict/accounts', ictAccountsRoutes)
app.use('/api/admin/jobs', adminJobsRoutes)
app.use('/api/public/jobs', publicJobsRoutes)
app.use('/api/members', memberRoutes)

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'Not found.' })
})

app.use(errorHandler)