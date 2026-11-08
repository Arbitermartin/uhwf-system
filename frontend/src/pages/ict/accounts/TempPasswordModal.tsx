import { useState } from 'react'
import { FaCheck, FaCopy } from 'react-icons/fa'
import ModalShell from '../../admin/users/ModalShell'

// Shows the temporary password once. It cannot be looked at again after this window closes.
const TempPasswordModal = ({ name, email, password, onClose }: { name: string; email: string; password: string; onClose: () => void }) => {
    const [copied, setCopied] = useState(false)

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(password)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 2000)
        } catch {
            /* some browsers block copying; the password is also on screen to copy by hand */
        }
    }

    return (
        <ModalShell title="Password reset" subtitle={`${name} (${email})`} onClose={onClose}>
            <p className="text-sm text-gray-600">Give this temporary password to the person. They will be asked to choose their own at the next sign-in.</p>

            <div className="mt-4 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                <code className="flex-1 select-all break-all text-lg font-semibold tracking-wider text-green-950">{password}</code>
                <button
                    type="button"
                    onClick={() => void copy()}
                    className="inline-flex items-center gap-2 rounded-lg border border-green-900 px-3 py-2 text-sm font-medium text-green-900 hover:bg-white"
                >
                    {copied ? <FaCheck className="h-3.5 w-3.5" /> : <FaCopy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>

            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-amber-900">
                <li>
                    <strong>This is shown only once.</strong> If you close this window, reset the password again to get a new one.
                </li>
                <li>The person was signed out of every device.</li>
                <li>Tell them in private (a call or in person), not in a public chat.</li>
            </ul>

            <div className="mt-6 flex justify-end">
                <button type="button" onClick={onClose} className="rounded-lg bg-amber-400 px-6 py-2 text-sm font-semibold text-green-950 hover:bg-amber-300">
                    I have copied it
                </button>
            </div>
        </ModalShell>
    )
}

export default TempPasswordModal
