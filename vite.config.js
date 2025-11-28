import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  build: {
    target: 'esnext',
    modulePreload: {
      polyfill: true
    },
    rollupOptions: {
      output: {
        format: 'es',
        // 确保每次构建都生成新的文件 hash
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
})

