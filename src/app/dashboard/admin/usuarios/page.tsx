import DashboardLayout from '../../../components/DashboardLayout';

export default function AdminUsuariosPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Gestión de Usuarios 👥
          </h2>
          <p className="text-gray-600">
            Administra los usuarios de la plataforma Soundly
          </p>
        </div>

        {/* Estadísticas de usuarios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">👤</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">✅</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
                <p className="text-2xl font-bold text-green-600">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">⏱️</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Nuevos (Este mes)</p>
                <p className="text-2xl font-bold text-blue-600">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de usuarios */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Lista de Usuarios</h3>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Agregar Usuario
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-4">👥</div>
              <p>No hay usuarios registrados</p>
              <p className="text-sm mt-2">Los usuarios aparecerán aquí cuando se registren</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
