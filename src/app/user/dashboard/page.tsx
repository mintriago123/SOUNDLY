'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/app/components/SupabaseProvider';
import { useRouter } from 'next/navigation';

interface Stats {
  totalCanciones: number;
  totalPlaylists: number;
  totalFavoritos: number;
  tiempoEscucha: string;
}

export default function UserDashboard() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({
    totalCanciones: 0,
    totalPlaylists: 0,
    totalFavoritos: 0,
    tiempoEscucha: '0h 0m'
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerDatosUsuario();
  }, []);

  const obtenerDatosUsuario = async () => {
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

      setUsuario(userData);

      // Obtener estadísticas del usuario
      const [cancionesRes, playlistsRes, favoritosRes, historialRes] = await Promise.all([
        supabase.from('canciones').select('id').eq('usuario_subida_id', user.id),
        supabase.from('playlists').select('id').eq('usuario_id', user.id),
        supabase.from('favoritos').select('id').eq('usuario_id', user.id),
        supabase.from('historial_reproduccion').select('duracion_escuchada').eq('usuario_id', user.id)
      ]);

      const totalMinutos = historialRes.data?.reduce((acc, item) => acc + (item.duracion_escuchada || 0), 0) || 0;
      const horas = Math.floor(totalMinutos / 3600);
      const minutos = Math.floor((totalMinutos % 3600) / 60);

      setStats({
        totalCanciones: cancionesRes.data?.length || 0,
        totalPlaylists: playlistsRes.data?.length || 0,
        totalFavoritos: favoritosRes.data?.length || 0,
        tiempoEscucha: `${horas}h ${minutos}m`
      });

    } catch (error) {
      console.error('Error obteniendo datos:', error);
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🎵</span>
              <h1 className="text-xl font-bold text-gray-900">Soundly</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                ¡Hola, {usuario?.nombre || 'Usuario'}!
              </span>
              <button
                onClick={cerrarSesion}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Bienvenida */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 mb-8 text-white">
            <h2 className="text-3xl font-bold mb-2">
              ¡Bienvenido de vuelta! 👋
            </h2>
            <p className="text-blue-100">
              Disfruta de tu música y descubre nuevos sonidos en Soundly
            </p>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">🎵</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Mis Canciones</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCanciones}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">📋</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Playlists</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPlaylists}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">❤️</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Favoritos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalFavoritos}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">⏱️</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Tiempo Escuchado</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.tiempoEscucha}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <div className="text-4xl mb-4">🎼</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Mi Biblioteca</h3>
                <p className="text-gray-600 text-sm">Explora tu colección de música</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <div className="text-4xl mb-4">➕</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Subir Música</h3>
                <p className="text-gray-600 text-sm">Agrega nuevas canciones</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Descubrir</h3>
                <p className="text-gray-600 text-sm">Encuentra nueva música</p>
              </div>
            </div>
          </div>

          {/* Actividad Reciente */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Actividad Reciente</h3>
            </div>
            <div className="p-6">
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-4">🎼</div>
                <p>No hay actividad reciente</p>
                <p className="text-sm mt-2">Comienza escuchando música para ver tu actividad aquí</p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}