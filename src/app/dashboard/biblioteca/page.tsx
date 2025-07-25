import DashboardLayout from '../../components/DashboardLayout';

export default function BibliotecaPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Mi Biblioteca 🎵
          </h2>
          <p className="text-gray-600">
            Explora y gestiona tu colección de música
          </p>
        </div>

        {/* Controles de biblioteca */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex gap-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                ➕ Agregar Música
              </button>
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                📁 Crear Playlist
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Buscar en tu biblioteca..."
                className="border border-gray-300 rounded-lg px-3 py-2 w-64 focus:ring-2 focus:ring-blue-400 outline-none"
              />
              <button className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                🔍
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
                <button className="text-gray-500 hover:text-gray-700">📊</button>
                <button className="text-gray-500 hover:text-gray-700">📋</button>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-500 py-12">
              <div className="text-6xl mb-4">🎼</div>
              <h4 className="text-xl font-medium mb-2">Tu biblioteca está vacía</h4>
              <p className="text-gray-400 mb-6">Agrega tu primera canción para comenzar</p>
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                ➕ Agregar Primera Canción
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
                🎵
              </div>
              <div>
                <p className="font-medium text-gray-900">Sin reproducción</p>
                <p className="text-sm text-gray-500">Selecciona una canción</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="text-gray-400 hover:text-gray-600">⏮️</button>
              <button className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-700">
                ▶️
              </button>
              <button className="text-gray-400 hover:text-gray-600">⏭️</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
