import '@testing-library/jest-dom'
import { afterEach, beforeEach } from 'vitest'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})
