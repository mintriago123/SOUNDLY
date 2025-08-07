'use client';

import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  SparklesIcon,
  MusicalNoteIcon,
  ArrowDownTrayIcon,
  NoSymbolIcon,
  QueueListIcon,
  ChartBarIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

export default function UpgradePage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-8 text-white">
          <div className="flex justify-center mb-4">
            <SparklesIcon className="h-16 w-16" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            ¡Desbloquea Soundly Premium!
          </h1>
          <p className="text-purple-100 text-lg">
            Accede a funciones exclusivas y disfruta de la mejor experiencia musical
          </p>
        </div>

        {/* Características Premium */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-center mb-4">
              <MusicalNoteIcon className="h-12 w-12 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Música en HD</h3>
            <p className="text-gray-600">
              Disfruta de calidad de audio superior con archivos sin comprimir
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-center mb-4">
              <ArrowDownTrayIcon className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Descargas Ilimitadas</h3>
            <p className="text-gray-600">
              Descarga toda tu música favorita para escuchar sin conexión
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-center mb-4">
              <NoSymbolIcon className="h-12 w-12 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Sin Anuncios</h3>
            <p className="text-gray-600">
              Disfruta de tu música sin interrupciones publicitarias
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-center mb-4">
              <QueueListIcon className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Playlists Ilimitadas</h3>
            <p className="text-gray-600">
              Crea tantas playlists como quieras sin límites
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-center mb-4">
              <ChartBarIcon className="h-12 w-12 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Estadísticas Avanzadas</h3>
            <p className="text-gray-600">
              Analiza tus hábitos de escucha con métricas detalladas
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-center mb-4">
              <BoltIcon className="h-12 w-12 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Acceso Prioritario</h3>
            <p className="text-gray-600">
              Velocidad de carga más rápida y acceso anticipado a nuevas funciones
            </p>
          </div>
        </div>

        {/* Planes de Precio */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Elige tu Plan Premium
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Plan Mensual */}
            <div className="border-2 border-purple-200 rounded-lg p-6 hover:border-purple-400 transition-colors">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Mensual</h3>
                <div className="text-3xl font-bold text-purple-600 mb-1">$9.99</div>
                <div className="text-gray-500 text-sm mb-6">por mes</div>
                
                <button className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 transition-colors">
                  Comenzar Gratis
                </button>
                
                <p className="text-xs text-gray-500 mt-3">
                  Prueba gratuita de 7 días
                </p>
              </div>
            </div>

            {/* Plan Anual */}
            <div className="border-2 border-pink-400 rounded-lg p-6 bg-gradient-to-br from-pink-50 to-purple-50 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  ¡Más Popular!
                </span>
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Anual</h3>
                <div className="text-3xl font-bold text-pink-600 mb-1">$99.99</div>
                <div className="text-gray-500 text-sm mb-2">por año</div>
                <div className="text-green-600 text-sm font-medium mb-4">
                  ¡Ahorra $20 al año!
                </div>
                
                <button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all">
                  Comenzar Gratis
                </button>
                
                <p className="text-xs text-gray-500 mt-3">
                  Prueba gratuita de 14 días
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Botón de regreso */}
        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Regresar al Dashboard
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
