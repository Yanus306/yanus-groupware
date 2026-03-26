import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { chatHandlers } from '../../shared/api/mock/handlers/chat'
import { Providers } from '../providers'
import { useApp } from '../../features/auth/model'
import { useTasks } from '../../features/tasks/model'
import { useEvents } from '../../features/calendar/model'
import { useChat } from '../../features/chat/model'

const server = setupServer(...chatHandlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function AppConsumer() {
  const { state } = useApp()
  const { tasks } = useTasks()
  const { events } = useEvents()
  const { channels } = useChat()
  return (
    <div>
      <span data-testid="user">{state.currentUser?.name ?? '비로그인'}</span>
      <span data-testid="tasks">{tasks.length}</span>
      <span data-testid="events">{events.length}</span>
      <span data-testid="channels">{channels.length}</span>
    </div>
  )
}

describe('Providers', () => {
  it('AppProvider 컨텍스트를 제공한다', () => {
    render(
      <Providers>
        <AppConsumer />
      </Providers>,
    )
    expect(screen.getByTestId('user')).toBeInTheDocument()
  })

  it('TasksProvider 컨텍스트를 제공한다', () => {
    render(
      <Providers>
        <AppConsumer />
      </Providers>,
    )
    expect(Number(screen.getByTestId('tasks').textContent)).toBeGreaterThanOrEqual(0)
  })

  it('EventsProvider 컨텍스트를 제공한다', () => {
    render(
      <Providers>
        <AppConsumer />
      </Providers>,
    )
    expect(Number(screen.getByTestId('events').textContent)).toBeGreaterThanOrEqual(0)
  })

  it('ChatProvider 컨텍스트를 제공한다', async () => {
    render(
      <Providers>
        <AppConsumer />
      </Providers>,
    )
    await waitFor(() =>
      expect(Number(screen.getByTestId('channels').textContent)).toBeGreaterThanOrEqual(0)
    )
  })
})
