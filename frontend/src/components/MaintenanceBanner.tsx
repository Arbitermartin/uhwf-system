import { useEffect, useState } from 'react'
import { api } from '../services/api'

// A bar across the top of the public website while ICT has maintenance mode on.
const MaintenanceBanner = () => {
    const [on, setOn] = useState(false)

    useEffect(() => {
        let cancelled = false
        api
            .get<{ on: boolean }>('/maintenance')
            .then((res) => {
                if (!cancelled) setOn(res.data.on)
            })
            .catch(() => undefined) // if the server cannot be reached, show nothing
        return () => {
            cancelled = true
        }
    }, [])

    if (!on) return null
    return (
        <div role="status" className="bg-amber-400 px-4 py-2 text-center text-sm font-medium text-green-950">
            The system is under maintenance. Sign-in and some features may be unavailable for a while.
        </div>
    )
}

export default MaintenanceBanner
