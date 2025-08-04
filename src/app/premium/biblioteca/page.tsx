import DashboardLayout from '../../../components/DashboardLayout';
import { MusicalNoteIcon, PlusCircleIcon, FolderPlusIcon, MagnifyingGlassIcon, ChartBarIcon, ClipboardDocumentListIcon, PlayCircleIcon, BackwardIcon, ForwardIcon } from '@heroicons/react/24/outline';

export default function BibliotecaPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-2">
            <MusicalNoteIcon className="w-7 h-7 text-[#ba319f] mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">
              Mi Biblioteca
            </h2>
          </div>
          <p className="text-gray-600">
            Explora y gestiona tu colección de música
          </p>
        </div>

        {/* Controles de biblioteca */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex gap-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <PlusCircleIcon className="w-5 h-5" /> Agregar Música
              </button>
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                <FolderPlusIcon className="w-5 h-5" /> Crear Playlist
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Buscar en tu biblioteca..."
                className="border border-gray-300 rounded-lg px-3 py-2 w-64 focus:ring-2 focus:ring-blue-400 outline-none"
              />
              <button className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center" title="Buscar" aria-label="Buscar">
                <MagnifyingGlassIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Vista de biblioteca */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Canciones</h3>
              <div className="flex gap-2">
                <button className="text-gray-500 hover:text-gray-700" title="Ver estadísticas" aria-label="Ver estadísticas"><ChartBarIcon className="w-5 h-5" /></button>
                <button className="text-gray-500 hover:text-gray-700" title="Ver como lista" aria-label="Ver como lista"><ClipboardDocumentListIcon className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-500 py-12">
              <MusicalNoteIcon className="w-14 h-14 mx-auto mb-4 text-[#ba319f] opacity-40" />
              <h4 className="text-xl font-medium mb-2">Tu biblioteca está vacía</h4>
              <p className="text-gray-400 mb-6">Agrega tu primera canción para comenzar</p>
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <PlusCircleIcon className="w-5 h-5" /> Agregar Primera Canción
              </button>
            </div>
          </div>
        </div>

        {/* Reproductor rápido */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Reproductor Rápido</h3>
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-300 rounded-lg flex items-center justify-center">
                <MusicalNoteIcon className="w-7 h-7 text-[#ba319f]" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Sin reproducción</p>
                <p className="text-sm text-gray-500">Selecciona una canción</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="text-gray-400 hover:text-gray-600" title="Anterior" aria-label="Anterior"><BackwardIcon className="w-6 h-6" /></button>
              <button className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-700" title="Reproducir" aria-label="Reproducir">
                <PlayCircleIcon className="w-7 h-7" />
              </button>
              <button className="text-gray-400 hover:text-gray-600" title="Siguiente" aria-label="Siguiente"><ForwardIcon className="w-6 h-6" /></button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
