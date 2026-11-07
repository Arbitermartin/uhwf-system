// // // import 'dotenv/config'
// // // import { z } from 'zod'

// // // const schema = z.object({
// // //   NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
// // //   PORT: z.coerce.number().int().positive().default(4000),
// // //   DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
// // //   JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
// // //   CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
// // // })

// // // const parsed = schema.safeParse(process.env)

// // // if (!parsed.success) {
// // //   console.error('Invalid environment variables:')
// // //   console.error(parsed.error.flatten().fieldErrors)
// // //   process.exit(1)
// // // }

// // // export const env = parsed.data
// // // import 'dotenv/config'
// // import dotenv from 'dotenv';
// // dotenv.config();
// // import { z } from 'zod'

// // const schema = z.object({
// //   NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
// //   PORT: z.coerce.number().int().positive().default(4000),
// //   DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
// //   JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
// //   CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
// //   // true = a student's "Pay now" is simulated and marked paid at once (development only)
// //   TEST_PAYMENTS: z.enum(['true', 'false']).optional(),
// // })

// // const parsed = schema.safeParse(process.env)

// // if (!parsed.success) {
// //   console.error('Invalid environment variables:')
// //   console.error(parsed.error.flatten().fieldErrors)
// //   process.exit(1)
// // }

// // export const env = {
// //   ...parsed.data,
// //   // Simulated payments are on while developing and off in production, unless TEST_PAYMENTS says otherwise
// //   testPayments: parsed.data.TEST_PAYMENTS
// //     ? parsed.data.TEST_PAYMENTS === 'true'
// //     : parsed.data.NODE_ENV !== 'production',
// // }

// import dotenv from 'dotenv';
// dotenv.config();
// import { z } from 'zod'

// const schema = z.object({
//   NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
//   PORT: z.coerce.number().int().positive().default(4000),
//   DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
//   JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
//   CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
//   // true = a student's "Pay now" is simulated and marked paid at once (development only)
//   TEST_PAYMENTS: z.enum(['true', 'false']).optional(),
//   // Full path of pg_dump if it is not on the PATH, for example
//   // C:\Program Files\PostgreSQL\17\bin\pg_dump.exe
//   PG_DUMP_PATH: z.string().min(1).default('pg_dump'),
//   // true = a database backup is made every day at 02:00 (Tanzania time)
//   AUTO_BACKUP: z.enum(['true', 'false']).optional(),
// })

// const parsed = schema.safeParse(process.env)

// if (!parsed.success) {
//   console.error('Invalid environment variables:')
//   console.error(parsed.error.flatten().fieldErrors)
//   process.exit(1)
// }

// export const env = {
//   ...parsed.data,
//   // Simulated payments are on while developing and off in production, unless TEST_PAYMENTS says otherwise
//   testPayments: parsed.data.TEST_PAYMENTS
//     ? parsed.data.TEST_PAYMENTS === 'true'
//     : parsed.data.NODE_ENV !== 'production',
//   // Automatic backups are on in production, and off while developing, unless AUTO_BACKUP says otherwise
//   autoBackup: parsed.data.AUTO_BACKUP
//     ? parsed.data.AUTO_BACKUP === 'true'
//     : parsed.data.NODE_ENV === 'production',
// }

import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  // true = a student's "Pay now" is simulated and marked paid at once (development only)
  TEST_PAYMENTS: z.enum(['true', 'false']).optional(),
  // Full path of pg_dump if it is not on the PATH, for example
  // C:\Program Files\PostgreSQL\17\bin\pg_dump.exe
  PG_DUMP_PATH: z.string().min(1).default('pg_dump'),
  // true = a database backup is made every day at 02:00 (Tanzania time)
  AUTO_BACKUP: z.enum(['true', 'false']).optional(),
  // Email (SMTP). Works with a Gmail app password, SendGrid, or any mail server.
  // Leave SMTP_HOST empty to run without email.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.preprocess((v) => (v === '' ? undefined : v), z.coerce.number().int().positive().default(587)),
  SMTP_SECURE: z.enum(['true', 'false']).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().optional(),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

const smtpHost = (parsed.data.SMTP_HOST ?? '').trim()
const smtpUser = (parsed.data.SMTP_USER ?? '').trim()

export const env = {
  ...parsed.data,
  mail: {
    configured: smtpHost !== '',
    host: smtpHost,
    port: parsed.data.SMTP_PORT,
    // port 465 uses a secure connection from the start, port 587 upgrades it (STARTTLS)
    secure: parsed.data.SMTP_SECURE ? parsed.data.SMTP_SECURE === 'true' : parsed.data.SMTP_PORT === 465,
    user: smtpUser,
    pass: parsed.data.SMTP_PASS ?? '',
    from:
      (parsed.data.MAIL_FROM ?? '').trim() ||
      (smtpUser.includes('@') ? `UHWF Tanzania <${smtpUser}>` : 'UHWF Tanzania <no-reply@uhwf.or.tz>'),
  },
  // Simulated payments are on while developing and off in production, unless TEST_PAYMENTS says otherwise
  testPayments: parsed.data.TEST_PAYMENTS
    ? parsed.data.TEST_PAYMENTS === 'true'
    : parsed.data.NODE_ENV !== 'production',
  // Automatic backups are on in production, and off while developing, unless AUTO_BACKUP says otherwise
  autoBackup: parsed.data.AUTO_BACKUP
    ? parsed.data.AUTO_BACKUP === 'true'
    : parsed.data.NODE_ENV === 'production',
}
