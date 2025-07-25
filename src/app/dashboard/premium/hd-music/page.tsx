'use client';

import DashboardLayout from '../../../components/DashboardLayout';

export default function HDMusicPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">💎</span>
            <div>
              <h1 className="text-2xl font-bold">Música en HD</h1>
              <p className="text-purple-100">Calidad de audio superior sin comprimir</p>
            </div>
          </div>
        </div>

        {/* Información sobre HD */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">¿Qué es la Música HD?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Calidad Estándar</h3>
              <ul className="text-gray-600 space-y-1">
                <li>• 128 kbps</li>
                <li>• Compresión con pérdida</li>
                <li>• Tamaño reducido</li>
                <li>• Para usuarios gratuitos</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Calidad HD Premium</h3>
              <ul className="text-purple-600 space-y-1">
                <li>• 320 kbps - 1411 kbps</li>
                <li>• Sin compresión o mínima</li>
                <li>• Calidad de estudio</li>
                <li>• Solo para usuarios Premium</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Lista de música HD */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Tu Biblioteca HD</h3>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-4">🎵</div>
              <p className="text-lg font-medium">¡Tu música HD aparecerá aquí!</p>
              <p className="text-sm mt-2">Sube música o descubre contenido en calidad HD</p>
            </div>
          </div>
        </div>

        {/* Ventajas Premium */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            💎 Ventajas de ser Premium
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl mb-2">⬇️</div>
              <p className="font-medium">Descargas Ilimitadas</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🚫</div>
              <p className="font-medium">Sin Anuncios</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📈</div>
              <p className="font-medium">Estadísticas Avanzadas</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
