import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { getAutoCheckoutTime, updateAutoCheckoutTime } from '../settingsApi'

const server = setupServer(
  http.get('/api/v1/settings/auto-checkout-time', () =>
    HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: {
        autoCheckoutTime: '23:59:59',
      },
    }),
  ),
  http.patch('/api/v1/settings/auto-checkout-time', async ({ request }) => {
    const body = (await request.json()) as { autoCheckoutTime: string }

    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: {
        autoCheckoutTime: body.autoCheckoutTime,
      },
    })
  }),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('settingsApi', () => {
  it('getAutoCheckoutTime() 자동 체크아웃 시간을 반환한다', async () => {
    await expect(getAutoCheckoutTime()).resolves.toEqual({
      autoCheckoutTime: '23:59:59',
    })
  })

  it('updateAutoCheckoutTime() 자동 체크아웃 시간을 저장하고 반환한다', async () => {
    await expect(updateAutoCheckoutTime('22:00:00')).resolves.toEqual({
      autoCheckoutTime: '22:00:00',
    })
  })
})
