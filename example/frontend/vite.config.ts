import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      i18next: path.resolve(__dirname, './node_modules/i18next'),
      'react-i18next': path.resolve(__dirname, './node_modules/react-i18next'),
      '@radix-ui/react-dialog': path.resolve(__dirname, './node_modules/@radix-ui/react-dialog'),
      '@radix-ui/react-dropdown-menu': path.resolve(
        __dirname,
        './node_modules/@radix-ui/react-dropdown-menu'
      ),
      '@radix-ui/react-popover': path.resolve(__dirname, './node_modules/@radix-ui/react-popover'),
      '@radix-ui/react-select': path.resolve(__dirname, './node_modules/@radix-ui/react-select'),
      '@radix-ui/react-tooltip': path.resolve(__dirname, './node_modules/@radix-ui/react-tooltip'),
      'wysiwyg-pdf': path.resolve(__dirname, '../../src/index.ts'),
      '@': path.resolve(__dirname, '../../src'),
      exceljs: path.resolve(__dirname, './node_modules/exceljs'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
