import { useCallback, useEffect, useRef, useState } from 'react'

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']

type Options = {
    enabled: boolean
    idleMs: number // inactivity time before the popup appears
    warnMs: number // how long the popup waits before signing out
    onTimeout: () => void
}

export const useIdleTimeout = ({ enabled, idleMs, warnMs, onTimeout }: Options) => {
    const [warning, setWarning] = useState(false)
    const [secondsLeft, setSecondsLeft] = useState(Math.ceil(warnMs / 1000))

    const lastActivity = useRef(Date.now())
    const warningRef = useRef(false)
    const timeoutRef = useRef(onTimeout)
    timeoutRef.current = onTimeout

    useEffect(() => {
        if (!enabled) {
            warningRef.current = false
            setWarning(false)
            return
        }

        lastActivity.current = Date.now()

        // While the popup is open, moving the mouse does NOT count: the person must press the button.
        const markActive = () => {
            if (!warningRef.current) lastActivity.current = Date.now()
        }
        ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, markActive, { passive: true }))

        const timer = window.setInterval(() => {
            const idle = Date.now() - lastActivity.current
            if (idle >= idleMs + warnMs) {
                window.clearInterval(timer)
                timeoutRef.current()
            } else if (idle >= idleMs) {
                warningRef.current = true
                setWarning(true)
                setSecondsLeft(Math.max(0, Math.ceil((idleMs + warnMs - idle) / 1000)))
            }
        }, 1000)

        return () => {
            window.clearInterval(timer)
            ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, markActive))
        }
    }, [enabled, idleMs, warnMs])

    const stay = useCallback(() => {
        lastActivity.current = Date.now()
        warningRef.current = false
        setWarning(false)
    }, [])

    return { warning, secondsLeft, stay }
}