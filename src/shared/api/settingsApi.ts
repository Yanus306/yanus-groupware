import { baseClient } from './baseClient'

export interface AutoCheckoutTimeResponse {
  autoCheckoutTime: string
}

export const getAutoCheckoutTime = () =>
  baseClient.get<AutoCheckoutTimeResponse>('/api/v1/settings/auto-checkout-time')

export const updateAutoCheckoutTime = (autoCheckoutTime: string) =>
  baseClient.patch<AutoCheckoutTimeResponse>('/api/v1/settings/auto-checkout-time', {
    autoCheckoutTime,
  })
