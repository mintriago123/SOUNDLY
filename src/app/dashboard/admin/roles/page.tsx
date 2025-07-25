'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/app/components/SupabaseProvider';
import { useRouter } from 'next/navigation';
import { 
  UserGroupIcon, 
  PencilIcon,
  CheckIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: 'admin' | 'premium' | 'artista' | 'usuario';
  estado: 'activo' | 'inactivo';
  fecha_registro: string;
}

export default function GestionRoles() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editandoRol, setEditandoRol] = useState<string | null>(null);
  const [nuevoRol, setNuevoRol] = useState<string>('');

  useEffect(() => {
    verificarAdminYCargarUsuarios();
  }, []);

  const verificarAdminYCargarUsuarios = async () => {
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

      if (!userData || userData.rol !== 'admin') {
        router.push('/dashboard');
        return;
      }

      await cargarUsuarios();
    } catch (error) {
      console.error('Error verificando admin:', error);
    } finally {
      setCargando(false);
    }
  };

  const cargarUsuarios = async () => {
    try {
      // Simulamos datos de usuarios para la demo
      const usuariosSimulados: Usuario[] = [
        {
          id: '1',
          email: 'usuario1@example.com',
          nombre: 'Juan Pérez',
          rol: 'usuario',
          estado: 'activo',
          fecha_registro: '2024-01-15'
        },
        {
          id: '2',
          email: 'artista1@example.com',
          nombre: 'María García',
          rol: 'artista',
          estado: 'activo',
          fecha_registro: '2024-02-10'
        },
        {
          id: '3',
          email: 'premium1@example.com',
          nombre: 'Carlos López',
          rol: 'premium',
          estado: 'activo',
          fecha_registro: '2024-03-05'
        },
        {
          id: '4',
          email: 'usuario2@example.com',
          nombre: 'Ana Martínez',
          rol: 'usuario',
          estado: 'activo',
          fecha_registro: '2024-03-20'
        }
      ];
      
      setUsuarios(usuariosSimulados);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };

  const iniciarEdicionRol = (userId: string, rolActual: string) => {
    setEditandoRol(userId);
    setNuevoRol(rolActual);
  };

  const cancelarEdicion = () => {
    setEditandoRol(null);
    setNuevoRol('');
  };

  const guardarRol = async (userId: string) => {
    try {
      // Aquí implementarías la lógica para actualizar el rol en la base de datos
      console.log(`Actualizando rol de usuario ${userId} a ${nuevoRol}`);
      
      // Simular actualización
      setUsuarios(prev => 
        prev.map(usuario => 
          usuario.id === userId 
            ? { ...usuario, rol: nuevoRol as any }
            : usuario
        )
      );
      
      setEditandoRol(null);
      setNuevoRol('');
    } catch (error) {
      console.error('Error actualizando rol:', error);
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

  const getRolLabel = (rol: string) => {
    switch (rol) {
      case 'admin': return 'Administrador';
      case 'artista': return 'Artista';
      case 'premium': return 'Premium';
      case 'usuario': return 'Usuario';
      default: return rol;
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando usuarios...</div>
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
              <UserGroupIcon className="h-8 w-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Roles</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Estadísticas por rol */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">👑</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Administradores</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {usuarios.filter(u => u.rol === 'admin').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">🎤</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Artistas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {usuarios.filter(u => u.rol === 'artista').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">⭐</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Premium</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {usuarios.filter(u => u.rol === 'premium').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">👤</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Usuarios</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {usuarios.filter(u => u.rol === 'usuario').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de usuarios */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Lista de Usuarios</h3>
              <p className="text-sm text-gray-500 mt-1">
                Gestiona los roles de los usuarios de la plataforma
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol Actual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
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
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {usuario.nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            {usuario.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editandoRol === usuario.id ? (
                          <select
                            value={nuevoRol}
                            onChange={(e) => setNuevoRol(e.target.value)}
                            className="block w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                          >
                            <option value="usuario">Usuario</option>
                            <option value="artista">Artista</option>
                            <option value="premium">Premium</option>
                            <option value="admin">Administrador</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRolBadgeColor(usuario.rol)}`}>
                            {getRolLabel(usuario.rol)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          usuario.estado === 'activo' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {usuario.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(usuario.fecha_registro).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {editandoRol === usuario.id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => guardarRol(usuario.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelarEdicion}
                              className="text-red-600 hover:text-red-900"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => iniciarEdicionRol(usuario.id, usuario.rol)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Información importante */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-2">Información sobre roles</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p><strong>Usuario:</strong> Acceso básico con funciones limitadas</p>
              <p><strong>Artista:</strong> Puede subir música, ver estadísticas y gestionar su perfil público</p>
              <p><strong>Premium:</strong> Acceso a funciones premium como descargas y música HD</p>
              <p><strong>Administrador:</strong> Acceso completo a todas las funciones del sistema</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
