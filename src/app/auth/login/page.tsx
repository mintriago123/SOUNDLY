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

  // Obtener la URL de redirección si existe
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

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

    router.push(redirectTo); // Redirigir a la URL solicitada o al dashboard
  };

  return (
    <form className="space-y-4 max-w-md mx-auto" onSubmit={manejarEnvio}>
      <h2 className="text-2xl font-bold text-center">Iniciar Sesión</h2>
      
      {/* Mostrar mensaje si fue redirigido */}
      {searchParams.get('redirectTo') && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm text-center">
          <p>Necesitas iniciar sesión para acceder a esa página</p>
        </div>
      )}
      
      <div className="space-y-3">
        <input
          name="email"
          type="email"
          required
          placeholder="Correo"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 outline-none transition-all shadow-sm bg-white placeholder-gray-500"
          value={datos.email}
          onChange={manejarCambio}
        />
        <input
          name="contrasena"
          type="password"
          required
          placeholder="Contraseña"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 outline-none transition-all shadow-sm bg-white placeholder-gray-500"
          value={datos.contrasena}
          onChange={manejarCambio}
        />
      </div>

      {error && <div className="text-red-600 bg-red-100 p-2 rounded mt-2 text-center">{error}</div>}

      <button
        type="submit"
        disabled={cargando}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold shadow hover:bg-blue-700 transition-all mt-2"
      >
        {cargando ? 'Iniciando...' : 'Iniciar Sesión'}
      </button>

      <div className="text-center mt-4">
        <p className="text-gray-600">
          ¿No tienes cuenta?{' '}
          <Link href="/auth/register" className="text-blue-600 underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </form>
  );
}