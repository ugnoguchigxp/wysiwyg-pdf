import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  target: 'es2022',
  platform: 'browser',
  outDir: 'dist',
  bundle: true,
  clean: false,
  splitting: false,
  treeshake: true,
  outExtension(ctx: { format: string }) {
    const { format } = (ctx ?? {}) as { format?: string }
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    }
  },
  external: [
    'react',
    'react-dom',
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-select',
    '@radix-ui/react-slot',
    '@radix-ui/react-tooltip',
    '@radix-ui/react-popover',
    'class-variance-authority',
    'clsx',
    'konva',
    'lucide-react',
    'react-konva',
    'tailwind-merge',
    'use-image',
    '*.css',
  ],
})
