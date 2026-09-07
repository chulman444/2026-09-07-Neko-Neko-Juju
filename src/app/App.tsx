import { useState } from 'react'
import { HomePage } from '@/pages/home'
import { ViteWelcomePage } from '@/pages/vite-welcome'

type ActivePage = 'project' | 'vite-welcome'

export const App = () => {
  const [activePage, setActivePage] = useState<ActivePage>('project')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border, #333)',
          background: 'rgba(0, 0, 0, 0.15)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backdropFilter: 'blur(8px)',
        }}
      >
        <span style={{ fontSize: '13px', opacity: 0.7, marginRight: '8px' }}>View:</span>
        <button
          type="button"
          onClick={() => setActivePage('project')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
            border: activePage === 'project' ? '1px solid var(--accent, #646cff)' : '1px solid transparent',
            background: activePage === 'project' ? 'var(--accent-bg, rgba(100, 108, 255, 0.15))' : 'transparent',
            color: activePage === 'project' ? 'var(--accent, #646cff)' : 'inherit',
            fontWeight: activePage === 'project' ? 600 : 400,
          }}
        >
          Project (Neko Neko Juju)
        </button>
        <button
          type="button"
          onClick={() => setActivePage('vite-welcome')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
            border: activePage === 'vite-welcome' ? '1px solid var(--accent, #646cff)' : '1px solid transparent',
            background: activePage === 'vite-welcome' ? 'var(--accent-bg, rgba(100, 108, 255, 0.15))' : 'transparent',
            color: activePage === 'vite-welcome' ? 'var(--accent, #646cff)' : 'inherit',
            fontWeight: activePage === 'vite-welcome' ? 600 : 400,
          }}
        >
          Vite Default Starter
        </button>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activePage === 'project' ? <HomePage /> : <ViteWelcomePage />}
      </main>
    </div>
  )
}
