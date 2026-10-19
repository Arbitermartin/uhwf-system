// // import 'dotenv/config'
// // import { z } from 'zod'

// // const schema = z.object({
// //   NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
// //   PORT: z.coerce.number().int().positive().default(4000),
// //   DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
// //   JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
// //   CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
// // })

// // const parsed = schema.safeParse(process.env)

// // if (!parsed.success) {
// //   console.error('Invalid environment variables:')
// //   console.error(parsed.error.flatten().fieldErrors)
// //   process.exit(1)
// // }

// // export const env = parsed.data
// // import 'dotenv/config'
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
// }

import dotenv from 'dotenv';
dotenv.config();
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
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = {
  ...parsed.data,
  // Simulated payments are on while developing and off in production, unless TEST_PAYMENTS says otherwise
  testPayments: parsed.data.TEST_PAYMENTS
    ? parsed.data.TEST_PAYMENTS === 'true'
    : parsed.data.NODE_ENV !== 'production',
  // Automatic backups are on in production, and off while developing, unless AUTO_BACKUP says otherwise
  autoBackup: parsed.data.AUTO_BACKUP
    ? parsed.data.AUTO_BACKUP === 'true'
    : parsed.data.NODE_ENV === 'production',
}
