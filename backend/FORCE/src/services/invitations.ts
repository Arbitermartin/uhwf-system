import { z } from 'zod'
import { RESET_VALID_MINUTES } from './passwordReset'

// Rules for inviting staff. Nothing here touches the database, so it can be tested alone.

export const INVITE_ROLES = ['lecturer', 'employee', 'ict', 'admin'] as const
export type InviteRole = (typeof INVITE_ROLES)[number]

export const inviteRoleLabel: Record<InviteRole, string> = {
    lecturer: 'Lecturer',
    employee: 'Employee',
    ict: 'ICT Officer',
    admin: 'Administrator',
}

const PHONE = /^[+\d\s-]{9,16}$/

const base = z.object({
    fullName: z.string().trim().min(2, 'Enter the full name.').max(100, 'Name is too long.'),
    email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(254),
    phone: z
        .string()
        .trim()
        .regex(PHONE, 'Enter a valid phone number.')
        .or(z.literal(''))
        .transform((v) => v || null),
    gender: z
        .enum(['female', 'male'])
        .or(z.literal(''))
        .transform((v) => v || null),
})

const staffId = z.string().trim().min(3, 'Staff ID is too short.').max(40)
const departmentId = z.coerce
    .number({ invalid_type_error: 'Choose a department.' })
    .int('Choose a department.')
    .positive('Choose a department.')

// There is no password here. The person chooses their own through the link in the email.
export const inviteSchema = z.discriminatedUnion('role', [
    base.extend({
        role: z.literal('lecturer'),
        staffId,
        departmentId,
        qualification: z.string().trim().max(100).default(''),
    }),
    base.extend({
        role: z.literal('employee'),
        staffId,
        departmentId,
        position: z.string().trim().min(2, 'Position is too short.').max(100),
    }),
    base.extend({ role: z.literal('ict') }),
    base.extend({ role: z.literal('admin') }),
])

const escapeHtml = (v: string) =>
    v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

export type InvitationDetails = {
    name: string
    email: string
    role: string // the label, for example "ICT Officer"
    department: string | null
    position: string | null
    link: string
}

// The email a new staff member receives. The password is never in it: only a link that works once.
export function invitationEmail(d: InvitationDetails) {
    const first = d.name.split(' ')[0] || d.name
    const roleText = d.position ? `${d.role} (${d.position})` : d.role

    const rows: [string, string][] = [
        ['Name', d.name],
        ['Email', d.email],
        ...(d.department ? ([['Department', d.department]] as [string, string][]) : []),
        ['Role', roleText],
        ['Account status', 'Pending activation'],
    ]

    const text = `UHWF Tanzania - Account Invitation

Dear ${first},

Your account has been created successfully in the Universal Human-Wildlife Foundation (UHWF) Management System.

Account information
${rows.map(([k, v]) => `* ${k}: ${v}`).join('\n')}

To activate your account and create your own password, open the secure link below:
${d.link}

This link expires after ${RESET_VALID_MINUTES} minutes and can only be used once.

If you did not expect this invitation, please contact UHWF Administration.

Regards,
UHWF Tanzania Administration
Automated notification - please do not reply.`

    const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1f2d1f">
<h2 style="color:#0b3d1e;margin-bottom:4px">UHWF Tanzania</h2>
<p style="margin-top:0;color:#555">Account Invitation</p>
<p>Dear ${escapeHtml(first)},</p>
<p>Your account has been created successfully in the Universal Human-Wildlife Foundation (UHWF) Management System.</p>
<table style="width:100%;border-collapse:collapse;background:#f0f7f1;border-radius:8px;margin:16px 0">
${rows
            .map(
                ([k, v]) =>
                    `<tr><td style="padding:8px 14px;color:#555;width:38%">${escapeHtml(k)}</td><td style="padding:8px 14px"><strong>${escapeHtml(v)}</strong></td></tr>`,
            )
            .join('\n')}
</table>
<p>To activate your account and create your own password, use the secure link below.</p>
<p><a href="${d.link}" style="display:inline-block;background:#f5b800;color:#0b3d1e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Activate Your Account</a></p>
<p style="font-size:13px;color:#555">If the button does not work, copy this address into your browser:<br>${escapeHtml(d.link)}</p>
<p style="font-size:13px;color:#555">This link expires after <strong>${RESET_VALID_MINUTES} minutes</strong> and can only be used once.</p>
<p style="font-size:13px;color:#555">If you did not expect this invitation, please contact UHWF Administration.</p>
<p style="font-size:13px;color:#555">Regards,<br>UHWF Tanzania Administration</p>
<p style="font-size:12px;color:#888">Automated notification - please do not reply.</p></div>`

    return { subject: 'Your UHWF Account Has Been Created', text, html }
}
