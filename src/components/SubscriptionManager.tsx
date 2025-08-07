'use client';

import { useState } from 'react';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';

interface SubscriptionManagerProps {
  userId: string;
}

export default function SubscriptionManager({ userId }: SubscriptionManagerProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const {
    subscription,
    loading,
    error,
    manageSubscription,
    hasActiveSubscription,
    isPremium,
    getPlanType,
    willCancelAtPeriodEnd,
    getCurrentPeriodEnd,
    fetchSubscription,
  } = useStripeSubscription(userId);

  const handleAction = async (action: 'cancel' | 'reactivate' | 'cancel_immediately') => {
    try {
      setActionLoading(action);
      await manageSubscription(action, userId);
      await fetchSubscription(userId);
    } catch (err) {
      console.error('Error performing action:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPlanDisplayName = (planType: string) => {
    switch (planType) {
      case 'premium_monthly':
        return 'Premium Mensual';
      case 'premium_yearly':
        return 'Premium Anual';
      case 'free':
      default:
        return 'Gratuito';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'canceled':
        return 'Cancelada';
      case 'past_due':
        return 'Pago vencido';
      case 'incomplete':
        return 'Incompleta';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!subscription || !hasActiveSubscription()) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Sin suscripción activa</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Actualmente tienes un plan gratuito. Actualiza para obtener características premium.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Gestión de Suscripción
        </h3>

        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Plan</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {getPlanDisplayName(getPlanType())}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Estado</dt>
            <dd className="mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                {getStatusDisplayName(subscription.status)}
              </span>
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Próximo cobro</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {formatDate(getCurrentPeriodEnd())}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Cancelación automática</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {willCancelAtPeriodEnd() ? 'Sí' : 'No'}
            </dd>
          </div>
        </dl>

        {willCancelAtPeriodEnd() && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Suscripción programada para cancelar
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Tu suscripción se cancelará automáticamente el {formatDate(getCurrentPeriodEnd())}. 
                    Podrás seguir usando las características premium hasta esa fecha.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex space-x-3">
          {willCancelAtPeriodEnd() ? (
            <button
              onClick={() => handleAction('reactivate')}
              disabled={actionLoading !== null}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === 'reactivate' ? 'Reactivando...' : 'Reactivar suscripción'}
            </button>
          ) : (
            <button
              onClick={() => handleAction('cancel')}
              disabled={actionLoading !== null}
              className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === 'cancel' ? 'Cancelando...' : 'Cancelar al final del período'}
            </button>
          )}

          <button
            onClick={() => handleAction('cancel_immediately')}
            disabled={actionLoading !== null}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'cancel_immediately' ? 'Cancelando...' : 'Cancelar inmediatamente'}
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p>
            • <strong>Cancelar al final del período:</strong> Seguirás teniendo acceso premium hasta {formatDate(getCurrentPeriodEnd())}
          </p>
          <p>
            • <strong>Cancelar inmediatamente:</strong> Perderás el acceso premium de inmediato (sin reembolso)
          </p>
        </div>
      </div>
    </div>
  );
}
