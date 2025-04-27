import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    headers: {
      'Content-Security-Policy': `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.tawk.to https://*.privy.io https://*.walletconnect.org https://*.walletconnect.com;
        style-src 'self' 'unsafe-inline' https://paystack.com https://*.tawk.to;
        style-src-elem 'self' 'unsafe-inline' https://*.tawk.to;
        img-src 'self' data: https: blob: https://*.tawk.to;
        connect-src 'self'
          https://*.tawk.to
          wss://*.tawk.to
          https://*.supabase.co
          https://api.paystack.co
          https://*.privy.io
          https://auth.privy.io
          https://*.walletconnect.org
          https://*.walletconnect.com;
        frame-src 'self' https://tawk.to https://*.tawk.to https://checkout.paystack.com https://*.privy.io;
        font-src 'self' data: https://*.tawk.to;
        manifest-src 'self' https://idx-bantahlion-1744467813686.cluster-blu4edcrfnajktuztkjzgyxzek.cloudworkstations.dev;
        media-src 'self' https://*.tawk.to;
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
