import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, Link } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { GoogleAnalytics } from '../GoogleAnalytics'
import type { GoogleAnalyticsClient } from '../../model/googleAnalytics'

describe('GoogleAnalytics route tracker', () => {
  it('tracks the initial route and each SPA navigation', async () => {
    const user = userEvent.setup()
    const client: GoogleAnalyticsClient = {
      initialize: vi.fn(),
      pageView: vi.fn(),
    }

    render(
      <MemoryRouter initialEntries={['/']}>
        <GoogleAnalytics client={client} />
        <Routes>
          <Route path="*" element={<Link to="/calendar">캘린더</Link>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(client.initialize).toHaveBeenCalledOnce()
    expect(client.pageView).toHaveBeenCalledWith(expect.objectContaining({ path: '/' }))

    await user.click(screen.getByRole('link', { name: '캘린더' }))

    expect(client.pageView).toHaveBeenLastCalledWith(expect.objectContaining({ path: '/calendar' }))
  })
})
