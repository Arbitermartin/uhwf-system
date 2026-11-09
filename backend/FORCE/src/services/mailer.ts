import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { env } from '../config'
import { HttpError } from '../utils/httpError'

let transporter: Transporter | null = null

function getTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: env.mail.host,
            port: env.mail.port,
            secure: env.mail.secure,
            auth: env.mail.user ? { user: env.mail.user, pass: env.mail.pass } : undefined,
            // an unreachable mail server must fail quickly, not hang
            connectionTimeout: 10_000,
            greetingTimeout: 10_000,
            socketTimeout: 20_000,
        })
    }
    return transporter
}

export const isMailConfigured = () => env.mail.configured

export async function sendMail(message: { to: string; subject: string; text: string; html: string }) {
    if (!env.mail.configured) {
        throw new HttpError(503, 'Email is not set up on the server. Add the SMTP_ settings to the .env file.')
    }
    await getTransporter().sendMail({ from: env.mail.from, ...message })
}
