import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabaseCLient';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export async function POST(request: NextRequest) {
  try {
    const { action, userId } = await request.json();

    if (!action || !userId) {
      return NextResponse.json(
        { error: 'Action y userId son requeridos' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Obtener la suscripción del usuario
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, status')
      .eq('user_id', userId)
      .single();

    if (subscriptionError || !subscription) {
      return NextResponse.json(
        { error: 'Suscripción no encontrada' },
        { status: 404 }
      );
    }

    const stripeSubscriptionId = subscription.stripe_subscription_id;

    if (!stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'ID de suscripción de Stripe no encontrado' },
        { status: 404 }
      );
    }

    let updatedSubscription;

    switch (action) {
      case 'cancel':
        // Cancelar la suscripción al final del período actual
        updatedSubscription = await stripe.subscriptions.update(stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
        break;

      case 'reactivate':
        // Reactivar la suscripción
        updatedSubscription = await stripe.subscriptions.update(stripeSubscriptionId, {
          cancel_at_period_end: false,
        });
        break;

      case 'cancel_immediately':
        // Cancelar la suscripción inmediatamente
        updatedSubscription = await stripe.subscriptions.cancel(stripeSubscriptionId);
        break;

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        );
    }

    // Actualizar la base de datos
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: updatedSubscription.status,
        cancel_at_period_end: (updatedSubscription as any).cancel_at_period_end || false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating subscription in database:', updateError);
    }

    // Si la suscripción se canceló inmediatamente, actualizar el usuario
    if (action === 'cancel_immediately') {
      const { error: userUpdateError } = await supabase
        .from('usuarios')
        .update({
          subscription_status: 'canceled',
          subscription_tier: 'free',
          rol: 'usuario',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (userUpdateError) {
        console.error('Error updating user:', userUpdateError);
      }
    }

    return NextResponse.json({
      success: true,
      subscription: {
        status: updatedSubscription.status,
        cancel_at_period_end: (updatedSubscription as any).cancel_at_period_end,
        current_period_end: new Date((updatedSubscription as any).current_period_end * 1000),
      },
    });
  } catch (error) {
    console.error('Error managing subscription:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
