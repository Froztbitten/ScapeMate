import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Vitest's globals are enabled, but auto-cleanup is not wired up for us.
afterEach(() => {
  cleanup()
})
