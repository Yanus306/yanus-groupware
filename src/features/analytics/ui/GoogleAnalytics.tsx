import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  createGoogleAnalyticsClient,
  getGoogleAnalyticsMeasurementId,
  type GoogleAnalyticsClient,
} from '../model/googleAnalytics'

const measurementId = getGoogleAnalyticsMeasurementId(import.meta.env.VITE_GA_MEASUREMENT_ID)
const defaultClient = createGoogleAnalyticsClient(measurementId, { window, document })

type GoogleAnalyticsProps = Readonly<{
  client?: GoogleAnalyticsClient
}>

export function GoogleAnalytics({ client = defaultClient }: GoogleAnalyticsProps) {
  const location = useLocation()
  const pagePath = location.pathname
  const pageLocation = `${window.location.origin}${pagePath}`

  useEffect(() => {
    client.initialize()
  }, [client])

  useEffect(() => {
    client.pageView({
      path: pagePath,
      title: document.title,
      location: pageLocation,
    })
  }, [client, pageLocation, pagePath])

  return null
}
