const Pager = ({
    page,
    total,
    pageSize,
    onChange,
}: {
    page: number
    total: number
    pageSize: number
    onChange: (page: number) => void
}) => {
    const pages = Math.max(1, Math.ceil(total / pageSize))
    if (pages <= 1) return null

    const go = (p: number) => {
        onChange(p)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    const btn =
        'rounded-lg border border-green-900 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50'

    return (
        <nav aria-label="Pages" className="mt-10 flex items-center justify-between">
            <button type="button" disabled={page <= 1} onClick={() => go(page - 1)} className={btn}>
                Previous
            </button>
            <span className="text-sm text-gray-600">
                Page {page} of {pages}
            </span>
            <button type="button" disabled={page >= pages} onClick={() => go(page + 1)} className={btn}>
                Next
            </button>
        </nav>
    )
}

export default Pager