export type GoogleAnalyticsPageView = Readonly<{
  path: string
  title: string
  location: string
}>

export type GoogleAnalyticsClient = Readonly<{
  initialize: () => void
  pageView: (page: GoogleAnalyticsPageView) => void
}>

type GoogleAnalyticsConfig = Readonly<{
  send_page_view: false
}>

type GoogleAnalyticsPageViewParameters = Readonly<{
  page_title: string
  page_location: string
  page_path: string
}>

type GoogleAnalyticsCommand =
  | readonly ['js', Date]
  | readonly ['config', string, GoogleAnalyticsConfig]
  | readonly ['event', 'page_view', GoogleAnalyticsPageViewParameters]

type GoogleAnalyticsEnvironment = Readonly<{
  window: Window
  document: Document
}>

declare global {
  interface Window {
    dataLayer?: GoogleAnalyticsCommand[]
    gtag?: (...command: GoogleAnalyticsCommand) => void
  }
}

const GA4_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/i
const GOOGLE_ANALYTICS_SCRIPT_SELECTOR = 'script[data-yanus-ga4]'
const GOOGLE_ANALYTICS_SCRIPT_ATTRIBUTE = 'data-yanus-ga4'

export function getGoogleAnalyticsMeasurementId(rawMeasurementId: unknown): string | null {
  if (typeof rawMeasurementId !== 'string') {
    return null
  }

  const measurementId = rawMeasurementId.trim()
  return GA4_MEASUREMENT_ID_PATTERN.test(measurementId) ? measurementId : null
}

export function createGoogleAnalyticsClient(
  measurementId: string | null,
  environment: GoogleAnalyticsEnvironment,
): GoogleAnalyticsClient {
  let isInitialized = false
  let lastPagePath: string | null = null

  const initialize = (): void => {
    if (!measurementId || isInitialized) {
      return
    }

    environment.window.dataLayer ??= []
    environment.window.gtag ??= (...command: GoogleAnalyticsCommand): void => {
      environment.window.dataLayer?.push(command)
    }

    if (!environment.document.querySelector(GOOGLE_ANALYTICS_SCRIPT_SELECTOR)) {
      const script = environment.document.createElement('script')
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
      script.setAttribute(GOOGLE_ANALYTICS_SCRIPT_ATTRIBUTE, measurementId)
      environment.document.head.appendChild(script)
    }

    environment.window.gtag?.('js', new Date())
    environment.window.gtag?.('config', measurementId, { send_page_view: false })
    isInitialized = true
  }

  const pageView = (page: GoogleAnalyticsPageView): void => {
    initialize()

    if (!measurementId || lastPagePath === page.path) {
      return
    }

    environment.window.gtag?.('event', 'page_view', {
      page_title: page.title,
      page_location: page.location,
      page_path: page.path,
    })
    lastPagePath = page.path
  }

  return { initialize, pageView }
}
