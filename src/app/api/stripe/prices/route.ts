import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export async function GET() {
  try {
    // Obtener los precios desde Stripe
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
    });

    // Filtrar solo los precios que necesitamos
    const monthlyPrice = prices.data.find(
      price => price.id === process.env.STRIPE_PRICE_ID_MENSUAL
    );
    
    const yearlyPrice = prices.data.find(
      price => price.id === process.env.STRIPE_PRICE_ID_ANUAL
    );

    const response = {
      monthly: monthlyPrice ? {
        id: monthlyPrice.id,
        amount: monthlyPrice.unit_amount! / 100, // Convertir de centavos a euros
        currency: monthlyPrice.currency,
        interval: monthlyPrice.recurring?.interval,
        product: monthlyPrice.product,
      } : null,
      yearly: yearlyPrice ? {
        id: yearlyPrice.id,
        amount: yearlyPrice.unit_amount! / 100, // Convertir de centavos a euros
        currency: yearlyPrice.currency,
        interval: yearlyPrice.recurring?.interval,
        product: yearlyPrice.product,
      } : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching prices:', error);
    return NextResponse.json(
      { error: 'Error al obtener los precios' },
      { status: 500 }
    );
  }
}
