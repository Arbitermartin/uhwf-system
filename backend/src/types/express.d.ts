import type { Role } from '@prisma/client'

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; fullName: string; email: string; role: Role }
    }
  }
}

export {}
