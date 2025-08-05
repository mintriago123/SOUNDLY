'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { useSupabase } from '@/components/SupabaseProvider';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { HeartIcon, MagnifyingGlassIcon, MusicalNoteIcon, PlayIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface CancionFavorita {
  id: string;
  titulo: string;
  artista: string;
  album?: string;
  duracion: number;
  genero?: string;
  fecha_agregada: string;
  imagen_url?: string;
  archivo_audio_url: string;
  usuario_subida_id: string;
}

export default function FavoritosPage() {
  const [cancionesFavoritas, setCancionesFavoritas] = useState<CancionFavorita[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<any>(null);
  
  const { supabase } = useSupabase();
  const { playSong } = useMusicPlayer();

  // Función para formatear duración
  const formatearDuracion = (duracionSegundos: number): string => {
    const minutos = Math.floor(duracionSegundos / 60);
    const segundos = duracionSegundos % 60;
    return `${minutos}:${segundos.toString().padStart(2, '0')}`;
  };

  // Configuración de clases CSS - usando tema claro por defecto
  const themeClasses = {
    bg: 'bg-white',
    bgCard: 'bg-white',
    bgHover: 'hover:bg-gray-50',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    textMuted: 'text-gray-500',
    border: 'border-gray-200',
    inputBg: 'bg-white',
    inputBorder: 'border-gray-300',
  };

  useEffect(() => {
    // Obtener usuario actual
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        console.log('Usuario obtenido:', user ? 'Sí' : 'No');
      } catch (error) {
        console.warn('Error obteniendo usuario:', error);
        setUser(null);
      }
    };
    
    getCurrentUser();
    cargarFavoritos();
  }, []);

  useEffect(() => {
    cargarFavoritos();
  }, [user]);


  // Función para generar URL de audio desde Supabase Storage
  const generarUrlAudio = async (cancion: any): Promise<string> => {
    let urlAudio = cancion.archivo_audio_url;
    
    // Si la URL no es completa, generar URL pública desde Supabase Storage
    if (urlAudio && !urlAudio.startsWith('http')) {
      try {
        // Primero intentar URL pública
        const { data: urlData } = supabase.storage
          .from('music')
          .getPublicUrl(urlAudio);
        
        if (urlData?.publicUrl) {
          urlAudio = urlData.publicUrl;
        }
      } catch (error) {
        console.error('Error generando URL pública, intentando URL firmada para:', cancion.titulo, error);
        
        // Si falla la URL pública, intentar URL firmada (válida por 1 hora)
        try {
          const { data: signedUrlData, error: signedError } = await supabase.storage
            .from('music')
            .createSignedUrl(urlAudio, 3600); // 1 hora de validez
          
          if (signedUrlData?.signedUrl && !signedError) {
            urlAudio = signedUrlData.signedUrl;
          }
        } catch (signedErrorCatch) {
          console.error('Error en URL firmada:', signedErrorCatch);
        }
      }
    }
    
    return urlAudio;
  };

  const cargarFavoritos = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        console.log('Usuario no encontrado');
        setCancionesFavoritas([]);
        return;
      }

      try {
        // Cargar canciones favoritas desde Supabase
        const { data: favoritosData, error: favoritosError } = await supabase
          .from('favoritos')
          .select(`
            id,
            fecha_agregada,
            cancion_id,
            canciones!inner (
              id,
              titulo,
              duracion,
              genero,
              archivo_audio_url,
              imagen_url,
              usuario_subida_id
            )
          `)
          .eq('usuario_id', user.id);

        if (favoritosError) {
          console.error('Error cargando favoritos:', favoritosError);
          setCancionesFavoritas([]);
        } else {
          console.log('Favoritos cargados:', favoritosData);
          
          // Procesar canciones y obtener información de artistas
          const cancionesProcesadas: CancionFavorita[] = await Promise.all(
            (favoritosData || [])
              .filter((fav: any) => fav.canciones)
              .map(async (fav: any) => {
                const cancion = fav.canciones;
                
                // Intentar obtener información del artista
                let nombreArtista = 'Artista desconocido';
                try {
                  const { data: usuarioData } = await supabase
                    .from('usuarios')
                    .select(`
                      nombre,
                      perfiles_artista (nombre_artistico)
                    `)
                    .eq('id', cancion.usuario_subida_id)
                    .single();
                  
                  if (usuarioData) {
                    nombreArtista = (usuarioData as any).perfiles_artista?.[0]?.nombre_artistico || 
                                   (usuarioData as any).nombre || 
                                   'Artista desconocido';
                  }
                } catch (artistaError) {
                  console.warn('Error obteniendo info del artista:', artistaError);
                }
                
                // Generar URL de audio corregida
                const urlAudioCorregida = await generarUrlAudio(cancion);
                
                return {
                  id: cancion.id,
                  titulo: cancion.titulo,
                  artista: nombreArtista,
                  album: undefined, // Por ahora sin álbum
                  duracion: cancion.duracion,
                  genero: cancion.genero,
                  fecha_agregada: fav.fecha_agregada,
                  imagen_url: cancion.imagen_url,
                  archivo_audio_url: urlAudioCorregida,
                  usuario_subida_id: cancion.usuario_subida_id
                };
              })
          );
          
          setCancionesFavoritas(cancionesProcesadas);
        }
        
      } catch (supabaseError) {
        console.error('Error con Supabase:', supabaseError);
        setCancionesFavoritas([]);
      }
    } catch (error) {
      console.error('Error general:', error);
      setCancionesFavoritas([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para reproducir una canción específica
  const reproducirCancion = async (cancion: CancionFavorita) => {
    try {
      // Convertir la canción al formato del contexto
      const cancionParaContexto = {
        id: cancion.id,
        titulo: cancion.titulo,
        artista: cancion.artista,
        album: cancion.album,
        genero: cancion.genero ?? '',
        duracion: cancion.duracion,
        url_archivo: cancion.archivo_audio_url,
        usuario_id: cancion.usuario_subida_id
      };

      // Convertir toda la lista de favoritos para la playlist
      const playlistParaContexto = cancionesFavoritas.map(c => ({
        id: c.id,
        titulo: c.titulo,
        artista: c.artista,
        album: c.album,
        genero: c.genero ?? '',
        duracion: c.duracion,
        url_archivo: c.archivo_audio_url,
        usuario_id: c.usuario_subida_id
      }));

      // Reproducir usando el contexto global
      playSong(cancionParaContexto, playlistParaContexto);
      console.log('Reproduciendo canción:', cancion.titulo);
    } catch (error) {
      console.error('Error reproduciendo canción:', error);
    }
  };

  // Función para reproducir todas las canciones favoritas
  const reproducirTodosFavoritos = () => {
    if (cancionesFavoritas.length === 0) {
      console.warn('No hay canciones favoritas para reproducir');
      return;
    }

    // Reproducir la primera canción de la lista
    reproducirCancion(cancionesFavoritas[0]);
  };

  const toggleFavorito = async (id: string) => {
    try {
      if (!user) {
        console.warn('Usuario no autenticado');
        return;
      }

      // Verificar si ya está en favoritos
      const { data: existeFavorito } = await supabase
        .from('favoritos')
        .select('id')
        .eq('usuario_id', user.id)
        .eq('cancion_id', id)
        .single();

      if (existeFavorito) {
        // Remover de favoritos
        const { error } = await supabase
          .from('favoritos')
          .delete()
          .eq('usuario_id', user.id)
          .eq('cancion_id', id);

        if (error) {
          console.error('Error removiendo favorito:', error);
          return;
        }

        // Actualizar estado local
        setCancionesFavoritas(prev => prev.filter(cancion => cancion.id !== id));
        console.log(`Canción ${id} removida de favoritos`);
      } else {
        // Agregar a favoritos
        const { error } = await supabase
          .from('favoritos')
          .insert({
            usuario_id: user.id,
            cancion_id: id
          });

        if (error) {
          console.error('Error agregando favorito:', error);
          return;
        }

        console.log(`Canción ${id} agregada a favoritos`);
        // Recargar favoritos para obtener la canción completa
        cargarFavoritos();
      }
    } catch (error) {
      console.error('Error toggling favorito:', error);
    }
  };

  // Filtros
  const filteredCanciones = cancionesFavoritas.filter(cancion =>
    cancion.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cancion.artista.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cancion.album?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className={`${themeClasses.bgCard} rounded-lg shadow p-6`}>
          <div className="flex items-center space-x-3 mb-4">
            <HeartIcon className={`h-8 w-8 text-red-500`} />
            <h2 className={`text-2xl font-bold ${themeClasses.text}`}>
              Mis Favoritos ❤️
            </h2>
          </div>
          <p className={themeClasses.textSecondary}>
            Tu colección de canciones y playlists favoritas
          </p>
        </div>

        {/* Controles y Pestañas */}
        <div className={`${themeClasses.bgCard} rounded-lg shadow`}>
          {/* Header de canciones */}
          <div className={`border-b ${themeClasses.border} px-6 py-4`}>
            <div className="flex items-center space-x-2">
              <MusicalNoteIcon className="h-5 w-5 text-red-600" />
              <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
                Canciones Favoritas ({filteredCanciones.length})
              </h3>
            </div>
          </div>

          {/* Controles */}
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex gap-4">
                <button 
                  onClick={reproducirTodosFavoritos}
                  disabled={cancionesFavoritas.length === 0}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <PlayIcon className="h-5 w-5" />
                  <span>Reproducir Todo</span>
                </button>
                <button className={`border ${themeClasses.border} ${themeClasses.text} px-4 py-2 rounded-lg ${themeClasses.bgHover} transition-colors`}>
                  📤 Exportar
                </button>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar canciones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`${themeClasses.inputBg} border ${themeClasses.inputBorder} rounded-lg px-3 py-2 pl-10 w-64 focus:ring-2 focus:ring-red-400 outline-none ${themeClasses.text}`}
                  />
                  <MagnifyingGlassIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${themeClasses.textMuted}`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className={`${themeClasses.bgCard} rounded-lg shadow`}>
          <div className="p-6">
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className={themeClasses.textMuted}>Cargando favoritos...</p>
              </div>
            )}

            {!loading && (
              <>
                {filteredCanciones.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">💔</div>
                    <h4 className={`text-xl font-medium mb-2 ${themeClasses.text}`}>
                      {searchTerm ? 'No se encontraron canciones' : 'No tienes canciones favoritas'}
                    </h4>
                    <p className={`${themeClasses.textMuted} mb-6`}>
                      {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Explora música y marca tus canciones favoritas'}
                    </p>
                    {!searchTerm && (
                      <button className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors">
                        🎵 Explorar Música
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredCanciones.map((cancion, index) => (
                      <div key={cancion.id} className={`playlist-card ${themeClasses.bgHover} border ${themeClasses.border} rounded-lg p-4 transition-all duration-200 group relative cursor-pointer hover:shadow-md hover:border-red-300`}
                           onClick={() => reproducirCancion(cancion)}
                           title="Clic para reproducir">
                        <div className="flex items-center space-x-4">
                          {/* Número/Play icon */}
                          <div className={`w-8 text-center ${themeClasses.textMuted} text-sm group-hover:hidden`}>
                            {index + 1}
                          </div>
                          <div className="w-8 text-center hidden group-hover:block">
                            <PlayIcon className="w-5 h-5 text-red-600 mx-auto" />
                          </div>

                          {/* Imagen/Icono */}
                          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                            {cancion.imagen_url ? (
                              <img src={cancion.imagen_url} alt={cancion.titulo} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <MusicalNoteIcon className="h-6 w-6 text-white" />
                            )}
                          </div>

                          {/* Información */}
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-medium ${themeClasses.text} truncate`}>{cancion.titulo}</h4>
                            <p className={`text-sm ${themeClasses.textMuted} truncate`}>
                              {cancion.artista}{cancion.album ? ` • ${cancion.album}` : ''}
                            </p>
                          </div>

                          {/* Género */}
                          <div className="hidden md:block">
                            {cancion.genero && (
                              <span className={`text-xs px-2 py-1 bg-gray-100 ${themeClasses.textMuted} rounded-full`}>
                                {cancion.genero}
                              </span>
                            )}
                          </div>

                          {/* Duración */}
                          <div className={`text-sm ${themeClasses.textMuted} w-16 text-right`}>
                            {formatearDuracion(cancion.duracion)}
                          </div>

                          {/* Acciones */}
                          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorito(cancion.id);
                              }}
                              className="text-red-500 hover:text-red-700 p-1 rounded"
                              title="Quitar de favoritos"
                            >
                              <HeartSolidIcon className="h-5 w-5" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                reproducirCancion(cancion);
                              }}
                              className={`${themeClasses.textMuted} hover:text-red-600 p-1 rounded transition-colors`}
                              title="Reproducir canción"
                            >
                              <PlayIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 
