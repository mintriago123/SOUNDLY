'use client';

import DashboardLayout from '../../../components/DashboardLayout';
import { CloudArrowDownIcon, DevicePhoneMobileIcon, ServerStackIcon, CloudIcon, InfinityIcon, LightBulbIcon } from '@heroicons/react/24/outline';

export default function DownloadsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-3">
            <CloudArrowDownIcon className="w-8 h-8 text-white drop-shadow" />
            <div>
              <h1 className="text-2xl font-bold">Mis Descargas</h1>
              <p className="text-pink-100">Música disponible sin conexión</p>
            </div>
          </div>
        </div>

        {/* Estadísticas de descarga */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 border border-pink-100">
            <div className="flex items-center">
              <DevicePhoneMobileIcon className="w-8 h-8 text-purple-500 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600">Canciones Descargadas</p>
                <p className="text-2xl font-bold text-purple-700">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-pink-100">
            <div className="flex items-center">
              <ServerStackIcon className="w-8 h-8 text-pink-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600">Espacio Usado</p>
                <p className="text-2xl font-bold text-pink-700">0 MB</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-pink-100">
            <div className="flex items-center">
              <CloudIcon className="w-8 h-8 text-purple-400 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600">Espacio Disponible</p>
                <p className="text-2xl font-bold text-pink-600">∞ GB</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de descargas */}
        <div className="bg-white rounded-lg shadow border border-pink-100">
          <div className="p-6 border-b border-pink-100">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-purple-900">Música Descargada</h3>
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors">
                Sincronizar
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-500 py-8">
              <CloudArrowDownIcon className="w-12 h-12 mx-auto mb-4 text-pink-400 opacity-40" />
              <p className="text-lg font-medium text-purple-900">¡No hay descargas aún!</p>
              <p className="text-sm mt-2">Ve a tu biblioteca y descarga música para escuchar sin conexión</p>
              <button className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors">
                Explorar Música
              </button>
            </div>
          </div>
        </div>

        {/* Consejos */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6">
          <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
            <LightBulbIcon className="w-6 h-6 text-yellow-400" /> Consejos para Descargas
          </h3>
          <ul className="text-purple-800 space-y-2">
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
