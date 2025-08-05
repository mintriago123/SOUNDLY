'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';

interface EstadisticasGenerales {
  totalUsuarios: number;
  usuariosActivos: number;
  nuevosUsuarios: number;
  totalCanciones: number;
  reproducciones: number;
  totalArtistas: number;
  ingresosMensuales: number;
  cancionesPorGenero: { [key: string]: number };
  usuariosPorMes: { mes: string; cantidad: number }[];
  topCanciones: any[];
  topArtistas: any[];
}

export default function AdminAnalyticasPage() {
  const [stats, setStats] = useState<EstadisticasGenerales>({
    totalUsuarios: 0,
    usuariosActivos: 0,
    nuevosUsuarios: 0,
    totalCanciones: 0,
    reproducciones: 0,
    totalArtistas: 0,
    ingresosMensuales: 0,
    cancionesPorGenero: {},
    usuariosPorMes: [],
    topCanciones: [],
    topArtistas: []
  });

  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, 1y

  useEffect(() => {
    fetchEstadisticas();
  }, [timeRange]);

  const fetchEstadisticas = async () => {
    try {
      setLoading(true);
      
      // Obtener estadísticas básicas
      const [
        { count: totalUsuarios },
        { count: totalCanciones },
        { count: totalArtistas },
        { count: usuariosActivos },
        { count: nuevosUsuarios }
      ] = await Promise.all([
        supabase.from('usuarios').select('*', { count: 'exact', head: true }),
        supabase.from('canciones').select('*', { count: 'exact', head: true }),
        supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('rol', 'artista'),
        supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('estado', 'activo'),
        supabase.from('usuarios').select('*', { count: 'exact', head: true }).gte('created_at', getDateRange())
      ]);

      // Obtener reproducciones totales
      const { data: reproducciones } = await supabase
        .from('canciones')
        .select('reproducciones');
      
      const totalReproducciones = reproducciones?.reduce((sum, song) => sum + (song.reproducciones || 0), 0) || 0;

      // Obtener canciones por género
      const { data: generosData } = await supabase
        .from('canciones')
        .select('genero');

      const cancionesPorGenero: { [key: string]: number } = {};
      generosData?.forEach(song => {
        if (song.genero) {
          cancionesPorGenero[song.genero] = (cancionesPorGenero[song.genero] || 0) + 1;
        }
      });

      // Obtener top canciones
      const { data: topCanciones } = await supabase
        .from('canciones')
        .select(`
          titulo,
          reproducciones,
          usuarios (
            nombre,
            perfiles_artista (
              nombre_artistico
            )
          )
        `)
        .order('reproducciones', { ascending: false })
        .limit(10);

      // Obtener top artistas
      const { data: topArtistas } = await supabase
        .from('usuarios')
        .select(`
          nombre,
          perfiles_artista (
            nombre_artistico,
            verificado
          ),
          canciones (
            reproducciones
          )
        `)
        .eq('rol', 'artista')
        .limit(10);

      // Calcular reproducciones por artista y ordenar
      const artistasConReproducciones = topArtistas?.map(artista => {
        const totalReproducciones = artista.canciones?.reduce((sum: number, cancion: any) => 
          sum + (cancion.reproducciones || 0), 0) || 0;
        return {
          ...artista,
          totalReproducciones
        };
      }).sort((a, b) => b.totalReproducciones - a.totalReproducciones) || [];

      // Obtener datos por mes (simulado)
      const usuariosPorMes = generateMonthlyData();

      setStats({
        totalUsuarios: totalUsuarios || 0,
        usuariosActivos: usuariosActivos || 0,
        nuevosUsuarios: nuevosUsuarios || 0,
        totalCanciones: totalCanciones || 0,
        reproducciones: totalReproducciones,
        totalArtistas: totalArtistas || 0,
        ingresosMensuales: 0, // Implementar lógica de ingresos
        cancionesPorGenero,
        usuariosPorMes,
        topCanciones: topCanciones || [],
        topArtistas: artistasConReproducciones
      });

    } catch (error) {
      console.error('Error fetching estadisticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    const days = parseInt(timeRange.replace('d', ''));
    const date = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return date.toISOString();
  };

  const generateMonthlyData = () => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return months.map((mes, index) => ({
      mes,
      cantidad: Math.floor(Math.random() * 100) + 20 // Datos simulados
    }));
  };

  const exportData = () => {
    const csvContent = [
      ['Métrica', 'Valor'],
      ['Total Usuarios', stats.totalUsuarios.toString()],
      ['Usuarios Activos', stats.usuariosActivos.toString()],
      ['Total Canciones', stats.totalCanciones.toString()],
      ['Total Reproducciones', stats.reproducciones.toString()],
      ['Total Artistas', stats.totalArtistas.toString()]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `soundly-analytics-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Analíticas y Estadísticas 📊
            </h2>
            <p className="text-gray-600">
              Monitorea el rendimiento y crecimiento de la plataforma
            </p>
          </div>
          <div className="flex space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
              <option value="365d">Último año</option>
            </select>
            <button
              onClick={exportData}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              📥 Exportar CSV
            </button>
          </div>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? '...' : stats.totalUsuarios.toLocaleString()}
              </p>
              <p className="text-sm text-green-600">
                +{stats.nuevosUsuarios} nuevos
              </p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Canciones</p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? '...' : stats.totalCanciones.toLocaleString()}
              </p>
              <p className="text-sm text-blue-600">
                {stats.totalArtistas} artistas
              </p>
            </div>
            <div className="text-4xl">🎵</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Reproducciones</p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? '...' : stats.reproducciones.toLocaleString()}
              </p>
              <p className="text-sm text-purple-600">
                Total acumulado
              </p>
            </div>
            <div className="text-4xl">▶️</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? '...' : stats.usuariosActivos.toLocaleString()}
              </p>
              <p className="text-sm text-orange-600">
                {Math.round((stats.usuariosActivos / stats.totalUsuarios) * 100)}% del total
              </p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>
      </div>

      {/* Gráficos y análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por géneros */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Canciones por Género</h3>
          <div className="space-y-3">
            {Object.entries(stats.cancionesPorGenero)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 8)
              .map(([genero, cantidad]) => (
                <div key={genero} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{genero}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(cantidad / Math.max(...Object.values(stats.cancionesPorGenero))) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{cantidad}</span>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Crecimiento mensual */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Crecimiento de Usuarios</h3>
          <div className="space-y-2">
            {stats.usuariosPorMes.slice(-6).map((data) => (
              <div key={data.mes} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{data.mes}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(data.cantidad / Math.max(...stats.usuariosPorMes.map(d => d.cantidad))) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{data.cantidad}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Canciones */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Canciones</h3>
          <div className="space-y-3">
            {stats.topCanciones.slice(0, 10).map((cancion, index) => (
              <div key={`${cancion.titulo}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-lg font-bold text-gray-500">#{index + 1}</div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{cancion.titulo}</div>
                    <div className="text-xs text-gray-600">
                      {cancion.usuarios?.perfiles_artista?.nombre_artistico || cancion.usuarios?.nombre}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {cancion.reproducciones?.toLocaleString()} plays
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Artistas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Artistas</h3>
          <div className="space-y-3">
            {stats.topArtistas.slice(0, 10).map((artista, index) => (
              <div key={`${artista.nombre}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-lg font-bold text-gray-500">#{index + 1}</div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {artista.perfiles_artista?.nombre_artistico || artista.nombre}
                      {artista.perfiles_artista?.verificado && ' ✓'}
                    </div>
                    <div className="text-xs text-gray-600">
                      {artista.canciones?.length || 0} canciones
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {artista.totalReproducciones?.toLocaleString()} plays
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Métricas adicionales */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas Detalladas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(stats.reproducciones / stats.totalCanciones) || 0}
            </div>
            <div className="text-sm text-gray-600">Reproducciones promedio por canción</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(stats.totalCanciones / stats.totalArtistas) || 0}
            </div>
            <div className="text-sm text-gray-600">Canciones promedio por artista</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round((stats.totalArtistas / stats.totalUsuarios) * 100) || 0}%
            </div>
            <div className="text-sm text-gray-600">Porcentaje de usuarios que son artistas</div>
          </div>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}
