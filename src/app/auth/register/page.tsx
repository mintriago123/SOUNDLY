'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/app/components/SupabaseProvider';

export default function PaginaRegistroSimple() {
  const router = useRouter();
  const { supabase } = useSupabase();

  const [datos, setDatos] = useState({ email: '', contrasena: '', confirmar: '' });
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const manejarCambio = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDatos(d => ({ ...d, [e.target.name]: e.target.value }));
    setError(null);
  };

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (datos.contrasena !== datos.confirmar) return setError('Las contraseñas no coinciden');
    setCargando(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: datos.email,
        password: datos.contrasena
      });
      
      if (error) {
        setCargando(false);
        return setError(error.message);
      }

      // El trigger handle_new_user() se encarga de crear el perfil automáticamente
      // Solo necesitamos esperar un momento para que el trigger termine
      if (data?.user) {
        console.log('Usuario creado por auth:', data.user);
        console.log('El trigger debería crear el perfil automáticamente');
      }
      
      setExito('¡Revisa tu correo y valida tu cuenta antes de continuar!');
      
    } catch (err: any) {
      console.error('Error en registro:', err);
      setError('Error inesperado al registrarse. Inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  if (exito) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">¡Registro exitoso!</h2>
        <p>{exito}</p>
        <Link href="/auth/login" className="text-blue-600 underline">Ir al inicio de sesión</Link>
      </div>
    );
  }

  return (
    <form className="space-y-4 max-w-md mx-auto" onSubmit={manejarEnvio}>
      <h2 className="text-2xl font-bold text-center">Registro</h2>
      
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
        <input
          name="confirmar"
          type="password"
          required
          placeholder="Confirmar contraseña"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 outline-none transition-all shadow-sm bg-white placeholder-gray-500"
          value={datos.confirmar}
          onChange={manejarCambio}
        />
      </div>
      {error && <div className="text-red-600 bg-red-100 p-2 rounded mt-2 text-center">{error}</div>}
      <button
        type="submit"
        disabled={cargando}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold shadow hover:bg-blue-700 transition-all mt-2"
      >
        {cargando ? 'Creando...' : 'Crear cuenta'}
      </button>
    </form>
  );
}