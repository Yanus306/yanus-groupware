import { SpeedInsights } from '@vercel/speed-insights/react'
import { Providers } from './app/providers'
import { AppRouter } from './app/router'

function App() {
  return (
    <Providers>
      <AppRouter />
      <SpeedInsights />
    </Providers>
  )
}

export default App
