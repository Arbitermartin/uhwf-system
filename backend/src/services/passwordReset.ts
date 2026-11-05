import { createHash, randomBytes } from 'node:crypto'
import { env } from '../config'

export const RESET_VALID_MINUTES = 60
export const RESET_COOLDOWN_MINUTES = 2

// The secret in the email link: 32 random bytes as 64 hex characters.
export const generateToken = () => randomBytes(32).toString('hex')

// The database only ever holds this hash. Someone who could read the database
// could not turn it back into a working link.
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

const escapeHtml = (v: string) =>
    v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

export const resetLink = (token: string) => `${env.CLIENT_ORIGIN.replace(/\/$/, '')}/reset-password?token=${token}`

export function resetEmail(name: string, link: string) {
    const text = `Hello ${name},

We received a request to reset the password of your UHWF account.

Open this link to choose a new password. It works for ${RESET_VALID_MINUTES} minutes and only once:
${link}

If you did not ask for this, you can ignore this email. Your password will not change.

UHWF Tanzania`

    const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1f2d1f">
<h2 style="color:#0b3d1e">Reset your password</h2>
<p>Hello ${escapeHtml(name)},</p>
<p>We received a request to reset the password of your UHWF account.</p>
<p><a href="${link}" style="display:inline-block;background:#f5b800;color:#0b3d1e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Choose a new password</a></p>
<p style="font-size:13px;color:#555">The link works for ${RESET_VALID_MINUTES} minutes and only once. If the button does not work, copy this address into your browser:<br>${escapeHtml(link)}</p>
<p style="font-size:13px;color:#555">If you did not ask for this, you can ignore this email. Your password will not change.</p>
<p style="font-size:13px;color:#555">UHWF Tanzania</p></div>`

    return { subject: 'Reset your UHWF password', text, html }
}

export function passwordChangedEmail(name: string) {
    const text = `Hello ${name},

The password of your UHWF account was just changed.

If this was you, there is nothing more to do. If it was not you, contact us at helpdesk@uhwf.or.tz right away.

UHWF Tanzania`

    const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1f2d1f">
<h2 style="color:#0b3d1e">Your password was changed</h2>
<p>Hello ${escapeHtml(name)},</p>
<p>The password of your UHWF account was just changed.</p>
<p>If this was you, there is nothing more to do. If it was not you, contact us at <a href="mailto:helpdesk@uhwf.or.tz">helpdesk@uhwf.or.tz</a> right away.</p>
<p style="font-size:13px;color:#555">UHWF Tanzania</p></div>`

    return { subject: 'Your UHWF password was changed', text, html }
}
