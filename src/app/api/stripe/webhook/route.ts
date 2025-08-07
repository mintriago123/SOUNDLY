import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabaseCLient';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === 'subscription') {
          const userId = session.metadata?.user_id;
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;

          if (userId && subscriptionId) {
            // Obtener detalles de la suscripción
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            
            // Determinar el tipo de plan
            let planType = 'free';
            const priceId = subscription.items.data[0]?.price.id;
            if (priceId === process.env.STRIPE_PRICE_ID_MENSUAL) {
              planType = 'premium_monthly';
            } else if (priceId === process.env.STRIPE_PRICE_ID_ANUAL) {
              planType = 'premium_yearly';
            }

            // Crear o actualizar la suscripción en la base de datos
            const { error: subscriptionError } = await supabase
              .from('subscriptions')
              .upsert({
                user_id: userId,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                status: subscription.status,
                plan_type: planType,
                current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
                current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
                cancel_at_period_end: (subscription as any).cancel_at_period_end || false,
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'user_id',
              });

            if (subscriptionError) {
              console.error('Error upserting subscription:', subscriptionError);
            }

            // Actualizar el usuario
            const { error: userError } = await supabase
              .from('usuarios')
              .update({
                subscription_status: subscription.status,
                subscription_tier: planType,
                rol: 'premium',
                updated_at: new Date().toISOString(),
              })
              .eq('id', userId);

            if (userError) {
              console.error('Error updating user:', userError);
            }
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription;

        if (subscriptionId && typeof subscriptionId === 'string') {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.user_id;

          if (userId) {
            // Determinar el tipo de plan
            let planType = 'free';
            const priceId = subscription.items.data[0]?.price.id;
            if (priceId === process.env.STRIPE_PRICE_ID_MENSUAL) {
              planType = 'premium_monthly';
            } else if (priceId === process.env.STRIPE_PRICE_ID_ANUAL) {
              planType = 'premium_yearly';
            }

            // Actualizar la suscripción
            const { error: subscriptionError } = await supabase
              .from('subscriptions')
              .update({
                status: subscription.status,
                plan_type: planType,
                current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
                current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('stripe_subscription_id', subscriptionId);

            if (subscriptionError) {
              console.error('Error updating subscription:', subscriptionError);
            }

            // Actualizar el usuario con rol premium
            const { error: userError } = await supabase
              .from('usuarios')
              .update({
                subscription_status: subscription.status,
                subscription_tier: planType,
                rol: 'premium',
                updated_at: new Date().toISOString(),
              })
              .eq('id', userId);

            if (userError) {
              console.error('Error updating user:', userError);
            }
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription;

        if (subscriptionId && typeof subscriptionId === 'string') {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.user_id;

          if (userId) {
            // Actualizar la suscripción
            const { error: subscriptionError } = await supabase
              .from('subscriptions')
              .update({
                status: 'past_due',
                updated_at: new Date().toISOString(),
              })
              .eq('stripe_subscription_id', subscriptionId);

            if (subscriptionError) {
              console.error('Error updating subscription:', subscriptionError);
            }

            // Actualizar el usuario - cambiar rol a 'usuario' cuando el pago falla
            const { error: userError } = await supabase
              .from('usuarios')
              .update({
                subscription_status: 'past_due',
                subscription_tier: 'free',
                rol: 'usuario',
                updated_at: new Date().toISOString(),
              })
              .eq('id', userId);

            if (userError) {
              console.error('Error updating user:', userError);
            }
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (userId) {
          // Determinar el tipo de plan
          let planType = 'free';
          const priceId = subscription.items.data[0]?.price.id;
          if (priceId === process.env.STRIPE_PRICE_ID_MENSUAL) {
            planType = 'premium_monthly';
          } else if (priceId === process.env.STRIPE_PRICE_ID_ANUAL) {
            planType = 'premium_yearly';
          }

          // Actualizar la suscripción
          const { error: subscriptionError } = await supabase
            .from('subscriptions')
            .update({
              status: subscription.status,
              plan_type: planType,
              current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
              current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
              cancel_at_period_end: (subscription as any).cancel_at_period_end || false,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id);

          if (subscriptionError) {
            console.error('Error updating subscription:', subscriptionError);
          }

          // Actualizar el usuario
          const newRole = subscription.status === 'active' ? 'premium' : 'usuario';
          const { error: userError } = await supabase
            .from('usuarios')
            .update({
              subscription_status: subscription.status,
              subscription_tier: planType,
              rol: newRole,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          if (userError) {
            console.error('Error updating user:', userError);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (userId) {
          // Actualizar la suscripción
          const { error: subscriptionError } = await supabase
            .from('subscriptions')
            .update({
              status: 'canceled',
              plan_type: 'free',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id);

          if (subscriptionError) {
            console.error('Error updating subscription:', subscriptionError);
          }

          // Actualizar el usuario
          const { error: userError } = await supabase
            .from('usuarios')
            .update({
              subscription_status: 'canceled',
              subscription_tier: 'free',
              rol: 'usuario',
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          if (userError) {
            console.error('Error updating user:', userError);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook error' },
      { status: 500 }
    );
  }
}
