import Link from 'next/link';

export default function Error403() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 mb-6">
            No tienes permisos para acceder a esta página. Esta sección está reservada para administradores.
          </p>
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-block"
            >
              Ir al Dashboard
            </Link>
            <Link
              href="/"
              className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors inline-block"
            >
              Ir al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
