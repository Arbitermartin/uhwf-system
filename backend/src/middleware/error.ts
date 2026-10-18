// import type { ErrorRequestHandler } from 'express'
// import { Prisma } from '@prisma/client'
// import { ZodError } from 'zod'

// export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
//   if (err instanceof ZodError) {
//     const errors: Record<string, string> = {}
//     for (const issue of err.issues) {
//       const key = String(issue.path[0] ?? 'form')
//       if (!errors[key]) errors[key] = issue.message
//     }
//     res.status(400).json({ message: err.issues[0]?.message ?? 'Invalid data.', errors })
//     return
//   }

//   if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
//     res.status(409).json({ message: 'That record already exists.' })
//     return
//   }

//   if (err && typeof err === 'object' && 'type' in err && err.type === 'entity.parse.failed') {
//     res.status(400).json({ message: 'Invalid request body.' })
//     return
//   }

//   console.error(err)
//   res.status(500).json({ message: 'Something went wrong. Please try again.' })
// }

import type { ErrorRequestHandler } from 'express'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import { HttpError } from '../utils/httpError'

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message })
    return
  }

  // File upload problems (multer)
  if (err && typeof err === 'object' && 'name' in err && err.name === 'MulterError') {
    const code = 'code' in err ? err.code : ''
    res.status(400).json({
      message: code === 'LIMIT_FILE_SIZE' ? 'The file is larger than 5 MB.' : 'The file could not be uploaded.',
    })
    return
  }

  if (err instanceof ZodError) {
    const errors: Record<string, string> = {}
    for (const issue of err.issues) {
      const key = String(issue.path[0] ?? 'form')
      if (!errors[key]) errors[key] = issue.message
    }
    res.status(400).json({ message: err.issues[0]?.message ?? 'Invalid data.', errors })
    return
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    res.status(409).json({ message: 'That record already exists.' })
    return
  }

  if (err && typeof err === 'object' && 'type' in err && err.type === 'entity.parse.failed') {
    res.status(400).json({ message: 'Invalid request body.' })
    return
  }

  console.error(err)
  res.status(500).json({ message: 'Something went wrong. Please try again.' })
}
