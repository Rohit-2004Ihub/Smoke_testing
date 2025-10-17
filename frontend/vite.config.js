import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
   server: {
    host: '0.0.0.0', // or your specific IP, e.g., '192.168.1.10'
    port: 8501,      // your desired port
    strictPort: true // if true, Vite will fail if port is already in use
  }
})