import { randomInt } from 'node:crypto'
import { z } from 'zod'

// Rules for a password a person chooses. bcrypt only reads the first 72 bytes.
export const newPasswordSchema = z
    .string()
    .min(8, 'Use at least 8 characters.')
    .max(72, 'Password is too long (72 characters at most).')
    .regex(/[A-Za-z]/, 'Password must contain a letter.')
    .regex(/\d/, 'Password must contain a number.')

// 12 characters with upper case, lower case and digits. Look-alike characters (0 O 1 l I) are left out.
export const generateTemporaryPassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const lower = 'abcdefghijkmnopqrstuvwxyz'
    const digits = '23456789'
    const all = upper + lower + digits
    const pick = (set: string) => set[randomInt(set.length)]

    const chars = [pick(upper), pick(lower), pick(digits)]
    while (chars.length < 12) chars.push(pick(all))

    for (let i = chars.length - 1; i > 0; i--) {
        const j = randomInt(i + 1)
        const tmp = chars[i]
        chars[i] = chars[j]
        chars[j] = tmp
    }
    return chars.join('')
}