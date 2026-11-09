type Props = {
    secondsLeft: number
    onStay: () => void
    onLogout: () => void
}

export const IdleWarning = ({ secondsLeft, onStay, onLogout }: Props) => (
    <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="idle-title"
        style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
        }}
    >
        <div
            style={{
                background: '#fff',
                color: '#111',
                borderRadius: 12,
                padding: '24px 28px',
                maxWidth: 420,
                width: '90%',
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
            }}
        >
            <h2 id="idle-title" style={{ margin: '0 0 8px', fontSize: 20 }}>
                Are you still there?
            </h2>
            <p style={{ margin: '0 0 16px' }}>
                You have been inactive. For your security you will be signed out in{' '}
                <strong>{secondsLeft}</strong> seconds.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                    onClick={onStay}
                    style={{ padding: '10px 18px', borderRadius: 8, border: 0, background: '#0b5ed7', color: '#fff', cursor: 'pointer' }}
                >
                    Continue in dashboard
                </button>
                <button
                    onClick={onLogout}
                    style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}
                >
                    Sign out
                </button>
            </div>
        </div>
    </div>
)