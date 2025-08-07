'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useSupabase } from '@/components/SupabaseProvider';
import { 
  PlayIcon,
  PauseIcon,
  HeartIcon,
  TrashI        const { error } = await supabase
          .from('playlist_favoritos')
          .insert({
            usuario_id: user.id,
            playlist_id: playlistId
          });

        if (error) {
          console.error('Error agregando playlist a favoritos:', error);
          return;
        }

        console.log(`Playlist ${playlistId} agregada a favoritos`);
        setPlaylist(prev => prev ? { ...prev, es_favorito: true } : null);
        setMensaje('Playlist agregada a favoritos');       // Agregar a favoritos
        const { error } = await supabase
          .from('playlist_favoritos')
          .insert({
            usuario_id: user.id,
            playlist_id: playlistId
          });

        if (error) {
          console.error('Error agregando playlist a favoritos:', error);
          return;
        }

        // Actualizar estado local
        setPlaylist(prev => prev ? { ...prev, es_favorito: true } : null);
        setMensaje('Playlist agregada a favoritos');
        setTimeout(() => setMensaje(''), 3000);
        
        console.log(`Playlist ${playlistId} agregada a favoritos`);usicalNoteIcon,
  ArrowLeftIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  ShareIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

interface Cancion {
  id: string;
  titulo: string;
  artista: string;
  album: string;
  duracion: string;
  genero: string;
  año: number;
  archivo_audio_url: string;
  imagen_url?: string;
  es_favorito: boolean;
  reproducciones: number;
  posicion: number;
  fecha_agregada: string;
  usuario_subida_id: string;
}

interface PlaylistDetalle {
  id: string;
  nombre: string;
  descripcion?: string;
  numero_canciones: number;
  duracion_total: number;
  es_publica: boolean;
  imagen_url?: string;
  created_at: string;
  usuario_id: string;
  es_favorito?: boolean;
}

export default function PlaylistDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { supabase } = useSupabase();
  
  const playlistId = params?.id as string;
  
  const [playlist, setPlaylist] = useState<PlaylistDetalle | null>(null);
  const [canciones, setCanciones] = useState<Cancion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [cancionReproduciendo, setCancionReproduciendo] = useState<string | null>(null);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [mostrarMenuOpciones, setMostrarMenuOpciones] = useState(false);
  const [nombrePlaylist, setNombrePlaylist] = useState('');
  const [descripcionPlaylist, setDescripcionPlaylist] = useState('');
  const [esPublica, setEsPublica] = useState(false);
  const [mensaje, setMensaje] = useState<string>('');

  useEffect(() => {
    const inicializar = async () => {
      console.log('🚀 Inicializando componente...');
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('👤 Usuario obtenido:', user);
        setUser(user);
        
        if (playlistId) {
          console.log('📋 Cargando datos de playlist...');
          // Cargar datos de la playlist
          await cargarPlaylistConUsuario(user, playlistId);
          await cargarCancionesPlaylist();
        }
      } catch (error) {
        console.error('💥 Error inicializando:', error);
      } finally {
        setCargando(false);
      }
    };
    
    inicializar();
  }, [playlistId]);

  const cargarPlaylistConUsuario = async (usuario: any, id: string) => {
    console.log('📋 Cargando playlist detalle...');
    console.log('👤 User en cargarPlaylistDetalle:', usuario);
    console.log('🆔 PlaylistId:', id);
    
    try {
      const { data: playlistData, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Error cargando playlist:', error);
        return;
      }

      console.log('📋 Playlist data:', playlistData);

      // Verificar si está en favoritos solo si hay usuario
      let esFavorito = false;
      if (usuario?.id) {
        console.log('🔍 Verificando si playlist está en favoritos...');
        const { data: favoritoData, error: favoritoError } = await supabase
          .from('playlist_favoritos')
          .select('id')
          .eq('playlist_id', id)
          .eq('usuario_id', usuario.id)
          .single();

        console.log('❤️ Favorito data:', favoritoData);
        console.log('❌ Favorito error:', favoritoError);
        
        esFavorito = !!favoritoData;
      }

      setPlaylist({
        ...playlistData,
        es_favorito: esFavorito
      });

      setNombrePlaylist(playlistData.nombre);
      setDescripcionPlaylist(playlistData.descripcion || '');
      setEsPublica(playlistData.es_publica);
      
      console.log('✅ Playlist cargada con es_favorito:', esFavorito);
    } catch (error) {
      console.error('💥 Error cargando playlist:', error);
    }
  };

  const cargarCancionesPlaylist = async () => {
    try {
      const { data: playlistCanciones, error } = await supabase
        .from('playlist_canciones')
        .select(`
          posicion,
          fecha_agregada,
          canciones:cancion_id (
            id,
            titulo,
            archivo_audio_url,
            duracion,
            imagen_url,
            usuario_subida_id,
            created_at
          )
        `)
        .eq('playlist_id', playlistId)
        .order('posicion');

      if (error) {
        console.error('Error cargando canciones:', error);
        return;
      }

      const cancionesFormateadas = await Promise.all(
        (playlistCanciones || []).map(async (item: any) => {
          const cancion = item.canciones;
          
          // Obtener información del artista
          let artista = 'Artista desconocido';
          if (cancion.usuario_subida_id) {
            const { data: usuarioData } = await supabase
              .from('usuarios')
              .select('nombre')
              .eq('id', cancion.usuario_subida_id)
              .single();
            
            if (usuarioData) {
              artista = usuarioData.nombre || 'Artista desconocido';
            }
          }

          // Verificar si es favorito del usuario
          const { data: favoritoData } = await supabase
            .from('favoritos')
            .select('id')
            .eq('cancion_id', cancion.id)
            .eq('usuario_id', user?.id)
            .single();

          return {
            id: cancion.id,
            titulo: cancion.titulo,
            artista: artista,
            album: 'Álbum desconocido',
            duracion: cancion.duracion || '0:00',
            genero: 'Desconocido',
            año: new Date(cancion.created_at).getFullYear(),
            archivo_audio_url: cancion.archivo_audio_url,
            imagen_url: cancion.imagen_url,
            es_favorito: !!favoritoData,
            reproducciones: 0,
            posicion: item.posicion,
            fecha_agregada: item.fecha_agregada,
            usuario_subida_id: cancion.usuario_subida_id
          };
        })
      );

      setCanciones(cancionesFormateadas);
    } catch (error) {
      console.error('Error cargando canciones:', error);
    }
  };

  // Función para hacer logging detallado de errores
  const logError = (context: string, error: any) => {
    console.error(`💥 Error en ${context}:`, error);
    
    // Intentar diferentes métodos para mostrar el error
    try {
      console.error(`🔍 Error stringified:`, JSON.stringify(error, null, 2));
    } catch (jsonError) {
      console.error(`⚠️ No se pudo serializar el error:`, jsonError);
    }
    
    // Mostrar propiedades específicas del error
    if (error) {
      console.error(`🔍 Error.message:`, error.message);
      console.error(`🔍 Error.code:`, error.code);
      console.error(`🔍 Error.details:`, error.details);
      console.error(`🔍 Error.hint:`, error.hint);
      console.error(`🔍 Error type:`, typeof error);
      console.error(`🔍 Error constructor:`, error.constructor?.name);
      console.error(`🔍 Error keys:`, Object.keys(error || {}));
      
      // Intentar mostrar todas las propiedades
      for (const key in error) {
        console.error(`🔍 Error.${key}:`, error[key]);
      }
    }
  };

  const toggleFavorito = async () => {
    console.log('Iniciando toggleFavorito simplificado...');
    
    if (!user || !playlist) {
      console.warn('Usuario no autenticado o playlist no disponible');
      return;
    }

    try {
      const esFavorito = playlist.es_favorito;
      
      if (esFavorito) {
        // Remover de favoritos
        const { error } = await supabase
          .from('playlist_favoritos')
          .delete()
          .eq('usuario_id', user.id)
          .eq('playlist_id', playlistId);

        if (error) {
          console.error('Error removiendo playlist de favoritos:', error);
          return;
        }

        // Actualizar estado local
        setPlaylist(prev => prev ? { ...prev, es_favorito: false } : null);
        setMensaje('Playlist removida de favoritos');
        setTimeout(() => setMensaje(''), 3000);
        
        console.log(`Playlist ${playlistId} removida de favoritos`);
      } else {
        console.log('Agregando a favoritos...');
        
        // Agregar a favoritos
        const { error, data } = await supabase
          .from('playlist_favoritos')
          .insert({
            playlist_id: playlistId,
            usuario_id: user.id
          })
          .select();

        console.log('� Respuesta de inserción:', { data, error });

        if (error) {
          logError('agregar a favoritos', error);
          throw error;
        }

        console.log('✅ Agregado a favoritos exitosamente');
        setPlaylist(prev => prev ? { ...prev, es_favorito: true } : null);
        setMensaje('Playlist agregada a favoritos');
      }

      setTimeout(() => setMensaje(''), 3000);
    } catch (error: any) {
      logError('toggleFavorito', error);
      
      let mensajeError = 'Error al actualizar favoritos';
      if (error?.message) {
        mensajeError = `Error: ${error.message}`;
      } else if (error?.code) {
        mensajeError = `Error código: ${error.code}`;
      } else if (error?.details) {
        mensajeError = `Error: ${error.details}`;
      }
      
      setMensaje(mensajeError);
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  const toggleFavoritoCancion = async (cancionId: string) => {
    if (!user) return;

    try {
      const cancion = canciones.find(c => c.id === cancionId);
      if (!cancion) return;

      if (cancion.es_favorito) {
        // Quitar de favoritos
        const { error } = await supabase
          .from('favoritos')
          .delete()
          .eq('cancion_id', cancionId)
          .eq('usuario_id', user.id);

        if (error) throw error;
      } else {
        // Agregar a favoritos
        const { error } = await supabase
          .from('favoritos')
          .insert([{
            cancion_id: cancionId,
            usuario_id: user.id
          }]);

        if (error) throw error;
      }

      setCanciones(prev => 
        prev.map(c => 
          c.id === cancionId 
            ? { ...c, es_favorito: !c.es_favorito }
            : c
        )
      );
    } catch (error: any) {
      console.error('Error toggling favorito canción:', error);
    }
  };

  const eliminarCancionDePlaylist = async (cancionId: string) => {
    if (!user || !playlist) return;

    try {
      const { error } = await supabase
        .from('playlist_canciones')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('cancion_id', cancionId);

      if (error) throw error;

      // Actualizar estado local
      setCanciones(prev => prev.filter(c => c.id !== cancionId));
      
      // Actualizar contador en playlist
      if (playlist) {
        const nuevoConteo = playlist.numero_canciones - 1;
        await supabase
          .from('playlists')
          .update({ numero_canciones: nuevoConteo })
          .eq('id', playlistId);
        
        setPlaylist(prev => prev ? { ...prev, numero_canciones: nuevoConteo } : null);
      }

      setMensaje('Canción eliminada de la playlist');
      setTimeout(() => setMensaje(''), 3000);
    } catch (error: any) {
      console.error('Error eliminando canción:', error);
      setMensaje('Error al eliminar la canción');
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  const editarPlaylist = async () => {
    if (!nombrePlaylist.trim() || !user || !playlist) return;

    try {
      const { error } = await supabase
        .from('playlists')
        .update({
          nombre: nombrePlaylist.trim(),
          descripcion: descripcionPlaylist.trim() || null,
          es_publica: esPublica,
          updated_at: new Date().toISOString()
        })
        .eq('id', playlistId);

      if (error) throw error;

      setPlaylist(prev => prev ? {
        ...prev,
        nombre: nombrePlaylist.trim(),
        descripcion: descripcionPlaylist.trim() || undefined,
        es_publica: esPublica
      } : null);

      setMostrarModalEditar(false);
      setMensaje('Playlist actualizada exitosamente');
      setTimeout(() => setMensaje(''), 3000);
    } catch (error: any) {
      console.error('Error actualizando playlist:', error);
      setMensaje('Error al actualizar la playlist');
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  const eliminarPlaylist = async () => {
    if (!user || !playlist) return;

    try {
      // Eliminar canciones de la playlist primero
      await supabase
        .from('playlist_canciones')
        .delete()
        .eq('playlist_id', playlistId);

      // Eliminar de favoritos
      await supabase
        .from('playlist_favoritos')
        .delete()
        .eq('playlist_id', playlistId);

      // Eliminar la playlist
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId);

      if (error) throw error;

      setMensaje('Playlist eliminada exitosamente');
      setTimeout(() => {
        router.push('/usuario/playlists');
      }, 1000);
    } catch (error: any) {
      console.error('Error eliminando playlist:', error);
      setMensaje('Error al eliminar la playlist');
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  const compartirPlaylist = async () => {
    if (playlist?.es_publica) {
      const url = `${window.location.origin}/usuario/playlist/${playlistId}`;
      try {
        await navigator.clipboard.writeText(url);
        setMensaje('Enlace copiado al portapapeles');
        setTimeout(() => setMensaje(''), 3000);
      } catch (error) {
        setMensaje('Error al copiar enlace');
        setTimeout(() => setMensaje(''), 3000);
      }
    } else {
      setMensaje('Solo se pueden compartir playlists públicas');
      setTimeout(() => setMensaje(''), 3000);
    }
    setMostrarMenuOpciones(false);
  };

  const formatearDuracion = (segundos: string) => {
    const parts = segundos.split(':');
    if (parts.length === 2) {
      return segundos; // Ya está en formato MM:SS
    }
    
    const totalSegundos = parseInt(segundos) || 0;
    const minutos = Math.floor(totalSegundos / 60);
    const segs = totalSegundos % 60;
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const toggleReproduccion = (cancionId: string) => {
    if (cancionReproduciendo === cancionId) {
      setCancionReproduciendo(null);
    } else {
      setCancionReproduciendo(cancionId);
    }
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

  if (!playlist) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Playlist no encontrada
          </h2>
          <p className="text-gray-600 mb-6">
            La playlist que buscas no existe o no tienes permisos para verla.
          </p>
          <button
            onClick={() => router.push('/usuario/playlists')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver a mis playlists
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header con información de la playlist */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <button
              onClick={() => router.push('/usuario/playlists')}
              className="text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setMostrarMenuOpciones(!mostrarMenuOpciones)}
                className="text-white/80 hover:text-white transition-colors p-2"
              >
                <EllipsisVerticalIcon className="w-6 h-6" />
              </button>
              
              {mostrarMenuOpciones && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <button
                    onClick={() => {
                      setMostrarModalEditar(true);
                      setMostrarMenuOpciones(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <PencilIcon className="w-4 h-4 mr-3" />
                    Editar
                  </button>
                  <button
                    onClick={compartirPlaylist}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <ShareIcon className="w-4 h-4 mr-3" />
                    Compartir
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      setMostrarModalEliminar(true);
                      setMostrarMenuOpciones(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <TrashIcon className="w-4 h-4 mr-3" />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-start space-x-6">
            <div className="w-48 h-48 bg-white/20 rounded-lg flex items-center justify-center">
              {playlist.imagen_url ? (
                <img 
                  src={playlist.imagen_url} 
                  alt={playlist.nombre}
                  className="w-full h-full rounded-lg object-cover"
                />
              ) : (
                <MusicalNoteIcon className="w-24 h-24 text-white/60" />
              )}
            </div>
            
            <div className="flex-1">
              <p className="text-sm text-white/80 mb-2">Playlist</p>
              <h1 className="text-4xl font-bold mb-4">{playlist.nombre}</h1>
              {playlist.descripcion && (
                <p className="text-white/90 mb-4">{playlist.descripcion}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-white/80">
                <span>{playlist.numero_canciones} canciones</span>
                <span>•</span>
                <span>{playlist.es_publica ? 'Pública' : 'Privada'}</span>
                <span>•</span>
                <span>Creada el {formatearFecha(playlist.created_at)}</span>
              </div>
              
              <div className="flex items-center space-x-4 mt-6">
                <button
                  onClick={() => toggleReproduccion(canciones[0]?.id)}
                  className="bg-green-500 text-white w-14 h-14 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                >
                  {cancionReproduciendo ? (
                    <PauseIcon className="w-6 h-6" />
                  ) : (
                    <PlayIcon className="w-6 h-6 ml-1" />
                  )}
                </button>
                
                <button
                  onClick={toggleFavorito}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  {playlist.es_favorito ? (
                    <HeartIconSolid className="w-8 h-8 text-red-500" />
                  ) : (
                    <HeartIcon className="w-8 h-8" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de canciones */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Canciones ({canciones.length})
            </h3>
          </div>
          
          {canciones.length === 0 ? (
            <div className="p-6">
              <div className="text-center text-gray-500 py-12">
                <MusicalNoteIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-xl font-medium mb-2">
                  Esta playlist está vacía
                </h4>
                <p className="text-gray-400 mb-6">
                  Agrega canciones para comenzar a disfrutar tu música
                </p>
                <button
                  onClick={() => router.push('/usuario/buscar')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="w-5 h-5 inline mr-2" />
                  Buscar Música
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {canciones.map((cancion, index) => (
                <div 
                  key={cancion.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    cancionReproduciendo === cancion.id ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8">
                      {cancionReproduciendo === cancion.id ? (
                        <button
                          onClick={() => toggleReproduccion(cancion.id)}
                          className="text-green-600"
                        >
                          <PauseIcon className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleReproduccion(cancion.id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <PlayIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                      {cancion.imagen_url ? (
                        <img 
                          src={cancion.imagen_url} 
                          alt={cancion.titulo}
                          className="w-full h-full rounded-lg object-cover"
                        />
                      ) : (
                        <MusicalNoteIcon className="w-6 h-6 text-white" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {cancion.titulo}
                      </h4>
                      <p className="text-sm text-gray-500 truncate">
                        {cancion.artista}
                      </p>
                    </div>
                    
                    <div className="hidden md:block text-sm text-gray-500">
                      {cancion.album}
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      {formatearFecha(cancion.fecha_agregada)}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleFavoritoCancion(cancion.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {cancion.es_favorito ? (
                          <HeartIconSolid className="w-5 h-5 text-red-500" />
                        ) : (
                          <HeartIcon className="w-5 h-5" />
                        )}
                      </button>
                      
                      <span className="text-sm text-gray-500">
                        {formatearDuracion(cancion.duracion)}
                      </span>
                      
                      <button
                        onClick={() => eliminarCancionDePlaylist(cancion.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mensaje de notificación */}
      {mensaje && (
        <div className="fixed top-4 right-4 bg-purple-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {mensaje}
        </div>
      )}

      {/* Modal para editar playlist */}
      {mostrarModalEditar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Editar Playlist
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={descripcionPlaylist}
                    onChange={(e) => setDescripcionPlaylist(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="esPublicaEditar"
                    checked={esPublica}
                    onChange={(e) => setEsPublica(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="esPublicaEditar" className="text-sm text-gray-700">
                    Hacer playlist pública
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setMostrarModalEditar(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={editarPlaylist}
                  disabled={!nombrePlaylist.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para confirmar eliminación */}
      {mostrarModalEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <TrashIcon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Eliminar Playlist
                  </h3>
                  <p className="text-sm text-gray-500">
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                ¿Estás seguro de que quieres eliminar la playlist "{playlist.nombre}"? 
                Se eliminarán todas las canciones de la playlist.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setMostrarModalEliminar(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={eliminarPlaylist}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Eliminar Playlist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
