import { useRegisterSW } from 'virtual:pwa-register/react'

export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW registered:', r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  if (!needRefresh) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      right: '1rem',
      zIndex: 9999,
      background: '#1a1a2e',
      border: '1px solid #863bff',
      borderRadius: '12px',
      padding: '1rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      boxShadow: '0 4px 24px rgba(134, 59, 255, 0.3)',
      color: '#fff',
      fontSize: '0.875rem',
      maxWidth: '320px',
    }}>
      <span>A new version is available.</span>
      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          background: '#863bff',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '0.4rem 0.9rem',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.8rem',
          whiteSpace: 'nowrap',
        }}
      >
        Update
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        style={{
          background: 'transparent',
          color: '#aaa',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1rem',
          lineHeight: 1,
          padding: '0 0.25rem',
        }}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}
