import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    headers: {
      'Content-Security-Policy': `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.tawk.to https://*.privy.io https://*.walletconnect.org https://*.walletconnect.com https://telegram.org https://*.telegram.org;
        style-src 'self' 'unsafe-inline' https://paystack.com https://*.tawk.to;
        style-src-elem 'self' 'unsafe-inline' https://*.tawk.to;
        img-src 'self' data: https: blob: https://*.tawk.to https://*.telegram.org https://*.giphy.com https://media.giphy.com;
        connect-src 'self'
          https://*.tawk.to
          wss://*.tawk.to
          https://*.supabase.co
          https://api.paystack.co
          https://*.privy.io
          https://auth.privy.io
          https://api.giphy.com
          https://*.walletconnect.org
          https://*.walletconnect.com
          https://*.telegram.org;
        frame-src 'self' https://tawk.to https://*.tawk.to https://checkout.paystack.com https://*.privy.io https://*.telegram.org;
        font-src 'self' data: https://*.tawk.to;
        manifest-src 'self' https://idx-bantahlion-1744467813686.cluster-blu4edcrfnajktuztkjzgyxzek.cloudworkstations.dev;
        media-src 'self' https://*.tawk.to https://*.giphy.com https://media.giphy.com;
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
