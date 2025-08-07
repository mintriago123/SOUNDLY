'use client';

import { useConfiguracionGlobal } from '@/hooks/useConfiguracionGlobal';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseCLient';
import { loadStripe } from '@stripe/stripe-js';

// Inicializar Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PricingCardProps {
  title: string;
  price: number;
  period: string;
  features: string[];
  isPopular?: boolean;
  discount?: number;
  savings?: number;
  priceId?: string;
  onSubscribe?: (priceId: string) => void;
  isCurrentPlan?: boolean;
  loading?: boolean;
}

function PricingCard({ 
  title, 
  price, 
  period, 
  features, 
  isPopular = false, 
  discount, 
  savings,
  priceId,
  onSubscribe,
  isCurrentPlan = false,
  loading = false,
}: Readonly<PricingCardProps>) {
  const handleSubscribe = () => {
    if (priceId && onSubscribe && !isCurrentPlan) {
      onSubscribe(priceId);
    }
  };

  return (
    <div className={`relative rounded-lg border-2 p-6 ${
      isPopular 
        ? 'border-blue-500 bg-blue-50' 
        : isCurrentPlan
        ? 'border-green-500 bg-green-50'
        : 'border-gray-200 bg-white'
    }`}>
      {isPopular && !isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            Más Popular
          </span>
        </div>
      )}
      
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            Plan Actual
          </span>
        </div>
      )}
      
      {discount && discount > 0 && (
        <div className="absolute top-4 right-4">
          <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
            -{discount}%
          </span>
        </div>
      )}

      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <div className="mb-4">
          <span className="text-3xl font-bold text-gray-900">€{price.toFixed(2)}</span>
          <span className="text-gray-600 ml-1">/{period}</span>
        </div>
        
        {savings && savings > 0 && (
          <p className="text-green-600 text-sm mb-4">
            Ahorras €{savings.toFixed(2)} al año
          </p>
        )}
      </div>

      <ul className="space-y-3 mb-6">
        {features.map((feature) => (
          <li key={feature} className="flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-700 text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      <button 
        onClick={handleSubscribe}
        disabled={loading || isCurrentPlan || (price > 0 && !priceId)}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          isCurrentPlan
            ? 'bg-green-100 text-green-800'
            : isPopular
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
        }`}
      >
        {loading ? 'Procesando...' : 
         isCurrentPlan ? 'Plan Actual' :
         price === 0 ? 'Plan Actual' : 'Suscribirse'}
      </button>
    </div>
  );
}

export default function PricingDisplay() {
  const { config, loading: configLoading, getPremiumPricing } = useConfiguracionGlobal();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  
  const { 
    prices, 
    subscription, 
    createCheckoutSession, 
    isPremium, 
    getPlanType 
  } = useStripeSubscription(currentUser?.id);

  // Obtener usuario actual
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error getting current user:', error);
      } finally {
        setUserLoading(false);
      }
    };

    getCurrentUser();
  }, []);

  const handleSubscribe = async (priceId: string) => {
    if (!currentUser) {
      // Redirigir al login si no está autenticado
      window.location.href = '/auth/login';
      return;
    }

    try {
      setSubscribing(true);
      const sessionId = await createCheckoutSession(priceId, currentUser.id);
      
      // Redirigir a Stripe Checkout
      const stripe = await stripePromise;
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          console.error('Error redirecting to checkout:', error);
        }
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setSubscribing(false);
    }
  };

  if (configLoading || userLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando precios...</span>
      </div>
    );
  }

  const pricing = getPremiumPricing();
  const currentPlanType = getPlanType();

  const freeFeatures = [
    `Hasta ${config.max_playlists_free} playlists`,
    `Hasta ${config.max_followers_free} seguidores`,
    `Subir hasta ${config.max_uploads_per_day} canciones/día`,
    'Reproductor básico',
    'Búsqueda de música',
    'Perfil público'
  ];

  const premiumFeatures = [
    'Playlists ilimitadas',
    'Seguidores ilimitados',
    'Audio de alta calidad (320kbps)',
    'Descargas offline',
    'Sin anuncios',
    'Ecualizador personalizado',
    'Analíticas avanzadas',
    'Soporte prioritario'
  ];

  const artistFeatures = [
    'Todas las características Premium',
    'Subidas ilimitadas',
    'Analíticas detalladas',
    'Monetización de contenido',
    'Perfil de artista verificado',
    'Promoción de contenido',
    'Herramientas de marketing',
    'API para desarrolladores'
  ];

  // Usar precios de Stripe si están disponibles, sino usar configuración
  const monthlyPrice = prices.monthly?.amount || pricing.monthly;
  const yearlyPrice = prices.yearly?.amount || (pricing.yearly / 12);
  const yearlyTotal = prices.yearly?.amount ? (prices.yearly.amount * 12) : pricing.yearly;
  const actualSavings = (monthlyPrice * 12) - yearlyTotal;
  const actualDiscount = Math.round((actualSavings / (monthlyPrice * 12)) * 100);

  return (
    <div className="bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Planes de {config.platform_name}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {config.platform_description}. Elige el plan que mejor se adapte a tus necesidades musicales.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Plan Gratuito */}
          <PricingCard
            title="Gratuito"
            price={0}
            period="siempre"
            features={freeFeatures}
            isCurrentPlan={currentPlanType === 'free' || !isPremium()}
            loading={subscribing}
          />

          {/* Plan Premium Mensual */}
          <PricingCard
            title="Premium"
            price={monthlyPrice}
            period="mes"
            features={premiumFeatures}
            isPopular={true}
            priceId={prices.monthly?.id || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MENSUAL}
            onSubscribe={handleSubscribe}
            isCurrentPlan={currentPlanType === 'premium_monthly'}
            loading={subscribing}
          />

          {/* Plan Premium Anual */}
          <PricingCard
            title="Premium Anual"
            price={yearlyPrice}
            period="mes"
            features={[...premiumFeatures, 'Facturación anual']}
            discount={actualDiscount}
            savings={actualSavings}
            priceId={prices.yearly?.id || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ANUAL}
            onSubscribe={handleSubscribe}
            isCurrentPlan={currentPlanType === 'premium_yearly'}
            loading={subscribing}
          />
        </div>

        {/* Plan de Artista */}
        {config.artist_verification_enabled && (
          <div className="mt-12 max-w-2xl mx-auto">
            <PricingCard
              title="Artista Verificado"
              price={config.artist_verification_fee}
              period={config.artist_verification_fee === 0 ? 'gratis' : 'una vez'}
              features={artistFeatures}
              loading={subscribing}
            />
          </div>
        )}

        {/* Información adicional */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow p-6 max-w-3xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Información de Facturación
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p className="mb-2">
                  <strong>Comisión de la plataforma:</strong> {config.commission_percentage}%
                </p>
                <p className="mb-2">
                  <strong>Formatos soportados:</strong> {config.allowed_formats.join(', ').toUpperCase()}
                </p>
              </div>
              <div>
                <p className="mb-2">
                  <strong>Tamaño máximo de archivo:</strong> {config.max_file_size}MB
                </p>
                <p className="mb-2">
                  <strong>Soporte:</strong> {config.support_email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Estado de suscripción actual */}
        {currentUser && isPremium() && subscription && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-3xl mx-auto">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-blue-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-800">
                  ¡Tienes acceso Premium activo!
                </h4>
                <p className="text-sm text-blue-700">
                  Tu suscripción {getPlanType() === 'premium_monthly' ? 'mensual' : 'anual'} está activa.
                  {subscription?.cancel_at_period_end && subscription?.current_period_end && (
                    <span className="font-medium"> Se cancelará el {new Date(subscription.current_period_end).toLocaleDateString('es-ES')}.</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modo Mantenimiento */}
        {config.maintenance_mode && (
          <div className="mt-8 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded max-w-3xl mx-auto">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Sistema en Mantenimiento
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>{config.maintenance_message}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
