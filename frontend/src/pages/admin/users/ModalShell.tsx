import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { FaTimes } from 'react-icons/fa'

const ModalShell = ({
    title,
    subtitle,
    onClose,
    children,
    wide = false,
}: {
    title: string
    subtitle?: string
    onClose: () => void
    children: ReactNode
    wide?: boolean
}) => {
    // Esc closes the window, and the page behind it does not scroll
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', onKey)
        const previous = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = previous
        }
    }, [onClose])

    return (
        <div
            className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-green-950/60 p-4 sm:items-center"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                onClick={(e) => e.stopPropagation()}
                className={`my-4 w-full rounded-2xl bg-white p-6 shadow-xl ${wide ? 'max-w-2xl' : 'max-w-md'}`}
            >
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold text-green-950">{title}</h2>
                        {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    >
                        <FaTimes className="h-5 w-5" />
                    </button>
                </div>
                <div className="mt-5">{children}</div>
            </div>
        </div>
    )
}

export default ModalShell