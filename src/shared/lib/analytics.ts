import posthog from 'posthog-js'

let initialized = false

const allowedProperties = new Set([
  'token', 'distinct_id', '$anon_distinct_id', '$device_id', '$user_id',
  '$session_id', '$window_id', '$is_identified', '$lib', '$lib_version',
  '$insert_id', '$time', '$process_person_profile', '$current_url', '$pathname',
  '$host', '$browser', '$browser_version', '$os', '$os_version', '$device_type',
  '$screen_height', '$screen_width', '$viewport_height', '$viewport_width',
  '$geoip_disable',
])

export function initializeAnalytics(): boolean {
  if (initialized) return true

  const token = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN?.trim()
  const enabled = import.meta.env.VITE_POSTHOG_ENABLED
  if (!token || enabled === 'false') return false
  if ((!import.meta.env.PROD || import.meta.env.VITE_USE_MOCK === 'true') && enabled !== 'true') return false

  posthog.init(token, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
    defaults: '2026-05-30',
    person_profiles: 'identified_only',
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    disable_surveys: true,
    capture_heatmaps: false,
    capture_performance: false,
    advanced_disable_feature_flags: true,
    ip: false,
    before_send: (event) => {
      if (!event || !['$pageview', '$identify'].includes(event.event)) return null
      event.properties = Object.fromEntries(
        Object.entries(event.properties).filter(([key]) => allowedProperties.has(key)),
      )
      event.properties.$current_url = window.location.origin + window.location.pathname
      event.properties.$pathname = window.location.pathname
      delete event.$set
      delete event.$set_once
      return event
    },
  })
  initialized = true
  return true
}

export function syncAnalyticsUser(userId: string | null): void {
  if (!initialized) return
  const previousUserId = posthog.get_property('$user_id')
  if (previousUserId === userId) return
  if (previousUserId) posthog.reset()
  if (userId) posthog.identify(userId)
}

export function capturePageview(): void {
  if (initialized) posthog.capture('$pageview')
}
