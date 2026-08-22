import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createGoogleAnalyticsClient,
  getGoogleAnalyticsMeasurementId,
  type GoogleAnalyticsClient,
} from '../googleAnalytics'

const environment = { window, document } as const

afterEach(() => {
  document.querySelectorAll('script[data-yanus-ga4]').forEach((script) => script.remove())
  window.dataLayer = undefined
  window.gtag = undefined
})

describe('getGoogleAnalyticsMeasurementId', () => {
  it('Given a trimmed GA4 measurement ID, When parsed, Then it returns the normalized ID', () => {
    expect(getGoogleAnalyticsMeasurementId('  G-JGZ8JFGKPW  ')).toBe('G-JGZ8JFGKPW')
  })

  it('Given a missing or non-GA4 ID, When parsed, Then it disables analytics', () => {
    expect(getGoogleAnalyticsMeasurementId(undefined)).toBeNull()
    expect(getGoogleAnalyticsMeasurementId('UA-123456')).toBeNull()
  })
})

describe('createGoogleAnalyticsClient', () => {
  it('Given a valid ID, When initialized, Then it queues the GA4 config without an automatic page view', () => {
    const client = createGoogleAnalyticsClient('G-TEST123', environment)

    client.initialize()

    expect(document.querySelector('script[data-yanus-ga4]')).not.toBeNull()
    expect(document.querySelector<HTMLScriptElement>('script[data-yanus-ga4]')?.src).toContain(
      'id=G-TEST123',
    )
    expect(window.dataLayer).toHaveLength(2)
    const configCommand = window.dataLayer?.[1]
    expect(configCommand?.[0]).toBe('config')
    expect(configCommand?.[1]).toBe('G-TEST123')
    expect(configCommand?.[2]).toEqual({ send_page_view: false })
  })

  it('Given a configured client, When the same route is reported twice, Then it sends one page view per route', () => {
    const client = createGoogleAnalyticsClient('G-TEST123', environment)

    client.pageView({ path: '/calendar', title: '캘린더', location: 'https://yanus.test/calendar' })
    client.pageView({ path: '/calendar', title: '캘린더', location: 'https://yanus.test/calendar' })
    client.pageView({ path: '/chat', title: '채팅', location: 'https://yanus.test/chat' })

    expect(window.dataLayer?.filter((command) => String(command[0]) === 'event')).toHaveLength(2)
  })

  it('Given no measurement ID, When analytics is initialized, Then it does not add a script or data layer', () => {
    const client = createGoogleAnalyticsClient(null, environment)

    client.initialize()
    client.pageView({ path: '/', title: '홈', location: 'https://yanus.test/' })

    expect(document.querySelector('script[data-yanus-ga4]')).toBeNull()
    expect(window.dataLayer).toBeUndefined()
  })
})

describe('GoogleAnalyticsClient contract', () => {
  it('describes the client methods used by the route tracker', () => {
    const client: GoogleAnalyticsClient = {
      initialize: vi.fn(),
      pageView: vi.fn(),
    }

    client.initialize()
    client.pageView({ path: '/', title: '홈', location: 'https://yanus.test/' })

    expect(client.initialize).toHaveBeenCalledOnce()
    expect(client.pageView).toHaveBeenCalledOnce()
  })
})
