import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ['jquery']
    }
  },
  server: {
    host: '0.0.0.0', // Ensures Vite binds to all network interfaces
    port: process.env.PORT || 5173, // Uses Render's assigned port or defaults to 5173
    strictPort: true,
    allowedHosts: ['hrrive.com', 'www.hrrive.com', 'hrms-sxi4.onrender.com','hrms-seab.onrender.com']
  }
})
