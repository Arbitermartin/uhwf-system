// Shown while the application is loading, or when it could not be loaded.
const LoadState = ({
    loading,
    error,
    onRetry,
}: {
    loading: boolean
    error: string
    onRetry: () => void
}) => (
    <div className="mx-auto max-w-md py-16 text-center">
        {loading && !error && <p className="text-sm text-gray-500">Loading your application...</p>}
        {error && (
            <>
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-4 rounded-lg border border-green-900 px-5 py-2 text-sm font-medium text-green-900 hover:bg-green-50"
                >
                    Try again
                </button>
            </>
        )}
    </div>
)

export default LoadState
