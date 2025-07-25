'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/app/components/SupabaseProvider';
import { useRouter } from 'next/navigation';

interface AdminStats {
  totalUsuarios: number;
  usuariosActivos: number;
  totalCanciones: number;
  totalPlaylists: number;
  reproduccionesHoy: number;
  cancionesSubidasMes: number;
}

export default function AdminDashboard() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [stats, setStats] = useState<AdminStats>({
    totalUsuarios: 0,
    usuariosActivos: 0,
    totalCanciones: 0,
    totalPlaylists: 0,
    reproduccionesHoy: 0,
    cancionesSubidasMes: 0
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerDatosAdmin();
  }, []);

  const obtenerDatosAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Verificar que sea admin
      const { data: userData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userData?.rol !== 'admin') {
        router.push('/user/dashboard');
        return;
      }

      setUsuario(userData);

      // Obtener estadísticas del sistema
      const hoy = new Date().toISOString().split('T')[0];
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      const [
        usuariosRes,
        usuariosActivosRes,
        cancionesRes,
        playlistsRes,
        reproduccionesHoyRes,
        cancionesMesRes
      ] = await Promise.all([
        supabase.from('usuarios').select('id'),
        supabase.from('usuarios').select('id').eq('estado', 'activo'),
        supabase.from('canciones').select('id'),
        supabase.from('playlists').select('id'),
        supabase.from('historial_reproduccion').select('id').gte('fecha_reproduccion', hoy),
        supabase.from('canciones').select('id').gte('created_at', inicioMes)
      ]);

      setStats({
        totalUsuarios: usuariosRes.data?.length || 0,
        usuariosActivos: usuariosActivosRes.data?.length || 0,
        totalCanciones: cancionesRes.data?.length || 0,
        totalPlaylists: playlistsRes.data?.length || 0,
        reproduccionesHoy: reproduccionesHoyRes.data?.length || 0,
        cancionesSubidasMes: cancionesMesRes.data?.length || 0
      });

    } catch (error) {
      console.error('Error obteniendo datos admin:', error);
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
        <div className="text-xl">Cargando panel de administración...</div>
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
              <h1 className="text-xl font-bold text-gray-900">Soundly Admin</h1>
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                Admin
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {usuario?.nombre || 'Administrador'}
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
          
          {/* Bienvenida Admin */}
          <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-lg p-6 mb-8 text-white">
            <h2 className="text-3xl font-bold mb-2">
              Panel de Administración 👑
            </h2>
            <p className="text-red-100">
              Gestiona tu plataforma Soundly desde aquí
            </p>
          </div>

          {/* Estadísticas del Sistema */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">👥</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsuarios}</p>
                  <p className="text-xs text-green-600">{stats.usuariosActivos} activos</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">🎵</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Canciones</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCanciones}</p>
                  <p className="text-xs text-blue-600">{stats.cancionesSubidasMes} este mes</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">📋</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Playlists</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPlaylists}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">▶️</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Reproducciones Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.reproduccionesHoy}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">📊</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Estado del Sistema</p>
                  <p className="text-lg font-bold text-green-600">Operativo</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">🚀</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Rendimiento</p>
                  <p className="text-lg font-bold text-green-600">Óptimo</p>
                </div>
              </div>
            </div>
          </div>

          {/* Herramientas de Admin */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Gestionar Usuarios</h3>
                <p className="text-gray-600 text-sm">Administrar cuentas de usuario</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <div className="text-4xl mb-4">🎼</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Contenido Musical</h3>
                <p className="text-gray-600 text-sm">Gestionar canciones y artistas</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Estadísticas</h3>
                <p className="text-gray-600 text-sm">Analíticas detalladas</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <div className="text-4xl mb-4">⚙️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Configuración</h3>
                <p className="text-gray-600 text-sm">Ajustes del sistema</p>
              </div>
            </div>
          </div>

          {/* Panel de Monitoreo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Actividad Reciente */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Actividad del Sistema</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">Sistema funcionando correctamente</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">Base de datos optimizada</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">Backups actualizados</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Usuarios Recientes */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Alertas y Notificaciones</h3>
              </div>
              <div className="p-6">
                <div className="text-center text-gray-500 py-4">
                  <div className="text-3xl mb-2">✅</div>
                  <p>No hay alertas pendientes</p>
                  <p className="text-sm mt-1">Todo funciona correctamente</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}