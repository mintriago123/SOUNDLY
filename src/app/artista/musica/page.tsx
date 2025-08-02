'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRouter } from 'next/navigation';
import { 
  MusicalNoteIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  PlayIcon,
  PauseIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';

interface Cancion {
  id: string;
  titulo: string;
  duracion: number;
  fecha_subida: string;
  reproducciones: number;
  genero?: string;
  album?: string;
}

export default function MiMusica() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [canciones, setCanciones] = useState<Cancion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    verificarUsuarioYCargarMusica();
  }, []);

  const verificarUsuarioYCargarMusica = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Obtener datos del usuario
      const { data: userData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!userData || userData.rol !== 'artista') {
        router.push('/dashboard');
        return;
      }

      setUsuario(userData);
      await cargarCanciones(user.id);
    } catch (error) {
      console.error('Error verificando usuario:', error);
    } finally {
      setCargando(false);
    }
  };

  const cargarCanciones = async (userId: string) => {
    try {
      // En una implementación real, aquí cargarías las canciones del artista
      // Por ahora simulamos datos
      const cancionesSimuladas: Cancion[] = [
        {
          id: '1',
          titulo: 'Mi Primera Canción',
          duracion: 180,
          fecha_subida: '2024-01-15',
          reproducciones: 1250,
          genero: 'Pop',
          album: 'Debut Album'
        },
        {
          id: '2',
          titulo: 'Melodía Nocturna',
          duracion: 240,
          fecha_subida: '2024-02-20',
          reproducciones: 850,
          genero: 'Balada',
          album: 'Debut Album'
        }
      ];
      
      setCanciones(cancionesSimuladas);
    } catch (error) {
      console.error('Error cargando canciones:', error);
    }
  };

  const formatearDuracion = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <MusicalNoteIcon className="h-8 w-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">Mi Música</h1>
            </div>
            
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
              <PlusIcon className="h-4 w-4 mr-2" />
              Subir Nueva Canción
            </button>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Estadísticas Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">🎵</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Canciones</p>
                  <p className="text-2xl font-bold text-gray-900">{canciones.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">▶️</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reproducciones</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {canciones.reduce((acc, cancion) => acc + cancion.reproducciones, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">📊</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Promedio por Canción</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {canciones.length > 0 
                      ? Math.round(canciones.reduce((acc, cancion) => acc + cancion.reproducciones, 0) / canciones.length).toLocaleString()
                      : 0
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Canciones */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Mis Canciones</h3>
            </div>
            
            {canciones.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Canción
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duración
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Género
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reproducciones
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {canciones.map((cancion) => (
                      <tr key={cancion.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded bg-purple-100 flex items-center justify-center">
                                <MusicalNoteIcon className="h-5 w-5 text-purple-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {cancion.titulo}
                              </div>
                              <div className="text-sm text-gray-500">
                                {cancion.album}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatearDuracion(cancion.duracion)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cancion.genero}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cancion.reproducciones.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatearFecha(cancion.fecha_subida)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-purple-600 hover:text-purple-900">
                              <ChartBarIcon className="h-4 w-4" />
                            </button>
                            <button className="text-blue-600 hover:text-blue-900">
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <MusicalNoteIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No tienes canciones</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Comienza subiendo tu primera canción.
                </p>
                <div className="mt-6">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Subir Canción
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
    </DashboardLayout>
  );
}
