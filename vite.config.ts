import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    hmr: {
      host: '0.0.0.0',
    },
    headers: {
      'Content-Security-Policy': `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.privy.io https://*.walletconnect.org https://*.walletconnect.com https://telegram.org https://*.telegram.org https://js.paystack.co https://*.firebaseapp.com https://*.googleapis.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://paystack.com;
        img-src 'self' data: https: blob: https://*.telegram.org https://*.giphy.com https://media.giphy.com https://i.ibb.co https://*.ibb.co;
        connect-src 'self'
          https://*.supabase.co
          wss://*.supabase.co
          https://api.paystack.co
          https://*.privy.io
          https://auth.privy.io
          https://api.privy.io
          https://embedded-wallet.privy.io
          https://*.walletconnect.org
          https://*.walletconnect.com
          wss://*.walletconnect.org
          wss://*.walletconnect.com
          wss://*.app.github.dev
          wss://localhost:*
          wss://github.dev;
        frame-src 'self'
          https://checkout.paystack.com
          https://*.privy.io
          https://auth.privy.io
          https://privy.io
          https://*.telegram.org;
        font-src 'self' data: https://fonts.gstatic.com;
        manifest-src 'self' https://*.app.github.dev https://*.cloudworkstations.dev https://github.dev;
        media-src 'self' https://*.giphy.com https://media.giphy.com;
        worker-src 'self' blob:;
        child-src blob:;
        object-src 'none';
      `.replace(/\s+/g, ' ').trim()
    }
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
