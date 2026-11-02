import { randomBytes } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

// Uploaded documents live here, outside any public folder. They are only ever served
// through an administrator-only route.
export const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads')
export const MAX_FILE_BYTES = 5 * 1024 * 1024

export type DetectedFile = { ext: 'pdf' | 'jpg' | 'png' }

// Looks at the first bytes of the file, so a renamed .exe cannot pass as a PDF.
export function detectFileType(buf: Buffer): DetectedFile | null {
    if (buf.length >= 5 && buf.subarray(0, 5).toString('latin1') === '%PDF-') return { ext: 'pdf' }
    if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: 'jpg' }
    if (
        buf.length >= 8 &&
        buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ) {
        return { ext: 'png' }
    }
    return null
}

// Turns a stored relative path into a full path, and refuses anything outside UPLOAD_ROOT.
export function resolveUpload(rel: string) {
    const abs = path.resolve(UPLOAD_ROOT, rel)
    if (!abs.startsWith(UPLOAD_ROOT + path.sep)) throw new Error('Invalid file path')
    return abs
}

// The stored name is generated here. The name the user chose is never used as a path.
export async function saveUpload(subdir: string, prefix: string, buf: Buffer, ext: string) {
    const name = `${prefix}-${randomBytes(8).toString('hex')}.${ext}`
    const rel = path.posix.join(subdir, name)
    const abs = resolveUpload(rel)
    await fs.mkdir(path.dirname(abs), { recursive: true })
    await fs.writeFile(abs, buf, { flag: 'wx' })
    return rel
}

export async function removeUpload(rel: string) {
    try {
        await fs.rm(resolveUpload(rel), { force: true })
    } catch {
        /* nothing to delete */
    }
}

// A safe version of the user's file name, for showing and for the download header
export const cleanFileName = (name: string) => name.replace(/[^\w.\- ]+/g, '_').slice(0, 100) || 'document'
