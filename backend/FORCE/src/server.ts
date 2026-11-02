// import { app } from './app'
// import { env } from './config'
// import { prisma } from './prisma'

// const server = app.listen(env.PORT, () => {
//   console.log(`UHWF API running on http://localhost:${env.PORT} (${env.NODE_ENV})`)
// })

// const shutdown = async () => {
//   server.close()
//   await prisma.$disconnect()
//   process.exit(0)
// }

// process.on('SIGINT', shutdown)
// process.on('SIGTERM', shutdown)
import { app } from './app'
import { env } from './config'
import { prisma } from './prisma'
import { startBackupScheduler } from './services/backup'

const server = app.listen(env.PORT, () => {
  console.log(`UHWF API running on http://localhost:${env.PORT} (${env.NODE_ENV})`)
  startBackupScheduler()
})

const shutdown = async () => {
  server.close()
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
