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
    // globals:true enables RTL auto-cleanup between tests. Test files should
    // still use explicit `import { describe, it, expect } from 'vitest'` —
    // tsconfig does not include vitest/globals types so implicit globals
    // will produce TS errors.
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
})
