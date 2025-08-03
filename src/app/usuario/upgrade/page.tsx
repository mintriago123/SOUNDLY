'use client';

import DashboardLayout from '@/components/DashboardLayout';
import PricingDisplay from '@/components/PricingDisplay';
import { useConfiguracionGlobal } from '@/hooks/useConfiguracionGlobal';

export default function UpgradePage() {
  const { config, loading } = useConfiguracionGlobal();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Mejora tu experiencia en {config.platform_name} 🚀
          </h2>
          <p className="text-gray-600">
            Desbloquea todas las características premium y lleva tu música al siguiente nivel
          </p>
        </div>

        {/* Pricing Component */}
        <PricingDisplay />

        {/* Características destacadas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            ¿Por qué elegir Premium?
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Audio de Alta Calidad</h4>
              <p className="text-sm text-gray-600">
                Disfruta de audio hasta {config.max_audio_bitrate}kbps para la mejor experiencia auditiva
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Descargas Offline</h4>
              <p className="text-sm text-gray-600">
                Descarga tu música favorita y escúchala sin conexión a internet
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Sin Límites</h4>
              <p className="text-sm text-gray-600">
                Crea playlists ilimitadas y sigue a todos tus artistas favoritos
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Preguntas Frecuentes
          </h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                ¿Puedo cancelar mi suscripción en cualquier momento?
              </h4>
              <p className="text-sm text-gray-600">
                Sí, puedes cancelar tu suscripción Premium en cualquier momento desde tu configuración de cuenta.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                ¿Qué formatos de audio soportan?
              </h4>
              <p className="text-sm text-gray-600">
                Soportamos los siguientes formatos: {config.allowed_formats.join(', ').toUpperCase()}.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                ¿Hay algún descuento por pago anual?
              </h4>
              <p className="text-sm text-gray-600">
                Sí, al elegir el plan anual ahorras un {config.premium_discount_yearly}% comparado con el pago mensual.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                ¿Cómo contacto al soporte?
              </h4>
              <p className="text-sm text-gray-600">
                Puedes contactarnos en {config.support_email} para cualquier consulta o problema.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
