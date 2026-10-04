import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PostHogConfig } from 'posthog-js'

const sdk = vi.hoisted(() => ({
  init: vi.fn<(token: string, config: Partial<PostHogConfig>) => void>(),
  identify: vi.fn(),
  reset: vi.fn(),
  capture: vi.fn(),
  get_property: vi.fn(),
}))

vi.mock('posthog-js', () => ({ default: sdk }))

describe('PostHog analytics', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.stubEnv('PROD', true)
    vi.stubEnv('VITE_USE_MOCK', 'false')
    vi.stubEnv('VITE_POSTHOG_PROJECT_TOKEN', 'phc_test')
    vi.stubEnv('VITE_POSTHOG_HOST', 'https://us.i.posthog.com')
    vi.stubEnv('VITE_POSTHOG_ENABLED', '')
  })

  afterEach(() => vi.unstubAllEnvs())

  it.each([
    ['VITE_POSTHOG_PROJECT_TOKEN', ''],
    ['VITE_USE_MOCK', 'true'],
    ['VITE_POSTHOG_ENABLED', 'false'],
  ])('does not collect when %s is %s', async (name, value) => {
    vi.stubEnv(name, value)
    const { initializeAnalytics } = await import('../analytics')

    const enabled = initializeAnalytics()

    expect(enabled).toBe(false)
    expect(sdk.init).not.toHaveBeenCalled()
  })

  it('does not collect in development by default', async () => {
    vi.stubEnv('PROD', false)
    const { initializeAnalytics } = await import('../analytics')

    expect(initializeAnalytics()).toBe(false)
    expect(sdk.init).not.toHaveBeenCalled()
  })

  it('initializes only once when called repeatedly', async () => {
    const { initializeAnalytics } = await import('../analytics')

    initializeAnalytics()
    initializeAnalytics()

    expect(sdk.init).toHaveBeenCalledTimes(1)
  })

  it('allows a deliberate local smoke test when explicitly enabled', async () => {
    vi.stubEnv('PROD', false)
    vi.stubEnv('VITE_POSTHOG_ENABLED', 'true')
    const { initializeAnalytics } = await import('../analytics')

    expect(initializeAnalytics()).toBe(true)
  })

  it('resets a persisted user identity when the app is signed out', async () => {
    sdk.get_property.mockReturnValue('previous-user')
    const { initializeAnalytics, syncAnalyticsUser } = await import('../analytics')
    initializeAnalytics()

    syncAnalyticsUser(null)

    expect(sdk.reset).toHaveBeenCalledTimes(1)
    expect(sdk.identify).not.toHaveBeenCalled()
  })

  it('resets identity before identifying a different account', async () => {
    sdk.get_property.mockReturnValue('previous-user')
    const { initializeAnalytics, syncAnalyticsUser } = await import('../analytics')
    initializeAnalytics()

    syncAnalyticsUser('next-user')

    expect(sdk.reset.mock.invocationCallOrder[0]).toBeLessThan(sdk.identify.mock.invocationCallOrder[0])
    expect(sdk.identify).toHaveBeenCalledWith('next-user')
  })

  it('does not repeat identify when the same account is already identified', async () => {
    sdk.get_property.mockReturnValue('same-user')
    const { initializeAnalytics, syncAnalyticsUser } = await import('../analytics')
    initializeAnalytics()

    syncAnalyticsUser('same-user')

    expect(sdk.identify).not.toHaveBeenCalled()
  })

  it('removes private properties and URL secrets before sending', async () => {
    window.history.replaceState({}, '', '/verify-email?token=secret#private')
    const { initializeAnalytics } = await import('../analytics')
    initializeAnalytics()
    const beforeSend = sdk.init.mock.calls[0]?.[1].before_send
    if (typeof beforeSend !== 'function') throw new Error('Missing before_send callback')

    const event = beforeSend({
      uuid: 'test-event', event: '$pageview',
      properties: {
        distinct_id: 'test-user', $current_url: window.location.href,
        $referrer: 'https://example.com/?token=secret', email: 'private@example.com',
        message: 'private message', $set: { name: 'private name' },
      },
      $set: { email: 'private@example.com' },
      $set_once: { $initial_current_url: window.location.href },
    })

    expect(event?.properties).toEqual({
      distinct_id: 'test-user', $current_url: window.location.origin + '/verify-email',
      $pathname: '/verify-email',
    })
    expect(event?.$set).toBeUndefined()
    expect(event?.$set_once).toBeUndefined()
  })
})
