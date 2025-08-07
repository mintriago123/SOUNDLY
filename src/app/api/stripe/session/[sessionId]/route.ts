import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabaseCLient';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const params = await context.params;
    const sessionId = params.sessionId;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID es requerido' },
        { status: 400 }
      );
    }

    // Obtener la sesión de Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el pago fue exitoso
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'El pago no ha sido completado' },
        { status: 400 }
      );
    }

    // Si es una suscripción, verificar que el usuario esté actualizado correctamente
    if (session.mode === 'subscription' && session.metadata?.user_id) {
      const supabase = await createClient();
      
      // Verificar el estado actual del usuario
      const { data: user, error: userError } = await supabase
        .from('usuarios')
        .select('rol, subscription_status')
        .eq('id', session.metadata.user_id)
        .single();

      if (userError) {
        console.error('Error fetching user:', userError);
      } else if (user && user.rol !== 'premium') {
        // Si el rol no está actualizado, forzar la actualización
        console.log(`Actualizando rol de usuario ${session.metadata.user_id} a premium`);
        
        const { error: updateError } = await supabase
          .from('usuarios')
          .update({
            rol: 'premium',
            subscription_status: 'active',
            subscription_tier: 'premium_monthly', // Asumimos mensual por defecto
            updated_at: new Date().toISOString(),
          })
          .eq('id', session.metadata.user_id);

        if (updateError) {
          console.error('Error updating user role:', updateError);
        } else {
          console.log(`Usuario ${session.metadata.user_id} actualizado a premium exitosamente`);
        }
      }
    }

    const response = {
      customer_email: session.customer_details?.email || '',
      amount_total: session.amount_total || 0,
      currency: session.currency || 'eur',
      subscription_id: typeof session.subscription === 'string' ? session.subscription : (session.subscription as any)?.id || '',
      status: session.status || '',
      payment_status: session.payment_status,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error retrieving session:', error);
    return NextResponse.json(
      { error: 'Error al obtener la información de la sesión' },
      { status: 500 }
    );
  }
}
