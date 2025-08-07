'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseCLient';

interface SubscriptionData {
  id: string;
  status: string;
  plan_type: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string;
}

interface StripePrice {
  id: string;
  amount: number;
  currency: string;
  interval: string;
  product: any;
}

interface StripePrices {
  monthly: StripePrice | null;
  yearly: StripePrice | null;
}

export function useStripeSubscription(userId?: string) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [prices, setPrices] = useState<StripePrices>({ monthly: null, yearly: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener suscripción actual del usuario
  const fetchSubscription = async (userIdParam?: string) => {
    const targetUserId = userIdParam || userId;
    if (!targetUserId) return;

    try {
      setLoading(true);
      const supabase = createClient();
      
      const { data, error: supabaseError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (supabaseError && supabaseError.code !== 'PGRST116') {
        throw new Error(supabaseError.message);
      }

      // Asegurar que los datos sean válidos antes de establecerlos
      if (data && typeof data === 'object') {
        setSubscription(data);
      } else {
        setSubscription(null);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Obtener precios desde Stripe
  const fetchPrices = async () => {
    try {
      const response = await fetch('/api/stripe/prices');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener precios');
      }

      setPrices(data);
    } catch (err) {
      console.error('Error fetching prices:', err);
      setError(err instanceof Error ? err.message : 'Error al obtener precios');
    }
  };

  // Crear sesión de checkout
  const createCheckoutSession = async (priceId: string, userIdParam?: string) => {
    const targetUserId = userIdParam || userId;
    if (!targetUserId) {
      throw new Error('User ID es requerido');
    }

    try {
      setLoading(true);
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId: targetUserId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear sesión de pago');
      }

      return data.sessionId;
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError(err instanceof Error ? err.message : 'Error al crear sesión de pago');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Gestionar suscripción (cancelar, reactivar, etc.)
  const manageSubscription = async (action: 'cancel' | 'reactivate' | 'cancel_immediately', userIdParam?: string) => {
    const targetUserId = userIdParam || userId;
    if (!targetUserId) {
      throw new Error('User ID es requerido');
    }

    try {
      setLoading(true);
      const response = await fetch('/api/stripe/manage-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          userId: targetUserId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al gestionar suscripción');
      }

      // Actualizar la suscripción local
      if (subscription) {
        setSubscription({
          ...subscription,
          status: data.subscription.status,
          cancel_at_period_end: data.subscription.cancel_at_period_end,
        });
      }

      return data;
    } catch (err) {
      console.error('Error managing subscription:', err);
      setError(err instanceof Error ? err.message : 'Error al gestionar suscripción');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Verificar si el usuario tiene una suscripción activa
  const hasActiveSubscription = () => {
    return subscription && subscription.status === 'active';
  };

  // Verificar si el usuario es premium
  const isPremium = () => {
    return hasActiveSubscription() && subscription?.plan_type !== 'free';
  };

  // Obtener el tipo de plan
  const getPlanType = () => {
    return subscription?.plan_type || 'free';
  };

  // Verificar si la suscripción será cancelada al final del período
  const willCancelAtPeriodEnd = () => {
    return subscription?.cancel_at_period_end || false;
  };

  // Obtener fecha de fin del período actual
  const getCurrentPeriodEnd = () => {
    if (!subscription?.current_period_end) return null;
    return new Date(subscription.current_period_end);
  };

  useEffect(() => {
    if (userId) {
      fetchSubscription(userId);
    }
    fetchPrices();
  }, [userId]);

  return {
    subscription,
    prices,
    loading,
    error,
    fetchSubscription,
    fetchPrices,
    createCheckoutSession,
    manageSubscription,
    hasActiveSubscription,
    isPremium,
    getPlanType,
    willCancelAtPeriodEnd,
    getCurrentPeriodEnd,
    clearError: () => setError(null),
  };
}
