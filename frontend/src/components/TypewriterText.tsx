
import { useEffect, useState } from 'react'

interface TypewriterTextProps {
    text: string
    speed?: number
    deleteSpeed?: number
    pause?: number
    className?: string
}

const TypewriterText = ({
    text,
    speed = 100,
    deleteSpeed = 50,
    pause = 1800,
    className = '',
}: TypewriterTextProps) => {
    const [displayedText, setDisplayedText] = useState('')
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>

        if (!deleting && displayedText === text) {
            timeout = setTimeout(() => {
                setDeleting(true)
            }, pause)
        } else if (deleting && displayedText === '') {
            setDeleting(false)
        } else {
            timeout = setTimeout(() => {
                setDisplayedText((current) =>
                    deleting
                        ? current.slice(0, -1)
                        : text.slice(0, current.length + 1)
                )
            }, deleting ? deleteSpeed : speed)
        }

        return () => clearTimeout(timeout)
    }, [displayedText, deleting, text, speed, deleteSpeed, pause])

    return (
        <span className={className}>
            {displayedText}
            <span
                className="ml-1 inline-block h-[0.85em] w-[3px] animate-pulse bg-green-400 align-middle"
                aria-hidden="true"
            />
        </span>
    )
}

export default TypewriterText
