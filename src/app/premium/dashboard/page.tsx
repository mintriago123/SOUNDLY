
import DashboardLayout from '@/components/DashboardLayout';
import { MusicalNoteIcon, ClipboardDocumentListIcon, HeartIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header de bienvenida */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-2">
            <MusicalNoteIcon className="w-7 h-7 text-[#ba319f] mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">
              ¡Bienvenido a tu Dashboard!
            </h2>
          </div>
          <p className="text-gray-600">
            Desde aquí puedes gestionar tu biblioteca musical y acceder a todas las funcionalidades.
          </p>
        </div>

        {/* Cards de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <MusicalNoteIcon className="w-8 h-8 text-[#ba319f] mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Canciones</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ClipboardDocumentListIcon className="w-8 h-8 text-[#6e1f86] mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600">Playlists</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <HeartIcon className="w-8 h-8 text-[#e11d48] mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600">Favoritos</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ClockIcon className="w-8 h-8 text-[#6366f1] mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600">Tiempo Total</p>
                <p className="text-2xl font-bold text-gray-900">0h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Actividad Reciente</h3>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-500 py-8">
              <MusicalNoteIcon className="w-12 h-12 mx-auto mb-4 text-[#ba319f] opacity-40" />
              <p>No hay actividad reciente</p>
              <p className="text-sm mt-2">Comienza agregando música a tu biblioteca</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
