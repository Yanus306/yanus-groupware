import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { startMockWorker, renderApp, createRootSpy } = vi.hoisted(() => {
  const startMockWorker = vi.fn().mockResolvedValue(undefined)
  const renderApp = vi.fn()
  const createRootSpy = vi.fn(() => ({ render: renderApp }))

  return { startMockWorker, renderApp, createRootSpy }
})

vi.mock('../../shared/api/mock/browser', () => ({
  worker: {
    start: startMockWorker,
  },
}))

vi.mock('react-dom/client', () => ({
  createRoot: createRootSpy,
}))

vi.mock('../../App.tsx', () => ({
  default: () => null,
}))

describe('main bootstrap', () => {
  beforeEach(() => {
    vi.resetModules()
    startMockWorker.mockClear()
    renderApp.mockClear()
    createRootSpy.mockClear()
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('mock 모드에서 msw worker를 quiet 옵션과 함께 시작한 뒤 렌더링한다', async () => {
    const { bootstrapApp } = await import('../../main')
    await bootstrapApp({ useMock: true })

    expect(startMockWorker).toHaveBeenCalledWith({
      onUnhandledRequest: 'bypass',
      quiet: true,
    })
    expect(createRootSpy).toHaveBeenCalledWith(document.getElementById('root'))
    expect(renderApp).toHaveBeenCalled()
  })
})
