import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['Test/src/**/*.{test,spec}.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['Test/setup.ts'],
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      // Project-wide coverage (runtime code)
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.d.ts',
        'dist/**',
        'example/**',
        'Test/**',
        'src/global.d.ts',
        // Type-only / barrel exports (exclude from coverage)
        'src/index.ts',
        'src/types/**',
        'src/modules/**/types.ts',
        'src/modules/**/types/**',
        'src/modules/**/pdf-editor/types/**',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
})
