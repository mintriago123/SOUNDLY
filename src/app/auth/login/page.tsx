'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/app/components/SupabaseProvider';

export default function PaginaLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { supabase } = useSupabase();

  const [datos, setDatos] = useState({ email: '', contrasena: '' });
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [barHeights, setBarHeights] = useState<number[]>([]);

  // Obtener la URL de redirección si existe
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  // Generar las alturas aleatorias para el visualizador de música
  useEffect(() => {
    setBarHeights([...Array(5)].map(() => Math.random() * 40 + 20));
  }, []);

  const manejarCambio = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDatos(d => ({ ...d, [e.target.name]: e.target.value }));
    setError(null);
  };

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: datos.email,
      password: datos.contrasena,
    });

    setCargando(false);
    if (error) return setError(error.message);

    router.push(redirectTo);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#100725] via-[#220639] to-[#491358] relative overflow-hidden">
      {/* Background animated elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-gradient-to-br from-[#6e1f86] to-[#ba319f] rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-gradient-to-tr from-[#ba319f] to-[#6e1f86] rounded-full opacity-20 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-[#491358] to-[#6e1f86] rounded-full opacity-10 blur-2xl animate-bounce"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center p-6 lg:p-8">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-r from-[#6e1f86] to-[#ba319f] rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#ba319f] to-white bg-clip-text text-transparent">
            Soundly
          </h1>
        </div>
        
        <Link href="/auth/register">
          <button className="px-6 py-2 bg-gradient-to-r from-[#6e1f86] to-[#ba319f] text-white rounded-full hover:shadow-lg hover:shadow-[#ba319f]/25 transition-all duration-300 font-medium">
            Registrarse
          </button>
        </Link>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-12">
        <div className="w-full max-w-md bg-white/5 backdrop-blur-sm border border-[#6e1f86]/30 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-[#ba319f] to-[#6e1f86] bg-clip-text text-transparent">
              Iniciar Sesión
            </h2>
            <p className="text-gray-300 mt-2">Accede a tu cuenta para disfrutar de Soundly</p>
          </div>

          {/* Mostrar mensaje si fue redirigido */}
          {searchParams.get('redirectTo') && (
            <div className="bg-[#6e1f86]/20 border border-[#ba319f]/30 text-[#ba319f] px-4 py-3 rounded-lg text-sm text-center mb-6">
              <p>Necesitas iniciar sesión para acceder a esa página</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={manejarEnvio}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="tu@email.com"
                  className="w-full bg-white/5 border border-[#6e1f86]/50 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#ba319f] focus:border-transparent outline-none transition-all text-white placeholder-gray-400"
                  value={datos.email}
                  onChange={manejarCambio}
                />
              </div>
              
              <div>
                <label htmlFor="contrasena" className="block text-sm font-medium text-gray-300 mb-1">
                  Contraseña
                </label>
                <input
                  id="contrasena"
                  name="contrasena"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-[#6e1f86]/50 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#ba319f] focus:border-transparent outline-none transition-all text-white placeholder-gray-400"
                  value={datos.contrasena}
                  onChange={manejarCambio}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 bg-red-900/20 border border-red-900/50 p-3 rounded-lg text-center text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-gradient-to-r from-[#6e1f86] to-[#ba319f] text-white py-3 rounded-lg font-semibold hover:shadow-xl hover:shadow-[#ba319f]/30 transition-all duration-300 transform hover:scale-[1.02]"
            >
              {cargando ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </span>
              ) : 'Iniciar Sesión'}
            </button>

            <div className="text-center pt-4 border-t border-[#6e1f86]/30">
              <p className="text-gray-400 text-sm">
                ¿No tienes cuenta?{' '}
                <Link href="/auth/register" className="text-[#ba319f] hover:underline font-medium">
                  Regístrate aquí
                </Link>
              </p>
              <Link 
                href="/auth/forgot-password" 
                className="text-sm text-gray-500 hover:text-[#ba319f] hover:underline mt-2 inline-block"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </form>
        </div>
      </main>

      {/* Floating music visualizer */}
      {barHeights.length > 0 && (
        <div className="fixed bottom-8 right-8 z-20">
          <div className="flex space-x-1 items-end">
            {barHeights.map((height, i) => (
              <div
                key={i}
                className="w-2 bg-gradient-to-t from-[#6e1f86] to-[#ba319f] rounded-full"
                style={{
                  height: `${height}px`,
                  animation: `pulse 1s ease-in-out ${i * 0.1}s infinite alternate`
                }}
              ></div>
            ))}
          </div>
        </div>
      )}

      {/* Custom animation keyframes */}
      <style jsx global>{`
        @keyframes pulse {
          0% { height: ${barHeights[0]?.toFixed(0) || 20}px; }
          100% { height: ${(barHeights[0] ? barHeights[0] * 1.5 : 30).toFixed(0)}px; }
        }
      `}</style>
    </div>
  );
}