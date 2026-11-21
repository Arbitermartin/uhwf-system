// Work documents: a Word file (.docx) or a PDF. Nothing here touches the database.

export const WORK_MAX_BYTES = 10 * 1024 * 1024

export type WorkDocument = { ext: 'pdf' | 'docx' }

const has = (buf: Buffer, text: string) => buf.indexOf(Buffer.from(text, 'latin1')) !== -1

// Looks at what is really inside the file, not at its name, so a renamed program cannot pass as a document.
//  - a PDF starts with "%PDF-"
//  - a .docx is a ZIP file ("PK") that holds the parts every Word document has
// The old .doc format is not accepted: it can carry macros, and Word can save as .docx.
export function detectWorkDocument(buf: Buffer): WorkDocument | null {
    if (buf.length >= 5 && buf.subarray(0, 5).toString('latin1') === '%PDF-') return { ext: 'pdf' }

    const isZip = buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04
    // the names of the parts are written in plain text inside the ZIP
    if (isZip && has(buf, '[Content_Types].xml') && has(buf, 'word/document.xml')) return { ext: 'docx' }

    return null
}

export const workContentType = (ext: string) =>
    ext === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
