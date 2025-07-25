'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/app/components/SupabaseProvider';
import DashboardLayout from '@/app/components/DashboardLayout';
import {
  UserIcon,
  AtSymbolIcon,
  PhoneIcon,
  MapPinIcon,
  CameraIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  MusicalNoteIcon,
  SparklesIcon,
  CalendarIcon,
  ArrowLeftIcon,
  HeartIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

interface UserProfile {
  id: string;
  email?: string;
  nombre: string;
  telefono?: string;
  direccion?: string;
  rol: string;
  estado?: string;
  fecha_registro?: string;
  biografia?: string;
  generos_favoritos?: string[];
  artista_favorito?: string;
}

export default function PerfilPage() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    biografia: '',
    artista_favorito: ''
  });
  const [stats, setStats] = useState({
    totalCanciones: 0,
    totalPlaylists: 0,
    totalFavoritos: 0,
    tiempoEscucha: '0h 0m'
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        
        // Obtener usuario autenticado
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          setMessage({ type: 'error', text: 'Usuario no autenticado' });
          setIsLoading(false);
          return;
        }
        
        // Obtener datos del perfil desde la tabla usuarios
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error de consulta:', error);
          throw new Error('No se pudieron cargar los datos del perfil');
        }

        if (!data) {
          throw new Error('No se encontró el perfil del usuario');
        }

        // Combinar datos de auth y profile
        const combinedProfile: UserProfile = {
          ...data,
          email: user.email || data.email || ''
        };

        setProfile(combinedProfile);
        setFormData({
          nombre: data.nombre || '',
          telefono: data.telefono || '',
          direccion: data.direccion || '',
          biografia: data.biografia || '',
          artista_favorito: data.artista_favorito || ''
        });

        // Obtener estadísticas del usuario
        await loadUserStats(user.id);
        
        setMessage(null);
      } catch (error: any) {
        console.error('Error al cargar perfil:', error);
        setMessage({ 
          type: 'error', 
          text: error.message || 'Error al cargar los datos del perfil' 
        });
      } finally {
        setIsLoading(false);
      }
    };

    const loadUserStats = async (userId: string) => {
      try {
        const [cancionesRes, playlistsRes, favoritosRes, historialRes] = await Promise.all([
          supabase.from('canciones').select('id').eq('usuario_id', userId),
          supabase.from('playlists').select('id').eq('usuario_id', userId),
          supabase.from('favoritos').select('id').eq('usuario_id', userId),
          supabase.from('historial_reproduccion').select('duracion_escuchada').eq('usuario_id', userId)
        ]);

        const totalMinutos = historialRes.data?.reduce((acc, item) => acc + (item.duracion_escuchada || 0), 0) || 0;
        const horas = Math.floor(totalMinutos / 3600);
        const minutos = Math.floor((totalMinutos % 3600) / 60);

        setStats({
          totalCanciones: cancionesRes.data?.length || 0,
          totalPlaylists: playlistsRes.data?.length || 0,
          totalFavoritos: favoritosRes.data?.length || 0,
          tiempoEscucha: `${horas}h ${minutos}m`
        });
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
      }
    };

    loadProfile();
  }, [supabase]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar mensaje de error cuando el usuario empiece a escribir
    if (message?.type === 'error') {
      setMessage(null);
    }
  };

  const validateForm = (): string | null => {
    if (!formData.nombre.trim()) {
      return 'El nombre es obligatorio';
    }
    
    if (formData.telefono && formData.telefono.trim() && formData.telefono.replace(/\D/g, '').length < 10) {
      return 'El teléfono debe tener al menos 10 dígitos';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }
    
    setIsSaving(true);
    setMessage(null);

    try {
      // Obtener usuario actual
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user?.id) {
        throw new Error('Usuario no autenticado');
      }

      const updateData: any = {
        nombre: formData.nombre.trim(),
        telefono: formData.telefono.trim(),
        direccion: formData.direccion.trim(),
        biografia: formData.biografia.trim(),
        artista_favorito: formData.artista_favorito.trim()
      };

      const { error } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('Error de actualización:', error);
        throw new Error('Error al actualizar el perfil: ' + error.message);
      }

      // Recargar los datos actualizados
      const { data: updatedData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();

      if (updatedData) {
        setProfile({
          ...updatedData,
          email: user.email || updatedData.email || ''
        });
      }

      setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
      
    } catch (error: any) {
      console.error('Error al actualizar perfil:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Error al actualizar el perfil' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'admin':
        return { color: 'bg-blue-500', label: 'Administrador', icon: '👑' };
      case 'premium':
        return { color: 'bg-gradient-to-r from-purple-500 to-pink-500', label: 'Premium', icon: '💎' };
      default:
        return { color: 'bg-gray-500', label: 'Usuario Gratuito', icon: '🎵' };
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando perfil...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <ExclamationCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar el perfil</h2>
            <p className="text-gray-600 mb-6">No se pudieron cargar los datos del perfil.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header con navegación */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Volver
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">Mi Perfil Musical</h1>
          <p className="text-gray-600 mt-2">
            Personaliza tu experiencia en Soundly
          </p>
        </div>

        {/* Mensaje de estado */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
            ) : (
              <ExclamationCircleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información del perfil */}
          <div className="lg:col-span-1 space-y-6">
            {/* Avatar y datos básicos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                {/* Avatar */}
                <div className="relative inline-block">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg ${getRoleInfo(profile.rol).color}`}>
                    {getUserInitials(profile.nombre)}
                  </div>
                  <button 
                    className="absolute bottom-0 right-0 bg-gray-600 text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
                    title="Cambiar foto (Próximamente)"
                  >
                    <CameraIcon className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  {profile.nombre || 'Usuario'}
                </h3>
                <div className="flex items-center justify-center mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getRoleInfo(profile.rol).color}`}>
                    {getRoleInfo(profile.rol).icon} {getRoleInfo(profile.rol).label}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-2">
                  {profile.email}
                </p>
              </div>

              {/* Información adicional */}
              <div className="mt-6 space-y-3 border-t border-gray-100 pt-4">
                <div className="flex items-center text-sm text-gray-600">
                  <MusicalNoteIcon className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Miembro desde: </span>
                  <span className="font-medium ml-1">
                    {formatDate(profile.fecha_registro)}
                  </span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircleIcon className="w-4 h-4 mr-2 text-green-500" />
                  <span>Estado: </span>
                  <span className="font-medium ml-1 text-green-600">
                    {profile.estado || 'Activo'}
                  </span>
                </div>

                {profile.artista_favorito && (
                  <div className="flex items-center text-sm text-gray-600">
                    <HeartIcon className="w-4 h-4 mr-2 text-red-500" />
                    <span>Artista favorito: </span>
                    <span className="font-medium ml-1">{profile.artista_favorito}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Estadísticas musicales */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                <SparklesIcon className="w-5 h-5 mr-2" />
                Tus Estadísticas
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-700">{stats.totalCanciones}</div>
                  <div className="text-xs text-purple-600">Canciones</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-700">{stats.totalPlaylists}</div>
                  <div className="text-xs text-purple-600">Playlists</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-700">{stats.totalFavoritos}</div>
                  <div className="text-xs text-purple-600">Favoritos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-700">{stats.tiempoEscucha}</div>
                  <div className="text-xs text-purple-600">Escuchado</div>
                </div>
              </div>
            </div>

            {/* Upgrade a Premium (solo para usuarios gratuitos) */}
            {(!profile.rol || profile.rol === 'usuario') && (
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
                <div className="text-center">
                  <SparklesIcon className="w-8 h-8 mx-auto mb-3" />
                  <h3 className="font-bold text-lg mb-2">¡Actualiza a Premium!</h3>
                  <p className="text-purple-100 text-sm mb-4">
                    Desbloquea música HD, descargas ilimitadas y más
                  </p>
                  <button
                    onClick={() => router.push('/dashboard/upgrade')}
                    className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors"
                  >
                    Ver Planes
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Formulario de edición */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <UserIcon className="w-6 h-6 mr-2" />
                Información Personal
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nombre completo */}
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de Usuario *
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Tu nombre de usuario"
                      required
                    />
                  </div>
                </div>

                {/* Email (solo lectura) */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email (Solo lectura)
                  </label>
                  <div className="relative">
                    <AtSymbolIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      value={profile.email || ''}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    El email está vinculado a tu cuenta de autenticación
                  </p>
                </div>

                {/* Teléfono */}
                <div>
                  <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono (Opcional)
                  </label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      id="telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Tu número de teléfono"
                    />
                  </div>
                </div>

                {/* Ubicación */}
                <div>
                  <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación (Opcional)
                  </label>
                  <div className="relative">
                    <MapPinIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      id="direccion"
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      placeholder="Ciudad, país"
                    />
                  </div>
                </div>

                {/* Biografía */}
                <div>
                  <label htmlFor="biografia" className="block text-sm font-medium text-gray-700 mb-2">
                    Biografía Musical (Opcional)
                  </label>
                  <div className="relative">
                    <MusicalNoteIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      id="biografia"
                      name="biografia"
                      value={formData.biografia}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      placeholder="Cuéntanos sobre tus gustos musicales..."
                      maxLength={500}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo 500 caracteres. {formData.biografia.length}/500
                  </p>
                </div>

                {/* Artista favorito */}
                <div>
                  <label htmlFor="artista_favorito" className="block text-sm font-medium text-gray-700 mb-2">
                    Artista Favorito (Opcional)
                  </label>
                  <div className="relative">
                    <HeartIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      id="artista_favorito"
                      name="artista_favorito"
                      value={formData.artista_favorito}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Nombre de tu artista favorito"
                    />
                  </div>
                </div>

                {/* Botón de guardar */}
                <div className="flex justify-end pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}