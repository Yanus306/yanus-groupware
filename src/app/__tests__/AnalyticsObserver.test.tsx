import { StrictMode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AnalyticsObserver } from '../AnalyticsObserver'

const analytics = vi.hoisted(() => ({
  initializeAnalytics: vi.fn(() => true),
  syncAnalyticsUser: vi.fn(),
  capturePageview: vi.fn(),
}))
const auth = vi.hoisted(() => ({
  state: { currentUser: null },
  isInitializing: false,
}))

vi.mock('../../shared/lib/analytics', () => analytics)
vi.mock('../../features/auth/model', () => ({ useApp: () => auth }))

function Navigation() {
  const navigate = useNavigate()
  return <>
    <button onClick={() => navigate('/login?token=private#secret')}>query</button>
    <button onClick={() => navigate('/register')}>register</button>
  </>
}

function ObserverScenario() {
  return <StrictMode>
    <MemoryRouter initialEntries={['/login']}>
      <AnalyticsObserver />
      <Navigation />
    </MemoryRouter>
  </StrictMode>
}

describe('AnalyticsObserver', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    auth.isInitializing = false
    analytics.initializeAnalytics.mockReturnValue(true)
  })

  it('captures only one initial pageview under StrictMode', () => {
    render(<ObserverScenario />)

    expect(analytics.capturePageview).toHaveBeenCalledTimes(1)
  })

  it('captures a pageview when the SPA path changes', async () => {
    const user = userEvent.setup()
    render(<ObserverScenario />)
    analytics.capturePageview.mockClear()

    await user.click(screen.getByRole('button', { name: 'register' }))

    expect(analytics.capturePageview).toHaveBeenCalledTimes(1)
  })

  it('does not capture another pageview for query and hash changes', async () => {
    const user = userEvent.setup()
    render(<ObserverScenario />)
    analytics.capturePageview.mockClear()

    await user.click(screen.getByRole('button', { name: 'query' }))

    expect(analytics.capturePageview).not.toHaveBeenCalled()
  })

  it('waits for session restoration before capturing', async () => {
    auth.isInitializing = true
    const { rerender } = render(<ObserverScenario />)
    expect(analytics.capturePageview).not.toHaveBeenCalled()

    auth.isInitializing = false
    rerender(<ObserverScenario />)

    await waitFor(() => expect(analytics.capturePageview).toHaveBeenCalledTimes(1))
  })

  it('does not capture when analytics is disabled', () => {
    analytics.initializeAnalytics.mockReturnValue(false)

    render(<ObserverScenario />)

    expect(analytics.capturePageview).not.toHaveBeenCalled()
    expect(analytics.syncAnalyticsUser).not.toHaveBeenCalled()
  })
})
