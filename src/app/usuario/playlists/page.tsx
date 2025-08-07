'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useSupabase } from '@/components/SupabaseProvider';
import Image from 'next/image';
import { 
  PlayIcon,
  HeartIcon,
  PlusIcon,
  MusicalNoteIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

interface Playlist {
  id: string;
  nombre: string;
  descripcion?: string;
  numero_canciones: number;
  es_publica: boolean;
  imagen_url?: string;
  created_at: string;
  usuario_id: string;
  es_favorito?: boolean;
}

interface User {
  id: string;
  email?: string;
}

export default function PlaylistsPage() {
  const router = useRouter();
  const { supabase } = useSupabase();
  
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [cargando, setCargando] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nombrePlaylist, setNombrePlaylist] = useState('');
  const [descripcionPlaylist, setDescripcionPlaylist] = useState('');
  const [esPublica, setEsPublica] = useState(false);
  const [mensaje, setMensaje] = useState<string>('');

  useEffect(() => {
    const inicializar = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Usuario autenticado:', user);
        setUser(user);
        
        if (user) {
          // Cargar playlists después de establecer el usuario
          setUser(user);
        }
      } catch (error) {
        console.error('Error inicializando:', error);
      } finally {
        setCargando(false);
      }
    };
    
    inicializar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Efecto separado para cargar playlists cuando el usuario esté disponible
  useEffect(() => {
    if (user) {
      cargarPlaylists();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const cargarPlaylists = async () => {
    if (!user) return;
    
    try {
      console.log('Cargando playlists para usuario:', user.id);
      
      const { data: playlistsData, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error en consulta de playlists:', error);
        setMensaje('Error al cargar las playlists');
        setTimeout(() => setMensaje(''), 3000);
        return;
      }

      console.log('Playlists cargadas:', playlistsData);

      if (!playlistsData) {
        setPlaylists([]);
        return;
      }

      // Verificar cuáles están en favoritos
      const playlistsConFavoritos = await Promise.all(
        playlistsData.map(async (playlist) => {
          try {
            const { data: favoritoData } = await supabase
              .from('playlist_favoritos')
              .select('id')
              .eq('playlist_id', playlist.id)
              .eq('usuario_id', user.id)
              .single();

            return {
              ...playlist,
              es_favorito: !!favoritoData
            };
          } catch {
            // Si no encuentra favorito, simplemente no es favorito
            return {
              ...playlist,
              es_favorito: false
            };
          }
        })
      );

      setPlaylists(playlistsConFavoritos);
    } catch (error) {
      console.error('Error cargando playlists:', error);
      setMensaje('Error al cargar las playlists');
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  const crearPlaylist = async () => {
    if (!nombrePlaylist.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert([{
          nombre: nombrePlaylist.trim(),
          descripcion: descripcionPlaylist.trim() || null,
          numero_canciones: 0,
          duracion_total: 0,
          es_publica: esPublica,
          usuario_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setPlaylists(prev => [{ ...data, es_favorito: false }, ...prev]);
      setMostrarModal(false);
      setNombrePlaylist('');
      setDescripcionPlaylist('');
      setEsPublica(false);
      setMensaje('Playlist creada exitosamente');
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      console.error('Error creando playlist:', error);
      setMensaje('Error al crear la playlist');
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  const toggleFavorito = async (playlistId: string) => {
    if (!user) return;

    try {
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) return;

      if (playlist.es_favorito) {
        const { error } = await supabase
          .from('playlist_favoritos')
          .delete()
          .eq('playlist_id', playlistId)
          .eq('usuario_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('playlist_favoritos')
          .insert([{
            playlist_id: playlistId,
            usuario_id: user.id
          }]);

        if (error) throw error;
      }

      setPlaylists(prev => 
        prev.map(p => 
          p.id === playlistId 
            ? { ...p, es_favorito: !p.es_favorito }
            : p
        )
      );
    } catch (error) {
      console.error('Error toggling favorito:', error);
    }
  };

  const eliminarPlaylist = async (playlistId: string) => {
    if (!user || !confirm('¿Estás seguro de que quieres eliminar esta playlist?')) return;

    try {
      // Primero eliminar las canciones de la playlist
      await supabase
        .from('playlist_canciones')
        .delete()
        .eq('playlist_id', playlistId);

      // Eliminar de favoritos si existe
      await supabase
        .from('playlist_favoritos')
        .delete()
        .eq('playlist_id', playlistId);

      // Eliminar la playlist
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId)
        .eq('usuario_id', user.id);

      if (error) throw error;

      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
      setMensaje('Playlist eliminada exitosamente');
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      console.error('Error eliminando playlist:', error);
      setMensaje('Error al eliminar la playlist');
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (cargando) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis Playlists</h1>
            <p className="text-gray-600 mt-2">
              Organiza tu música en playlists personalizadas
            </p>
          </div>
          
          <button
            onClick={() => setMostrarModal(true)}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Nueva Playlist
          </button>
        </div>

        {/* Grid de playlists */}
        {playlists.length === 0 ? (
          <div className="text-center py-12">
            <MusicalNoteIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No tienes playlists aún
            </h3>
            <p className="text-gray-600 mb-6">
              Crea tu primera playlist para organizar tu música favorita
            </p>
            <button
              onClick={() => setMostrarModal(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 inline mr-2" />
              Crear Primera Playlist
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {playlists.map((playlist) => (
              <div 
                key={playlist.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <div className="relative">
                  <div 
                    onClick={() => router.push(`/usuario/playlist/${playlist.id}`)}
                    className="w-full h-48 bg-gradient-to-br from-purple-400 to-pink-400 rounded-t-lg flex items-center justify-center"
                  >
                    {playlist.imagen_url ? (
                      <Image 
                        src={playlist.imagen_url} 
                        alt={playlist.nombre}
                        width={200}
                        height={200}
                        className="w-full h-full rounded-t-lg object-cover"
                      />
                    ) : (
                      <MusicalNoteIcon className="w-16 h-16 text-white/60" />
                    )}
                  </div>
                  
                  {/* Botón de play */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/usuario/playlist/${playlist.id}`);
                    }}
                    className="absolute bottom-2 right-2 bg-green-500 text-white w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-green-600"
                  >
                    <PlayIcon className="w-6 h-6 ml-1" />
                  </button>
                </div>
                
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 
                      onClick={() => router.push(`/usuario/playlist/${playlist.id}`)}
                      className="font-semibold text-gray-900 truncate hover:underline cursor-pointer"
                    >
                      {playlist.nombre}
                    </h3>
                    
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorito(playlist.id);
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {playlist.es_favorito ? (
                          <HeartIconSolid className="w-5 h-5 text-red-500" />
                        ) : (
                          <HeartIcon className="w-5 h-5" />
                        )}
                      </button>
                      
                      <div className="relative group/menu">
                        <button className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                          <EllipsisVerticalIcon className="w-5 h-5" />
                        </button>
                        
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 opacity-0 group-hover/menu:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/usuario/playlist/${playlist.id}`);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                          >
                            <PencilIcon className="w-4 h-4 mr-2" />
                            Editar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (playlist.es_publica) {
                                const url = `${window.location.origin}/usuario/playlist/${playlist.id}`;
                                navigator.clipboard.writeText(url);
                                setMensaje('Enlace copiado al portapapeles');
                                setTimeout(() => setMensaje(''), 3000);
                              } else {
                                setMensaje('Solo se pueden compartir playlists públicas');
                                setTimeout(() => setMensaje(''), 3000);
                              }
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                          >
                            <ShareIcon className="w-4 h-4 mr-2" />
                            Compartir
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              eliminarPlaylist(playlist.id);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center"
                          >
                            <TrashIcon className="w-4 h-4 mr-2" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {playlist.descripcion && (
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {playlist.descripcion}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{playlist.numero_canciones} canciones</span>
                    <span>{playlist.es_publica ? 'Pública' : 'Privada'}</span>
                  </div>
                  
                  <p className="text-xs text-gray-400 mt-1">
                    Creada el {formatearFecha(playlist.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mensaje de notificación */}
      {mensaje && (
        <div className="fixed top-4 right-4 bg-purple-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {mensaje}
        </div>
      )}

      {/* Modal para crear playlist */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Crear Nueva Playlist
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={nombrePlaylist}
                    onChange={(e) => setNombrePlaylist(e.target.value)}
                    placeholder="Ej: Mi música favorita"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-400 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={descripcionPlaylist}
                    onChange={(e) => setDescripcionPlaylist(e.target.value)}
                    placeholder="Describe tu playlist..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-400 outline-none"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="esPublica"
                    checked={esPublica}
                    onChange={(e) => setEsPublica(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="esPublica" className="text-sm text-gray-700">
                    Hacer playlist pública
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setMostrarModal(false);
                    setNombrePlaylist('');
                    setDescripcionPlaylist('');
                    setEsPublica(false);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={crearPlaylist}
                  disabled={!nombrePlaylist.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Crear Playlist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
