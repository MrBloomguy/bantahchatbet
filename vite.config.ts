
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000,
    host: '0.0.0.0',
    allowedHosts: [
      '9db8b7c8-6a65-4985-ae0f-4060615cc8c2-00-2c4t8kc0c2f8i.spock.replit.dev'
    ],
    hmr: {
      clientPort: 443,
      protocol: 'wss'
    },
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
