'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseCLient';
import DashboardLayout from '@/components/DashboardLayout';

interface Reporte {
  id: string;
  tipo: 'contenido_inapropiado' | 'spam' | 'copyright' | 'acoso' | 'otro';
  descripcion: string;
  estado: 'pendiente' | 'resuelto' | 'rechazado';
  created_at: string;
  usuario_reporta_id: string;
  cancion_id?: string;
  usuario_reportado_id?: string;
  usuarios_reporta: {
    nombre: string;
    email: string;
  };
  usuarios_reportado?: {
    nombre: string;
    email: string;
  };
  canciones?: {
    titulo: string;
    usuarios: {
      nombre: string;
      email: string;
    };
  };
}

export default function AdminModeracionPage() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('pendiente');
  const [selectedReporte, setSelectedReporte] = useState<Reporte | null>(null);
  const [showReporteModal, setShowReporteModal] = useState(false);

  useEffect(() => {
    fetchReportes();
  }, []);

  const fetchReportes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reportes')
        .select(`
          *,
          usuarios_reporta:usuarios!reportes_usuario_reporta_id_fkey (
            nombre,
            email
          ),
          usuarios_reportado:usuarios!reportes_usuario_reportado_id_fkey (
            nombre,
            email
          ),
          canciones (
            titulo,
            usuarios (
              nombre,
              email
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReportes(data || []);
    } catch (error) {
      console.error('Error fetching reportes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReportes = reportes.filter(reporte => {
    const matchesTipo = filterTipo === 'todos' || reporte.tipo === filterTipo;
    const matchesEstado = filterEstado === 'todos' || reporte.estado === filterEstado;
    
    return matchesTipo && matchesEstado;
  });

  const updateReporteStatus = async (reporteId: string, newStatus: string, accion?: string) => {
    try {
      const { error } = await supabase
        .from('reportes')
        .update({ 
          estado: newStatus,
          accion_tomada: accion,
          resuelto_por: 'admin', // En producción, usar el ID del admin actual
          fecha_resolucion: new Date().toISOString()
        })
        .eq('id', reporteId);

      if (error) throw error;
      
      await fetchReportes();
      setShowReporteModal(false);
      alert('Reporte actualizado correctamente');
    } catch (error) {
      console.error('Error updating reporte:', error);
      alert('Error al actualizar el reporte');
    }
  };

  const suspendUser = async (userId: string, razon: string) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ 
          estado: 'suspendido',
          razon_suspension: razon,
          fecha_suspension: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      alert('Usuario suspendido correctamente');
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Error al suspender el usuario');
    }
  };

  const deactivateSong = async (songId: string) => {
    try {
      const { error } = await supabase
        .from('canciones')
        .update({ estado: 'inactiva' })
        .eq('id', songId);

      if (error) throw error;
      alert('Canción desactivada correctamente');
    } catch (error) {
      console.error('Error deactivating song:', error);
      alert('Error al desactivar la canción');
    }
  };

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'contenido_inapropiado': return 'bg-red-100 text-red-800';
      case 'spam': return 'bg-orange-100 text-orange-800';
      case 'copyright': return 'bg-purple-100 text-purple-800';
      case 'acoso': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'resuelto': return 'bg-green-100 text-green-800';
      case 'rechazado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'contenido_inapropiado': return 'Contenido Inapropiado';
      case 'spam': return 'Spam';
      case 'copyright': return 'Violación de Copyright';
      case 'acoso': return 'Acoso';
      default: return 'Otro';
    }
  };

  return (
    <DashboardLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Moderación y Reportes 🚩
        </h2>
        <p className="text-gray-600">
          Gestiona reportes de usuarios y modera contenido de la plataforma
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="filter_tipo" className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por tipo
            </label>
            <select
              id="filter_tipo"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
            >
              <option value="todos">Todos los tipos</option>
              <option value="contenido_inapropiado">Contenido Inapropiado</option>
              <option value="spam">Spam</option>
              <option value="copyright">Violación de Copyright</option>
              <option value="acoso">Acoso</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter_estado" className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por estado
            </label>
            <select
              id="filter_estado"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="resuelto">Resueltos</option>
              <option value="rechazado">Rechazados</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchReportes}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {filteredReportes.filter(r => r.estado === 'pendiente').length}
          </div>
          <div className="text-sm text-gray-600">Reportes Pendientes</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">
            {filteredReportes.filter(r => r.estado === 'resuelto').length}
          </div>
          <div className="text-sm text-gray-600">Reportes Resueltos</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-red-600">
            {filteredReportes.filter(r => r.tipo === 'contenido_inapropiado').length}
          </div>
          <div className="text-sm text-gray-600">Contenido Inapropiado</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-purple-600">
            {filteredReportes.filter(r => r.tipo === 'copyright').length}
          </div>
          <div className="text-sm text-gray-600">Violaciones Copyright</div>
        </div>
      </div>

      {/* Tabla de reportes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reportado por
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contenido/Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
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
              {(() => {
                if (loading) {
                  return (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        Cargando reportes...
                      </td>
                    </tr>
                  );
                }
                
                if (filteredReportes.length === 0) {
                  return (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No se encontraron reportes
                      </td>
                    </tr>
                  );
                }
                
                return filteredReportes.map((reporte) => (
                  <tr key={reporte.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoBadgeColor(reporte.tipo)}`}>
                        {getTipoLabel(reporte.tipo)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {reporte.usuarios_reporta?.nombre || 'Usuario desconocido'}
                        </div>
                        <div className="text-sm text-gray-500">{reporte.usuarios_reporta?.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        if (reporte.canciones) {
                          return (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                🎵 {reporte.canciones.titulo}
                              </div>
                              <div className="text-sm text-gray-500">
                                por {reporte.canciones.usuarios?.nombre}
                              </div>
                            </div>
                          );
                        }
                        
                        if (reporte.usuarios_reportado) {
                          return (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                👤 {reporte.usuarios_reportado.nombre}
                              </div>
                              <div className="text-sm text-gray-500">{reporte.usuarios_reportado.email}</div>
                            </div>
                          );
                        }
                        
                        return <span className="text-sm text-gray-500">No especificado</span>;
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoBadgeColor(reporte.estado)}`}>
                        {reporte.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(reporte.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedReporte(reporte);
                          setShowReporteModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        👁️ Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de detalles del reporte */}
      {showReporteModal && selectedReporte && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Detalles del Reporte
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tipo_reporte_display" className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Reporte
                  </label>
                  <span id="tipo_reporte_display" className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoBadgeColor(selectedReporte.tipo)}`}>
                    {getTipoLabel(selectedReporte.tipo)}
                  </span>
                </div>
                <div>
                  <label htmlFor="estado_actual_display" className="block text-sm font-medium text-gray-700 mb-2">
                    Estado Actual
                  </label>
                  <span id="estado_actual_display" className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoBadgeColor(selectedReporte.estado)}`}>
                    {selectedReporte.estado}
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="descripcion_reporte_display" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción del Reporte
                </label>
                <div id="descripcion_reporte_display" className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-900">{selectedReporte.descripcion}</p>
                </div>
              </div>

              <div>
                <label htmlFor="reportado_por_display" className="block text-sm font-medium text-gray-700 mb-2">
                  Reportado por
                </label>
                <div id="reportado_por_display" className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-900">
                    {selectedReporte.usuarios_reporta?.nombre} ({selectedReporte.usuarios_reporta?.email})
                  </p>
                </div>
              </div>

              {selectedReporte.estado === 'pendiente' && (
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Acciones de Moderación</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      onClick={() => updateReporteStatus(selectedReporte.id, 'resuelto', 'Reporte validado - Acción tomada')}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      ✅ Resolver Reporte
                    </button>
                    <button
                      onClick={() => updateReporteStatus(selectedReporte.id, 'rechazado', 'Reporte no válido')}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      ❌ Rechazar Reporte
                    </button>
                    {selectedReporte.cancion_id && (
                      <button
                        onClick={() => {
                          deactivateSong(selectedReporte.cancion_id!);
                          updateReporteStatus(selectedReporte.id, 'resuelto', 'Canción desactivada');
                        }}
                        className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                      >
                        🚫 Desactivar Canción
                      </button>
                    )}
                    {selectedReporte.usuario_reportado_id && (
                      <button
                        onClick={() => {
                          suspendUser(selectedReporte.usuario_reportado_id!, `Reporte: ${selectedReporte.tipo}`);
                          updateReporteStatus(selectedReporte.id, 'resuelto', 'Usuario suspendido');
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                      >
                        ⏸️ Suspender Usuario
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowReporteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
