import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
  test: {
    // Default to node (correct for API route tests).
    // Add `// @vitest-environment jsdom` at the top of component test files.
    environment: 'node',
    globals: true, // required for @testing-library/react auto-cleanup
    setupFiles: ['./vitest.setup.ts'],
  },
})
