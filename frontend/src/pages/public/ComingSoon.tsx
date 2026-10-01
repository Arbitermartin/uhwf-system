import { useLocation } from 'react-router-dom'

const ComingSoon = () => {
    const { pathname } = useLocation()
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2">
            <h1 className="text-3xl font-bold text-green-800">Coming Soon</h1>
            <p className="text-gray-500">{pathname} is under development.</p>
        </div>
    )
}

export default ComingSoon