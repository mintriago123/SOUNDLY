'use client';

import DashboardLayout from '../../../components/DashboardLayout';

export default function DownloadsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">⬇️</span>
            <div>
              <h1 className="text-2xl font-bold">Mis Descargas</h1>
              <p className="text-green-100">Música disponible sin conexión</p>
            </div>
          </div>
        </div>

        {/* Estadísticas de descarga */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📱</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Canciones Descargadas</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">💾</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Espacio Usado</p>
                <p className="text-2xl font-bold text-gray-900">0 MB</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">☁️</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Espacio Disponible</p>
                <p className="text-2xl font-bold text-green-600">∞ GB</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de descargas */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Música Descargada</h3>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Sincronizar
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-4">⬇️</div>
              <p className="text-lg font-medium">¡No hay descargas aún!</p>
              <p className="text-sm mt-2">Ve a tu biblioteca y descarga música para escuchar sin conexión</p>
              <button className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                Explorar Música
              </button>
            </div>
          </div>
        </div>

        {/* Consejos */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3">
            💡 Consejos para Descargas
          </h3>
          <ul className="text-blue-800 space-y-2">
            <li>• Las descargas están disponibles solo con conexión a internet</li>
            <li>• Puedes descargar en calidad HD si tienes Premium</li>
            <li>• Las descargas se sincronizan automáticamente</li>
            <li>• No hay límite de almacenamiento para usuarios Premium</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
