import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseCLient';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID es requerido' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verificar si el usuario tiene una suscripción activa
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('status, plan_type')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error('Error fetching subscription:', subscriptionError);
      return NextResponse.json(
        { error: 'Error al verificar suscripción' },
        { status: 500 }
      );
    }

    // Obtener el usuario actual
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('rol, subscription_status, subscription_tier')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    let needsUpdate = false;
    let updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Si tiene suscripción activa pero el rol no es premium
    if (subscription && user.rol !== 'premium') {
      needsUpdate = true;
      updateData.rol = 'premium';
      updateData.subscription_status = 'active';
      updateData.subscription_tier = subscription.plan_type;
      
      console.log(`Usuario ${userId} tiene suscripción activa pero rol incorrecto. Actualizando a premium.`);
    }
    // Si no tiene suscripción activa pero el rol es premium
    else if (!subscription && user.rol === 'premium') {
      needsUpdate = true;
      updateData.rol = 'usuario';
      updateData.subscription_status = 'inactive';
      updateData.subscription_tier = 'free';
      
      console.log(`Usuario ${userId} no tiene suscripción activa pero tiene rol premium. Actualizando a usuario.`);
    }

    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user:', updateError);
        return NextResponse.json(
          { error: 'Error al actualizar usuario' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Rol de usuario actualizado correctamente',
        updated: true,
        newRole: updateData.rol,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'El rol del usuario ya está correcto',
      updated: false,
      currentRole: user.rol,
    });

  } catch (error) {
    console.error('Error in role sync:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
