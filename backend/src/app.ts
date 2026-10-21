// // // // import express from 'express'
// // // // import cors from 'cors'
// // // // import helmet from 'helmet'
// // // // import cookieParser from 'cookie-parser'
// // // // import { env } from './config'
// // // // import { prisma } from './prisma'
// // // // import { errorHandler } from './middleware/error'
// // // // import authRoutes from './routes/auth'
// // // // import admissionRoutes from './routes/admission'
// // // // import userRoutes from './routes/users'
// // // // import departmentRoutes from './routes/departments'

// // // // export const app = express()

// // // // app.disable('x-powered-by')
// // // // app.use(helmet())
// // // // app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }))
// // // // app.use(express.json({ limit: '100kb' }))
// // // // app.use(cookieParser())

// // // // app.get('/api/health', async (_req, res) => {
// // // //   try {
// // // //     await prisma.$queryRaw`SELECT 1`
// // // //     res.json({ status: 'ok', database: 'connected' })
// // // //   } catch {
// // // //     res.status(503).json({ status: 'error', database: 'unreachable' })
// // // //   }
// // // // })

// // // // app.use('/api/auth', authRoutes)
// // // // app.use('/api/admission', admissionRoutes)
// // // // app.use('/api/users', userRoutes)
// // // // app.use('/api/departments', departmentRoutes)

// // // // app.use('/api', (_req, res) => {
// // // //   res.status(404).json({ message: 'Not found.' })
// // // // })

// // // // app.use(errorHandler)

// // // import express from 'express'
// // // import cors from 'cors'
// // // import helmet from 'helmet'
// // // import cookieParser from 'cookie-parser'
// // // import { env } from './config'
// // // import { prisma } from './prisma'
// // // import { errorHandler } from './middleware/error'
// // // import authRoutes from './routes/auth'
// // // import admissionRoutes from './routes/admission'
// // // import userRoutes from './routes/users'
// // // import departmentRoutes from './routes/departments'
// // // import applicationRoutes from './routes/application'
// // // import applicationsRoutes from './routes/applications'

// // // export const app = express()

// // // app.disable('x-powered-by')
// // // app.use(helmet())
// // // app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }))
// // // app.use(express.json({ limit: '100kb' }))
// // // app.use(cookieParser())

// // // app.get('/api/health', async (_req, res) => {
// // //   try {
// // //     await prisma.$queryRaw`SELECT 1`
// // //     res.json({ status: 'ok', database: 'connected' })
// // //   } catch {
// // //     res.status(503).json({ status: 'error', database: 'unreachable' })
// // //   }
// // // })

// // // app.use('/api/auth', authRoutes)
// // // app.use('/api/admission', admissionRoutes)
// // // app.use('/api/users', userRoutes)
// // // app.use('/api/departments', departmentRoutes)
// // // app.use('/api/application', applicationRoutes)
// // // app.use('/api/applications', applicationsRoutes)

// // // app.use('/api', (_req, res) => {
// // //   res.status(404).json({ message: 'Not found.' })
// // // })

// // // app.use(errorHandler)
// // import express from 'express'
// // import cors from 'cors'
// // import helmet from 'helmet'
// // import cookieParser from 'cookie-parser'
// // import { env } from './config'
// // import { prisma } from './prisma'
// // import { errorHandler } from './middleware/error'
// // import authRoutes from './routes/auth'
// // import admissionRoutes from './routes/admission'
// // import userRoutes from './routes/users'
// // import departmentRoutes from './routes/departments'
// // import applicationRoutes from './routes/application'
// // import applicationsRoutes from './routes/applications'
// // import adminDashboardRoutes from './routes/adminDashboard'
// // import notificationRoutes from './routes/notifications'

// // export const app = express()

// // app.disable('x-powered-by')
// // app.use(helmet())
// // app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }))
// // app.use(express.json({ limit: '100kb' }))
// // app.use(cookieParser())

// // app.get('/api/health', async (_req, res) => {
// //   try {
// //     await prisma.$queryRaw`SELECT 1`
// //     res.json({ status: 'ok', database: 'connected' })
// //   } catch {
// //     res.status(503).json({ status: 'error', database: 'unreachable' })
// //   }
// // })

// // app.use('/api/auth', authRoutes)
// // app.use('/api/admission', admissionRoutes)
// // app.use('/api/users', userRoutes)
// // app.use('/api/departments', departmentRoutes)
// // app.use('/api/application', applicationRoutes)
// // app.use('/api/applications', applicationsRoutes)
// // app.use('/api/admin/dashboard', adminDashboardRoutes)
// // app.use('/api/notifications', notificationRoutes)

// // app.use('/api', (_req, res) => {
// //   res.status(404).json({ message: 'Not found.' })
// // })

// // app.use(errorHandler)

// import express from 'express'
// import cors from 'cors'
// import helmet from 'helmet'
// import cookieParser from 'cookie-parser'
// import { env } from './config'
// import { prisma } from './prisma'
// import { errorHandler } from './middleware/error'
// import authRoutes from './routes/auth'
// import admissionRoutes from './routes/admission'
// import userRoutes from './routes/users'
// import departmentRoutes from './routes/departments'
// import applicationRoutes from './routes/application'
// import applicationsRoutes from './routes/applications'
// import adminDashboardRoutes from './routes/adminDashboard'
// import notificationRoutes from './routes/notifications'
// import ticketRoutes from './routes/tickets'
// import ictRoutes from './routes/ict'
// import maintenanceRoutes from './routes/maintenance'

// export const app = express()

// app.disable('x-powered-by')
// app.use(helmet())
// app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }))
// app.use(express.json({ limit: '100kb' }))
// app.use(cookieParser())

// app.get('/api/health', async (_req, res) => {
//   try {
//     await prisma.$queryRaw`SELECT 1`
//     res.json({ status: 'ok', database: 'connected' })
//   } catch {
//     res.status(503).json({ status: 'error', database: 'unreachable' })
//   }
// })

// app.use('/api/auth', authRoutes)
// app.use('/api/admission', admissionRoutes)
// app.use('/api/users', userRoutes)
// app.use('/api/departments', departmentRoutes)
// app.use('/api/application', applicationRoutes)
// app.use('/api/applications', applicationsRoutes)
// app.use('/api/admin/dashboard', adminDashboardRoutes)
// app.use('/api/notifications', notificationRoutes)
// app.use('/api/tickets', ticketRoutes)
// app.use('/api/ict', ictRoutes)
// app.use('/api/maintenance', maintenanceRoutes)

// app.use('/api', (_req, res) => {
//   res.status(404).json({ message: 'Not found.' })
// })

// app.use(errorHandler)

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

export const app = express()

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }))
app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())

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

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'Not found.' })
})

app.use(errorHandler)
