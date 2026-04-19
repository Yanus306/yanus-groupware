import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

export async function bootstrapApp(options?: { useMock?: boolean }) {
  const useMock = options?.useMock ?? (import.meta.env.VITE_USE_MOCK === 'true')

  if (useMock) {
    const { worker } = await import('./shared/api/mock/browser')
    await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrapApp()
