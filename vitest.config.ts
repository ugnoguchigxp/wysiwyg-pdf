import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
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
        'src/global.d.ts',
        'src/i18n/**',
        'src/utils/docUnitConversion.ts',
        // Type-only / barrel exports (exclude from coverage)
        'src/index.ts',
        'src/types/**',
        'src/modules/**/types.ts',
        'src/modules/**/types/**',
        'src/modules/**/pdf-editor/types/**',
        'src/components/canvas/types.ts',
        'src/features/bed-layout-dashboard/types.ts',
        'src/features/konva-editor/types.ts',
        'src/features/konva-editor/components/PropertyPanel/index.ts',
        'src/features/konva-editor/components/PropertyPanel/widgets/types.ts',
        'src/features/mindmap-editor/index.ts',
        'src/features/mindmap-editor/types.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 50,
        branches: 65,
        statements: 70,
      },
    },
  },
})
