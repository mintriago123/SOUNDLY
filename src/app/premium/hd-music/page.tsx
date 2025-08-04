'use client';


import DashboardLayout from '../../../components/DashboardLayout';
import { MusicalNoteIcon, CloudArrowDownIcon, NoSymbolIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function HDMusicPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-3">
            {/* Waveform/HD icon */}
            <svg className="w-8 h-8 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h2m2 0h2m2 0h2m2 0h2m2 0h2M7 8v8m4-12v16m4-12v8" />
            </svg>
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
              <MusicalNoteIcon className="w-12 h-12 mx-auto mb-4 text-[#ba319f] opacity-40" />
              <p className="text-lg font-medium">¡Tu música HD aparecerá aquí!</p>
              <p className="text-sm mt-2">Sube música o descubre contenido en calidad HD</p>
            </div>
          </div>
        </div>

        {/* Ventajas Premium */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h2m2 0h2m2 0h2m2 0h2m2 0h2M7 8v8m4-12v16m4-12v8" />
            </svg>
            Ventajas de ser Premium
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <CloudArrowDownIcon className="w-8 h-8 mx-auto mb-2 text-[#6e1f86]" />
              <p className="font-medium">Descargas Ilimitadas</p>
            </div>
            <div className="text-center">
              <NoSymbolIcon className="w-8 h-8 mx-auto mb-2 text-[#e11d48]" />
              <p className="font-medium">Sin Anuncios</p>
            </div>
            <div className="text-center">
              <ChartBarIcon className="w-8 h-8 mx-auto mb-2 text-[#22c55e]" />
              <p className="font-medium">Estadísticas Avanzadas</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
