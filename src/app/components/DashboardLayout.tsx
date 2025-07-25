'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabase } from './SupabaseProvider';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface Usuario {
  id: string;
  rol: 'admin' | 'usuario';
  email?: string;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    obtenerUsuario();
  }, []);

  const obtenerUsuario = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Obtener datos del usuario desde la tabla usuarios
      const { data: userData, error } = await supabase
        .from('usuarios')
        .select('id, rol')
        .eq('id', user.id)
        .single();

      if (error || !userData) {
        console.error('Error obteniendo datos del usuario:', error);
        await supabase.auth.signOut();
        router.push('/auth/login');
        return;
      }

      setUsuario({
        id: userData.id,
        rol: userData.rol,
        email: user.email
      });
    } catch (error) {
      console.error('Error:', error);
      router.push('/auth/login');
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Opciones del menú para usuarios regulares
  const opcionesUsuario = [
    { nombre: 'Mi Biblioteca', href: '/dashboard/biblioteca', icono: '🎵' },
    { nombre: 'Playlists', href: '/dashboard/playlists', icono: '📋' },
    { nombre: 'Favoritos', href: '/dashboard/favoritos', icono: '❤️' },
    { nombre: 'Reproductor', href: '/dashboard/reproductor', icono: '▶️' },
    { nombre: 'Perfil', href: '/dashboard/perfil', icono: '👤' },
  ];

  // Opciones adicionales para administradores
  const opcionesAdmin = [
    ...opcionesUsuario,
    { nombre: 'Gestión de Usuarios', href: '/dashboard/admin/usuarios', icono: '👥' },
    { nombre: 'Gestión de Contenido', href: '/dashboard/admin/contenido', icono: '🎼' },
    { nombre: 'Estadísticas', href: '/dashboard/admin/estadisticas', icono: '📊' },
    { nombre: 'Configuración', href: '/dashboard/admin/configuracion', icono: '⚙️' },
  ];

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (!usuario) {
    return null;
  }

  const opciones = usuario.rol === 'admin' ? opcionesAdmin : opcionesUsuario;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y título */}
            <div className="flex items-center space-x-3">
              <button
                className="md:hidden"
                onClick={() => setMenuAbierto(!menuAbierto)}
              >
                <span className="text-2xl">☰</span>
              </button>
              <Link href="/dashboard" className="flex items-center space-x-2">
                <span className="text-2xl">🎵</span>
                <h1 className="text-xl font-bold text-gray-900">Soundly</h1>
              </Link>
            </div>

            {/* Info del usuario y cerrar sesión */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{usuario.email}</span>
                {usuario.rol === 'admin' && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    Admin
                  </span>
                )}
              </div>
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

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          ${menuAbierto ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 transition-transform duration-200 ease-in-out
          fixed md:static inset-y-0 left-0 z-50
          w-64 bg-white shadow-lg border-r border-gray-200
          mt-16 md:mt-0
        `}>
          <nav className="p-4">
            <ul className="space-y-2">
              {opciones.map((opcion, index) => (
                <li key={index}>
                  <Link
                    href={opcion.href}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    onClick={() => setMenuAbierto(false)}
                  >
                    <span className="text-lg">{opcion.icono}</span>
                    <span className="font-medium">{opcion.nombre}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Overlay para móvil */}
        {menuAbierto && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setMenuAbierto(false)}
          />
        )}

        {/* Contenido principal */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}