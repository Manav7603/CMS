import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // server: {
  //   proxy: {
  //     // Proxy API requests to your Express backend
  //     '/api': {
  //       target: 'http://localhost:8000', // Your Express server port
  //       changeOrigin: true,
  //       secure: false,
  //     }
  //   }
  // }
});

