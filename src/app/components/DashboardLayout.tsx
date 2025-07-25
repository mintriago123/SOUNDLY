'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabase } from './SupabaseProvider';
import Sidebar from './Sidebar';
import { Usuario } from '@/types/user';

interface DashboardLayoutProps {
  children: React.ReactNode;
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Solo visible en móvil */}
      <header className="bg-white shadow-sm border-b md:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y botón de menú */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setMenuAbierto(!menuAbierto)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <span className="text-xl">☰</span>
              </button>
              <Link href="/dashboard" className="flex items-center space-x-2">
                <span className="text-2xl">🎵</span>
                <h1 className="text-xl font-bold text-gray-900">Soundly</h1>
              </Link>
            </div>

            {/* Badges de rol */}
            <div className="flex items-center space-x-2">
              {usuario.rol === 'admin' && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  👑 Admin
                </span>
              )}
              {usuario.rol === 'premium' && (
                <span className="px-2 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-full text-xs">
                  💎 Premium
                </span>
              )}
              {(!usuario.rol || usuario.rol === 'usuario') && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  🎵 Gratis
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Component */}
        <Sidebar 
          isOpen={menuAbierto} 
          onClose={() => setMenuAbierto(false)}
          userRole={usuario.rol}
          userName={usuario.email?.split('@')[0] || 'Usuario'}
        />

        {/* Contenido principal */}
        <main className="flex-1 md:ml-64 min-h-screen">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}