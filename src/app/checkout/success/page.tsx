'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

interface SessionData {
  customer_email: string;
  amount_total: number;
  currency: string;
  subscription_id: string;
  status: string;
}

export default function CheckoutSuccessPage() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) {
        setError('No se encontró el ID de sesión');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/stripe/session/${sessionId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al verificar el pago');
        }

        setSession(data);
      } catch (err) {
        console.error('Error fetching session:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Verificando pago...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error en el pago</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <Link
                    href="/usuario/upgrade"
                    className="text-sm font-medium text-red-800 underline hover:text-red-600"
                  >
                    Volver a intentar
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-green-800">
                ¡Pago realizado con éxito! 🎉
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Tu suscripción premium ha sido activada correctamente.</p>
              </div>
            </div>
          </div>
        </div>

        {session && (
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Detalles de la Suscripción
              </h3>
              
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{session.customer_email}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Estado</dt>
                  <dd className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {session.status === 'complete' ? 'Completado' : session.status}
                    </span>
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Monto</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    €{(session.amount_total / 100).toFixed(2)} {session.currency.toUpperCase()}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">ID de Suscripción</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">
                    {session.subscription_id}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            ¿Qué sigue?
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Ya puedes disfrutar de todas las características premium</li>
            <li>• Descarga música para escuchar offline</li>
            <li>• Disfruta de audio de alta calidad</li>
            <li>• Crea playlists ilimitadas</li>
          </ul>
        </div>

        <div className="mt-8 flex justify-center space-x-4">
          <Link
            href="/usuario/dashboard"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Ir al Dashboard
          </Link>
          <Link
            href="/usuario/configuracion"
            className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            Configuración
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
