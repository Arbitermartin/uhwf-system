import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { FaArrowLeft, FaEnvelopeOpenText } from 'react-icons/fa'
import logo from '../../assets/uhwf-logo.webp'
import { api, getErrorMessage, getFieldErrors } from '../../services/api'

// The server will not send a second link within 2 minutes, so the button waits as long.
const RESEND_SECONDS = 120

const ForgotPassword = () => {
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [serverError, setServerError] = useState('')
    const [sending, setSending] = useState(false)
    const [sentTo, setSentTo] = useState('')
    const [wait, setWait] = useState(0)

    // counts down after a link was requested
    useEffect(() => {
        if (wait <= 0) return
        const t = window.setTimeout(() => setWait((w) => w - 1), 1000)
        return () => window.clearTimeout(t)
    }, [wait])

    const request = async (address: string) => {
        setSending(true)
        setServerError('')
        try {
            await api.post('/auth/forgot-password', { email: address })
            // The answer is the same whether or not an account exists, so this page says the same thing too.
            setSentTo(address)
            setWait(RESEND_SECONDS)
        } catch (err) {
            setError(getFieldErrors(err).email ?? '')
            setServerError(getErrorMessage(err, 'Could not send the link. Please try again.'))
        } finally {
            setSending(false)
        }
    }

    const submit = (e: FormEvent) => {
        e.preventDefault()
        const value = email.trim()
        if (!/^\S+@\S+\.\S+$/.test(value)) {
            setError('Enter a valid email address.')
            return
        }
        setError('')
        void request(value)
    }

    return (
        <div className="min-h-screen bg-green-50 px-4 py-8 sm:py-12">
            <div className="mx-auto w-full max-w-md">
                <div className="mb-6 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <img src={logo} alt="UHWF logo" className="h-10 w-auto" />
                        <span className="text-lg font-bold text-green-800">UHWF-TANZANIA</span>
                    </Link>
                    <Link to="/login" className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-700">
                        <FaArrowLeft className="h-3 w-3" /> Back to sign in
                    </Link>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                    {sentTo ? (
                        <div className="text-center">
                            <FaEnvelopeOpenText className="mx-auto h-12 w-12 text-green-700" />
                            <h1 className="mt-4 text-xl font-bold text-green-950">Check your email</h1>
                            <p className="mt-2 text-sm leading-relaxed text-gray-600">
                                If an account exists for <strong className="break-all text-green-950">{sentTo}</strong>, we have sent a
                                link to reset the password. The link works for 60 minutes.
                            </p>
                            <p className="mt-2 text-sm text-gray-500">Nothing in your inbox? Look in the spam folder too.</p>

                            {serverError && (
                                <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    {serverError}
                                </p>
                            )}

                            <button
                                type="button"
                                onClick={() => void request(sentTo)}
                                disabled={sending || wait > 0}
                                className="mt-6 w-full rounded-lg border border-green-900 py-2.5 text-sm font-medium text-green-900 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {sending ? 'Sending...' : wait > 0 ? `Send again in ${Math.floor(wait / 60)}:${String(wait % 60).padStart(2, '0')}` : 'Send the link again'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSentTo('')
                                    setWait(0)
                                    setServerError('')
                                }}
                                className="mt-3 text-sm text-gray-600 hover:underline"
                            >
                                Use a different email
                            </button>
                            <Link
                                to="/login"
                                className="mt-6 block w-full rounded-lg bg-amber-400 py-2.5 text-center text-sm font-semibold text-green-950 hover:bg-amber-300"
                            >
                                Back to sign in
                            </Link>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-xl font-bold text-green-950">Forgot your password?</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Enter the email you sign in with. We will send you a link to choose a new password.
                            </p>

                            {serverError && (
                                <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    {serverError}
                                </p>
                            )}

                            <form onSubmit={submit} noValidate className="mt-5 space-y-4">
                                <div>
                                    <label htmlFor="email" className="mb-1 block text-xs font-medium text-gray-600">
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        autoFocus
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value)
                                            setError('')
                                            setServerError('')
                                        }}
                                        placeholder="you@example.com"
                                        aria-invalid={!!error}
                                        className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500 ${error ? 'border-red-400' : 'border-gray-200'
                                            }`}
                                    />
                                    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="w-full rounded-lg bg-amber-400 py-2.5 font-semibold text-green-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {sending ? 'Sending...' : 'Send reset link'}
                                </button>
                            </form>

                            <p className="mt-5 text-center text-xs text-gray-500">
                                Applicant with no account yet? Go to{' '}
                                <Link to="/admission" className="font-medium text-green-800 hover:underline">
                                    Admission
                                </Link>
                                .
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ForgotPassword
