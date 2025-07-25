'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/app/components/SupabaseProvider';
import { useRouter } from 'next/navigation';
import { 
  ChartBarIcon, 
  EyeIcon, 
  HeartIcon,
  MusicalNoteIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon 
} from '@heroicons/react/24/outline';

interface EstadisticasCancion {
  id: string;
  titulo: string;
  reproducciones: number;
  favoritos: number;
  descargas: number;
  cambioSemanal: number;
}

interface EstadisticasGenerales {
  totalReproducciones: number;
  totalFavoritos: number;
  totalDescargas: number;
  seguidores: number;
  cambioMensual: {
    reproducciones: number;
    favoritos: number;
    seguidores: number;
  };
}

export default function EstadisticasArtista() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [estadisticasGenerales, setEstadisticasGenerales] = useState<EstadisticasGenerales>({
    totalReproducciones: 0,
    totalFavoritos: 0,
    totalDescargas: 0,
    seguidores: 0,
    cambioMensual: {
      reproducciones: 0,
      favoritos: 0,
      seguidores: 0
    }
  });
  const [estadisticasCanciones, setEstadisticasCanciones] = useState<EstadisticasCancion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    verificarUsuarioYCargarEstadisticas();
  }, []);

  const verificarUsuarioYCargarEstadisticas = async () => {
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
      await cargarEstadisticas(user.id);
    } catch (error) {
      console.error('Error verificando usuario:', error);
    } finally {
      setCargando(false);
    }
  };

  const cargarEstadisticas = async (userId: string) => {
    try {
      // Simulamos datos de estadísticas
      const estadisticasGeneralesSimuladas: EstadisticasGenerales = {
        totalReproducciones: 15420,
        totalFavoritos: 892,
        totalDescargas: 234,
        seguidores: 1456,
        cambioMensual: {
          reproducciones: 15.8,
          favoritos: 12.3,
          seguidores: 8.7
        }
      };

      const estadisticasCancionesSimuladas: EstadisticasCancion[] = [
        {
          id: '1',
          titulo: 'Mi Primera Canción',
          reproducciones: 8750,
          favoritos: 456,
          descargas: 123,
          cambioSemanal: 12.5
        },
        {
          id: '2',
          titulo: 'Melodía Nocturna',
          reproducciones: 6670,
          favoritos: 436,
          descargas: 111,
          cambioSemanal: -3.2
        }
      ];
      
      setEstadisticasGenerales(estadisticasGeneralesSimuladas);
      setEstadisticasCanciones(estadisticasCancionesSimuladas);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const formatearNumero = (numero: number) => {
    return numero.toLocaleString('es-ES');
  };

  const formatearPorcentaje = (porcentaje: number) => {
    const signo = porcentaje >= 0 ? '+' : '';
    return `${signo}${porcentaje.toFixed(1)}%`;
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando estadísticas...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Estadísticas Generales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reproducciones</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatearNumero(estadisticasGenerales.totalReproducciones)}
                  </p>
                  <div className="flex items-center mt-2">
                    {estadisticasGenerales.cambioMensual.reproducciones >= 0 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${
                      estadisticasGenerales.cambioMensual.reproducciones >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {formatearPorcentaje(estadisticasGenerales.cambioMensual.reproducciones)} este mes
                    </span>
                  </div>
                </div>
                <div className="text-3xl">▶️</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Favoritos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatearNumero(estadisticasGenerales.totalFavoritos)}
                  </p>
                  <div className="flex items-center mt-2">
                    {estadisticasGenerales.cambioMensual.favoritos >= 0 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${
                      estadisticasGenerales.cambioMensual.favoritos >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {formatearPorcentaje(estadisticasGenerales.cambioMensual.favoritos)} este mes
                    </span>
                  </div>
                </div>
                <div className="text-3xl">❤️</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Descargas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatearNumero(estadisticasGenerales.totalDescargas)}
                  </p>
                  <div className="flex items-center mt-2">
                    <span className="text-sm text-gray-600">Solo usuarios premium</span>
                  </div>
                </div>
                <div className="text-3xl">⬇️</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Seguidores</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatearNumero(estadisticasGenerales.seguidores)}
                  </p>
                  <div className="flex items-center mt-2">
                    {estadisticasGenerales.cambioMensual.seguidores >= 0 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${
                      estadisticasGenerales.cambioMensual.seguidores >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {formatearPorcentaje(estadisticasGenerales.cambioMensual.seguidores)} este mes
                    </span>
                  </div>
                </div>
                <div className="text-3xl">👥</div>
              </div>
            </div>
          </div>

          {/* Rendimiento por Canción */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Rendimiento por Canción</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Canción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reproducciones
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Favoritos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descargas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cambio Semanal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {estadisticasCanciones.map((cancion) => (
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
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatearNumero(cancion.reproducciones)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatearNumero(cancion.favoritos)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatearNumero(cancion.descargas)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center">
                          {cancion.cambioSemanal >= 0 ? (
                            <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                          )}
                          <span className={`${
                            cancion.cambioSemanal >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatearPorcentaje(cancion.cambioSemanal)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gráfico Placeholder */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reproducciones en el Tiempo</h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <ChartBarIcon className="mx-auto h-12 w-12 mb-4" />
                <p>Gráfico de reproducciones</p>
                <p className="text-sm">Aquí se mostraría un gráfico temporal</p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
