'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '../../../components/DashboardLayout';
import { useSupabase } from '@/components/SupabaseProvider';
import { HeartIcon, MagnifyingGlassIcon, MusicalNoteIcon, ClipboardDocumentListIcon, PlayIcon } from '@heroicons/react/24/outline';
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

interface PlaylistFavorita {
  id: string;
  nombre: string;
  descripcion?: string;
  creador: string;
  canciones_count: number;
  duracion_total: string;
  fecha_agregada: string;
  imagen_url?: string;
  es_publica: boolean;
  usuario_id: string;
}

type TabType = 'canciones' | 'playlists';

export default function FavoritosPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabType) || 'canciones';
  
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [cancionesFavoritas, setCancionesFavoritas] = useState<CancionFavorita[]>([]);
  const [playlistsFavoritas, setPlaylistsFavoritas] = useState<PlaylistFavorita[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<any>(null);
  
  const { supabase } = useSupabase();

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

  // Efecto para actualizar el tab cuando cambien los parámetros de la URL
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType;
    if (tabParam && (tabParam === 'canciones' || tabParam === 'playlists')) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const cargarFavoritos = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        console.log('Usuario no encontrado');
        setCancionesFavoritas([]);
        setPlaylistsFavoritas([]);
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
                    .select('nombre')
                    .eq('id', cancion.usuario_subida_id)
                    .single();
                  
                  if (usuarioData && usuarioData.nombre) {
                    nombreArtista = usuarioData.nombre;
                  }
                } catch (artistaError) {
                  console.warn('Error obteniendo info del artista:', artistaError);
                }
                
                return {
                  id: cancion.id,
                  titulo: cancion.titulo,
                  artista: nombreArtista,
                  album: undefined, // Por ahora sin álbum
                  duracion: cancion.duracion,
                  genero: cancion.genero,
                  fecha_agregada: fav.fecha_agregada,
                  imagen_url: cancion.imagen_url,
                  archivo_audio_url: cancion.archivo_audio_url,
                  usuario_subida_id: cancion.usuario_subida_id
                };
              })
          );
          
          setCancionesFavoritas(cancionesProcesadas);
        }

        // Cargar playlists favoritas desde Supabase
        const { data: playlistsFavoritasData, error: playlistsError } = await supabase
          .from('playlist_favoritos')
          .select(`
            id,
            fecha_agregada,
            playlist_id,
            playlists!inner (
              id,
              nombre,
              descripcion,
              numero_canciones,
              duracion_total,
              es_publica,
              imagen_url,
              usuario_id
            )
          `)
          .eq('usuario_id', user.id);

        if (playlistsError) {
          console.error('Error cargando playlists favoritas:', playlistsError);
          setPlaylistsFavoritas([]);
        } else {
          console.log('Playlists favoritas cargadas:', playlistsFavoritasData);
          
          // Procesar playlists y obtener información de creadores
          const playlistsProcesadas: PlaylistFavorita[] = await Promise.all(
            (playlistsFavoritasData || [])
              .filter((fav: any) => fav.playlists)
              .map(async (fav: any) => {
                const playlist = fav.playlists;
                
                // Obtener información del creador
                let nombreCreador = 'Usuario desconocido';
                if (playlist.usuario_id) {
                  const { data: usuarioData } = await supabase
                    .from('usuarios')
                    .select('nombre')
                    .eq('id', playlist.usuario_id)
                    .single();
                  
                  if (usuarioData && usuarioData.nombre) {
                    nombreCreador = usuarioData.nombre;
                  }
                }

                // Formatear duración total (convertir de segundos a formato MM:SS)
                let duracionFormateada = '00:00';
                if (playlist.duracion_total) {
                  const totalSegundos = parseInt(playlist.duracion_total.toString()) || 0;
                  const horas = Math.floor(totalSegundos / 3600);
                  const minutos = Math.floor((totalSegundos % 3600) / 60);
                  const segundos = totalSegundos % 60;
                  
                  if (horas > 0) {
                    duracionFormateada = `${horas}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
                  } else {
                    duracionFormateada = `${minutos}:${segundos.toString().padStart(2, '0')}`;
                  }
                }

                return {
                  id: playlist.id,
                  nombre: playlist.nombre,
                  descripcion: playlist.descripcion,
                  creador: nombreCreador,
                  canciones_count: playlist.numero_canciones || 0,
                  duracion_total: duracionFormateada,
                  fecha_agregada: fav.fecha_agregada,
                  imagen_url: playlist.imagen_url,
                  es_publica: playlist.es_publica,
                  usuario_id: playlist.usuario_id
                };
              })
          );

          setPlaylistsFavoritas(playlistsProcesadas);
        }
        
      } catch (supabaseError) {
        console.error('Error con Supabase:', supabaseError);
        setCancionesFavoritas([]);
        setPlaylistsFavoritas([]);
      }
    } catch (error) {
      console.error('Error general:', error);
      setCancionesFavoritas([]);
      setPlaylistsFavoritas([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorito = async (id: string, tipo: 'cancion' | 'playlist') => {
    try {
      if (!user) {
        console.warn('Usuario no autenticado');
        return;
      }

      if (tipo === 'cancion') {
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
      } else {
        // Para playlists, manejar favoritos en la base de datos
        const { data: existeFavorito } = await supabase
          .from('playlist_favoritos')
          .select('id')
          .eq('usuario_id', user.id)
          .eq('playlist_id', id)
          .single();

        if (existeFavorito) {
          // Remover de favoritos
          const { error } = await supabase
            .from('playlist_favoritos')
            .delete()
            .eq('usuario_id', user.id)
            .eq('playlist_id', id);

          if (error) {
            console.error('Error removiendo playlist de favoritos:', error);
            return;
          }

          // Actualizar estado local
          setPlaylistsFavoritas(prev => prev.filter(playlist => playlist.id !== id));
          console.log(`Playlist ${id} removida de favoritos`);
        } else {
          // Agregar a favoritos
          const { error } = await supabase
            .from('playlist_favoritos')
            .insert({
              usuario_id: user.id,
              playlist_id: id
            });

          if (error) {
            console.error('Error agregando playlist a favoritos:', error);
            return;
          }

          console.log(`Playlist ${id} agregada a favoritos`);
          // Recargar favoritos para obtener la playlist completa
          cargarFavoritos();
        }
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

  const filteredPlaylists = playlistsFavoritas.filter(playlist =>
    playlist.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    playlist.creador.toLowerCase().includes(searchTerm.toLowerCase()) ||
    playlist.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
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
          {/* Pestañas */}
          <div className={`border-b ${themeClasses.border}`}>
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('canciones')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'canciones'
                    ? 'border-red-500 text-red-600'
                    : `border-transparent ${themeClasses.textMuted} hover:text-gray-700 hover:border-gray-300`
                }`}
              >
                <div className="flex items-center space-x-2">
                  <MusicalNoteIcon className="h-5 w-5" />
                  <span>Canciones ({filteredCanciones.length})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('playlists')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'playlists'
                    ? 'border-red-500 text-red-600'
                    : `border-transparent ${themeClasses.textMuted} hover:text-gray-700 hover:border-gray-300`
                }`}
              >
                <div className="flex items-center space-x-2">
                  <ClipboardDocumentListIcon className="h-5 w-5" />
                  <span>Playlists ({filteredPlaylists.length})</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Controles */}
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex gap-4">
                <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2">
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
                    placeholder={`Buscar ${activeTab}...`}
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

            {!loading && activeTab === 'canciones' && (
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
                      <div key={cancion.id} className={`playlist-card ${themeClasses.bgHover} border ${themeClasses.border} rounded-lg p-4 transition-colors group relative`}>
                        <div className="flex items-center space-x-4">
                          {/* Número */}
                          <div className={`w-8 text-center ${themeClasses.textMuted} text-sm`}>
                            {index + 1}
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
                              onClick={() => toggleFavorito(cancion.id, 'cancion')}
                              className="text-red-500 hover:text-red-700 p-1 rounded"
                              title="Quitar de favoritos"
                            >
                              <HeartSolidIcon className="h-5 w-5" />
                            </button>
                            <button className={`${themeClasses.textMuted} hover:${themeClasses.text} p-1 rounded`}>
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

            {!loading && activeTab === 'playlists' && (
              <>
                {filteredPlaylists.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📋</div>
                    <h4 className={`text-xl font-medium mb-2 ${themeClasses.text}`}>
                      {searchTerm ? 'No se encontraron playlists' : 'No tienes playlists favoritas'}
                    </h4>
                    <p className={`${themeClasses.textMuted} mb-6`}>
                      {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Explora playlists y marca tus favoritas'}
                    </p>
                    {!searchTerm && (
                      <button className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors">
                        🔍 Explorar Playlists
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredPlaylists.map((playlist) => (
                      <div key={playlist.id} className={`playlist-card ${themeClasses.bgHover} border ${themeClasses.border} rounded-lg p-4 transition-colors group relative`}>
                        {/* Botón de favorito */}
                        <div className="absolute top-3 right-3 z-10">
                          <button
                            onClick={() => toggleFavorito(playlist.id, 'playlist')}
                            className="text-red-500 hover:text-red-700 p-1 rounded bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Quitar de favoritos"
                          >
                            <HeartSolidIcon className="h-5 w-5" />
                          </button>
                        </div>

                        {/* Imagen de playlist */}
                        <div className="w-full h-32 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg mb-4 flex items-center justify-center">
                          {playlist.imagen_url ? (
                            <img src={playlist.imagen_url} alt={playlist.nombre} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <ClipboardDocumentListIcon className="h-12 w-12 text-white" />
                          )}
                        </div>

                        {/* Información de playlist */}
                        <div>
                          <h4 className={`font-medium ${themeClasses.text} mb-1`}>{playlist.nombre}</h4>
                          {playlist.descripcion && (
                            <p className={`text-sm ${themeClasses.textMuted} mb-2 line-clamp-2`}>{playlist.descripcion}</p>
                          )}
                          <div className={`text-xs ${themeClasses.textMuted} space-y-1`}>
                            <p>Por {playlist.creador}</p>
                            <p>{playlist.canciones_count} canciones • {playlist.duracion_total}</p>
                            <p>
                              {playlist.es_publica ? '🌍 Pública' : '🔒 Privada'} • 
                              {new Date(playlist.fecha_agregada).toLocaleDateString('es-ES')}
                            </p>
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
