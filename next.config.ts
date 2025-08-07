import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Configuración para webhooks de Stripe
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  // Headers de seguridad para Stripe
  async headers() {
    return [
      {
        source: '/api/stripe/webhook',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://api.stripe.com',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'POST',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'stripe-signature, content-type',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
