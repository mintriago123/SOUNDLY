'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  UserIcon, 
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: 'usuario' | 'artista' | 'premium' | 'admin';
  estado: 'activo' | 'inactivo' | 'suspendido' | 'pendiente';
  fecha_registro: string;
  telefono?: string;
  ciudad?: string;
  pais?: string;
  ultima_actividad?: string;
}

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Usuario>>({});

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('fecha_registro', { ascending: false });

      if (error) {
        console.error('Error fetching usuarios:', error);
        // Usar datos simulados si hay error
        setUsuarios(getSimulatedUsers());
      } else {
        setUsuarios(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setUsuarios(getSimulatedUsers());
    } finally {
      setLoading(false);
    }
  };

  const getSimulatedUsers = (): Usuario[] => [
    {
      id: '1',
      email: 'admin@soundly.com',
      nombre: 'Administrador Principal',
      rol: 'admin',
      estado: 'activo',
      fecha_registro: '2024-01-01',
      ciudad: 'Madrid',
      pais: 'España',
      ultima_actividad: '2024-08-02'
    },
    {
      id: '2',
      email: 'artista@soundly.com',
      nombre: 'María García',
      rol: 'artista',
      estado: 'activo',
      fecha_registro: '2024-02-15',
      ciudad: 'Barcelona',
      pais: 'España',
      ultima_actividad: '2024-08-01'
    },
    {
      id: '3',
      email: 'premium@soundly.com',
      nombre: 'Carlos López',
      rol: 'premium',
      estado: 'activo',
      fecha_registro: '2024-03-10',
      ciudad: 'Valencia',
      pais: 'España',
      ultima_actividad: '2024-07-30'
    },
    {
      id: '4',
      email: 'usuario@soundly.com',
      nombre: 'Ana Martínez',
      rol: 'usuario',
      estado: 'activo',
      fecha_registro: '2024-03-20',
      ciudad: 'Sevilla',
      pais: 'España',
      ultima_actividad: '2024-07-28'
    },
    {
      id: '5',
      email: 'suspendido@soundly.com',
      nombre: 'Usuario Suspendido',
      rol: 'usuario',
      estado: 'suspendido',
      fecha_registro: '2024-04-01',
      ciudad: 'Bilbao',
      pais: 'España',
      ultima_actividad: '2024-07-15'
    }
  ];

  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRol = filterRol === 'todos' || usuario.rol === filterRol;
    const matchesEstado = filterEstado === 'todos' || usuario.estado === filterEstado;
    
    return matchesSearch && matchesRol && matchesEstado;
  });

  const handleEdit = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setEditFormData(usuario);
    setShowEditModal(true);
  };

  const handleDelete = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setShowDeleteModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUsuario) return;

    try {
      const { error } = await supabase
        .from('usuarios')
        .update(editFormData)
        .eq('id', selectedUsuario.id);

      if (error) {
        console.error('Error updating usuario:', error);
        alert('Error al actualizar usuario');
        return;
      }

      // Actualizar la lista local
      setUsuarios(prev => prev.map(u => 
        u.id === selectedUsuario.id ? { ...u, ...editFormData } : u
      ));

      setShowEditModal(false);
      setSelectedUsuario(null);
      alert('Usuario actualizado correctamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar usuario');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUsuario) return;

    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', selectedUsuario.id);

      if (error) {
        console.error('Error deleting usuario:', error);
        alert('Error al eliminar usuario');
        return;
      }

      // Actualizar la lista local
      setUsuarios(prev => prev.filter(u => u.id !== selectedUsuario.id));

      setShowDeleteModal(false);
      setSelectedUsuario(null);
      alert('Usuario eliminado correctamente');
    } catch (error) {
      console.error('Error:', error);
      // Simular eliminación local
      setUsuarios(prev => prev.filter(u => u.id !== selectedUsuario.id));
      setShowDeleteModal(false);
      setSelectedUsuario(null);
      alert('Usuario eliminado correctamente (simulado)');
    }
  };

  const getRolBadgeColor = (rol: string) => {
    switch (rol) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'artista': return 'bg-purple-100 text-purple-800';
      case 'premium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'activo': return 'bg-green-100 text-green-800';
      case 'inactivo': return 'bg-gray-100 text-gray-800';
      case 'suspendido': return 'bg-red-100 text-red-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRolLabel = (rol: string) => {
    switch (rol) {
      case 'admin': return 'Administrador';
      case 'artista': return 'Artista';
      case 'premium': return 'Premium';
      case 'usuario': return 'Usuario';
      default: return rol;
    }
  };

  const getStatsCards = () => {
    const totalUsuarios = usuarios.length;
    const usuariosActivos = usuarios.filter(u => u.estado === 'activo').length;
    const artistasCount = usuarios.filter(u => u.rol === 'artista').length;
    const premiumCount = usuarios.filter(u => u.rol === 'premium').length;

    return [
      {
        title: 'Total Usuarios',
        value: totalUsuarios,
        icon: '👥',
        color: 'text-blue-600'
      },
      {
        title: 'Usuarios Activos',
        value: usuariosActivos,
        icon: '✅',
        color: 'text-green-600'
      },
      {
        title: 'Artistas',
        value: artistasCount,
        icon: '🎤',
        color: 'text-purple-600'
      },
      {
        title: 'Premium',
        value: premiumCount,
        icon: '💎',
        color: 'text-yellow-600'
      }
    ];
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Gestión de Usuarios 👥
              </h2>
              <p className="text-gray-600">
                Administra los usuarios de la plataforma Soundly
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Nuevo Usuario
            </button>
          </div>
        </div>

        {/* Estadísticas de usuarios */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {getStatsCards().map((card, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">{card.icon}</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar usuarios..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterRol}
              onChange={(e) => setFilterRol(e.target.value)}
            >
              <option value="todos">Todos los roles</option>
              <option value="admin">Administrador</option>
              <option value="artista">Artista</option>
              <option value="premium">Premium</option>
              <option value="usuario">Usuario</option>
            </select>

            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="suspendido">Suspendido</option>
              <option value="pendiente">Pendiente</option>
            </select>

            <button
              onClick={fetchUsuarios}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>

        {/* Tabla de usuarios */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Registro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Cargando usuarios...
                    </td>
                  </tr>
                ) : filteredUsuarios.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  filteredUsuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <UserIcon className="w-6 h-6 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {usuario.nombre}
                            </div>
                            <div className="text-sm text-gray-500">
                              {usuario.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRolBadgeColor(usuario.rol)}`}>
                          {getRolLabel(usuario.rol)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoBadgeColor(usuario.estado)}`}>
                          {usuario.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {usuario.ciudad && usuario.pais ? `${usuario.ciudad}, ${usuario.pais}` : 'No especificado'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(usuario.fecha_registro).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(usuario)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          {usuario.rol !== 'admin' && (
                            <button
                              onClick={() => handleDelete(usuario)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de edición */}
        {showEditModal && selectedUsuario && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Editar Usuario
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editFormData.nombre || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editFormData.rol || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, rol: e.target.value as any }))}
                  >
                    <option value="usuario">Usuario</option>
                    <option value="artista">Artista</option>
                    <option value="premium">Premium</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editFormData.estado || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, estado: e.target.value as any }))}
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="suspendido">Suspendido</option>
                    <option value="pendiente">Pendiente</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación de eliminación */}
        {showDeleteModal && selectedUsuario && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">
                  Confirmar eliminación
                </h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que quieres eliminar al usuario <strong>{selectedUsuario.nombre}</strong>? 
                Esta acción no se puede deshacer.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
