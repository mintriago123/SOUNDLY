import Stripe from 'stripe';

// Configuración de Stripe
export const stripeConfig = {
  // Verificar que las claves existen
  secretKey: process.env.STRIPE_SECRET_KEY!,
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  
  // IDs de precios - estos necesitan ser configurados en Stripe Dashboard
  prices: {
    monthly: process.env.STRIPE_PRICE_ID_MENSUAL!,
    yearly: process.env.STRIPE_PRICE_ID_ANUAL!,
  },
  
  // Webhooks
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  
  // URLs
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL!,
};

// Verificar que todas las variables de entorno requeridas están configuradas
export function validateStripeConfig() {
  const requiredEnvVars = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_PRICE_ID_MENSUAL',
    'STRIPE_PRICE_ID_ANUAL',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_SITE_URL'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

// Instancia de Stripe configurada
export const stripe = new Stripe(stripeConfig.secretKey, {
  apiVersion: '2025-07-30.basil', // Usando la versión actual configurada
  typescript: true,
});

// Configuración de productos por defecto
export const defaultProducts = {
  premium: {
    name: 'SOUNDLY Premium',
    description: 'Acceso completo a todas las funciones premium de SOUNDLY',
    features: [
      'Streaming de música en alta calidad',
      'Descargas offline ilimitadas',
      'Sin anuncios',
      'Playlists personalizadas avanzadas',
      'Análisis detallados',
      'Soporte prioritario'
    ]
  }
};

export default stripeConfig;
