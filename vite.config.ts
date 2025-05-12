
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000,
    host: '0.0.0.0',
    hmr: {
      host: `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`,
      protocol: 'wss',
      clientPort: 443
    }
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
