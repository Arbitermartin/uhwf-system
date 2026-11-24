import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { FaPause, FaPlay } from 'react-icons/fa'

const INTERVAL_MS = 6000

// A background slideshow. The pictures fade into each other behind whatever you put inside it.
const HeroSlideshow = ({ slides, children }: { slides: string[]; children: ReactNode }) => {
    const count = slides.length
    const [index, setIndex] = useState(0)
    const [userPaused, setUserPaused] = useState(false)
    // const [hovering, setHovering] = useState(false)
    const [tabHidden, setTabHidden] = useState(false)
    const [reduced, setReduced] = useState(false)
    const [seen, setSeen] = useState<number[]>([0])

    // People who ask their device for less motion get a still picture
    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)')
        setReduced(query.matches)
        const onChange = () => setReduced(query.matches)
        query.addEventListener('change', onChange)
        return () => query.removeEventListener('change', onChange)
    }, [])

    // No need to keep sliding while the tab is in the background
    useEffect(() => {
        const onChange = () => setTabHidden(document.hidden)
        document.addEventListener('visibilitychange', onChange)
        return () => document.removeEventListener('visibilitychange', onChange)
    }, [])

    const playing = count > 1 && !userPaused && !tabHidden && !reduced

    useEffect(() => {
        if (!playing) return
        const id = window.setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS)
        return () => window.clearInterval(id)
    }, [playing, count])

    // Only the picture on screen and the next one are loaded, so the page starts fast
    useEffect(() => {
        const next = (index + 1) % count
        setSeen((s) => (s.includes(index) && s.includes(next) ? s : Array.from(new Set([...s, index, next]))))
    }, [index, count])

    return (
        <section
            className="relative overflow-hidden bg-green-950"
        // onMouseEnter={() => setHovering(true)}
        // onMouseLeave={() => setHovering(false)}
        // onFocus={() => setHovering(true)}
        // onBlur={() => setHovering(false)}
        >
            {/* Pictures: decorative, so they have no text description */}
            <div className="absolute inset-0" aria-hidden="true">
                {slides.map(
                    (src, i) =>
                        seen.includes(i) && (
                            <img
                                key={src}
                                src={src}
                                alt=""
                                decoding="async"
                                loading={i === 0 ? 'eager' : 'lazy'}
                                className="absolute inset-0 h-full w-full object-cover"
                                style={{
                                    opacity: i === index ? 1 : 0,
                                    transform: reduced ? 'none' : i === index ? 'scale(1.06)' : 'scale(1)',
                                    transition: reduced ? 'none' : 'opacity 1400ms ease-in-out, transform 9000ms ease-out',
                                }}
                            />
                        ),
                )}
            </div>

            {/* Dark on the left so the text is easy to read, lighter on the right so the picture shows */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-950/85 via-green-950/60 to-green-950/25" />

            <div className="relative z-10">{children}</div>

            {count > 1 && (
                <div className="absolute inset-x-0 bottom-5 z-20 flex items-center justify-center gap-3">
                    <div className="flex items-center gap-2">
                        {slides.map((src, i) => (
                            <button
                                key={src}
                                type="button"
                                onClick={() => setIndex(i)}
                                aria-label={`Show picture ${i + 1} of ${count}`}
                                aria-current={i === index}
                                className={`h-2.5 rounded-full transition-all ${i === index ? 'w-7 bg-amber-400' : 'w-2.5 bg-white/60 hover:bg-white'
                                    }`}
                            />
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() => setUserPaused((p) => !p)}
                        aria-pressed={userPaused}
                        aria-label={userPaused ? 'Play the slideshow' : 'Pause the slideshow'}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/40"
                    >
                        {userPaused ? <FaPlay className="h-3 w-3" /> : <FaPause className="h-3 w-3" />}
                    </button>
                </div>
            )}
        </section>
    )
}

export default HeroSlideshow