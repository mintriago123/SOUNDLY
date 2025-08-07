import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const diagnostics: {
      timestamp: string;
      environment: string;
      envVars: Record<string, string>;
      urls: Record<string, string | undefined>;
      issues: string[];
      stripeConnection?: string;
    } = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      envVars: {
        // Stripe
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? '✅ Configurado' : '❌ Faltante',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? '✅ Configurado' : '❌ Faltante',
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? '✅ Configurado' : '❌ Faltante',
        STRIPE_PRICE_ID_MENSUAL: process.env.STRIPE_PRICE_ID_MENSUAL ? '✅ Configurado' : '❌ Faltante',
        STRIPE_PRICE_ID_ANUAL: process.env.STRIPE_PRICE_ID_ANUAL ? '✅ Configurado' : '❌ Faltante',
        
        // Site Config
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ? '✅ Configurado' : '❌ Faltante',
        
        // Supabase
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurado' : '❌ Faltante',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ Faltante',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurado' : '❌ Faltante',
      },
      urls: {
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      },
      issues: []
    };

    // Detectar problemas comunes
    if (!process.env.STRIPE_SECRET_KEY) {
      diagnostics.issues.push('STRIPE_SECRET_KEY no está configurado - requerido para APIs de Stripe');
    }
    
    if (!process.env.STRIPE_PRICE_ID_MENSUAL || !process.env.STRIPE_PRICE_ID_ANUAL) {
      diagnostics.issues.push('IDs de precios de Stripe no configurados - necesarios para crear suscripciones');
    }
    
    if (!process.env.NEXT_PUBLIC_SITE_URL) {
      diagnostics.issues.push('NEXT_PUBLIC_SITE_URL no configurado - requerido para redirects de Stripe');
    }

    // Test básico de Stripe (solo si la clave está configurada)
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        await stripe.prices.list({ limit: 1 });
        diagnostics.stripeConnection = '✅ Conectado exitosamente';
      } catch (error) {
        diagnostics.stripeConnection = `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
        diagnostics.issues.push('No se puede conectar a Stripe - verificar STRIPE_SECRET_KEY');
      }
    }

    return NextResponse.json(diagnostics);
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Error en diagnóstico',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
