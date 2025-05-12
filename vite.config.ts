
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
      'Access-Control-Allow-Origin': '*',
      'Content-Security-Policy': `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.facebook.net https://connect.facebook.net https://js.paystack.co https://*.firebaseapp.com https://*.googleapis.com https://*.privy.io https://*.walletconnect.org https://*.walletconnect.com https://telegram.org https://*.telegram.org;
        connect-src 'self' wss://*.replit.dev https://*.supabase.co wss://*.supabase.co https://api.paystack.co https://*.privy.io https://auth.privy.io https://api.privy.io https://embedded-wallet.privy.io https://*.walletconnect.org https://*.walletconnect.com wss://*.walletconnect.org wss://*.walletconnect.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        img-src 'self' data: blob: https: https://*.facebook.com;
        font-src 'self' https://fonts.gstatic.com;
        frame-src 'self' https://*.facebook.com https://connect.facebook.net;
      `
    }
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
