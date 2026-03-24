import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'
import { Providers } from './app/providers'
import { AppRouter } from './app/router'

function App() {
  return (
    <Providers>
      <AppRouter />
      <SpeedInsights />
      <Analytics />
    </Providers>
  )
}

export default App
