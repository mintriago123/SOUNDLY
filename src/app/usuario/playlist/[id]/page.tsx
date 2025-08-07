'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useSupabase } from '@/components/SupabaseProvider';
import Image from 'next/image';
import { 
  PlayIcon,
  PauseIcon,
  HeartIcon,
  TrashIcon,
  MusicalNoteIcon,
  ArrowLeftIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  ShareIcon,
  PlusIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

interface Cancion {
  id: string;
  titulo: string;
  artista: string;
  album: string;
  duracion: number;
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

interface User {
  id: string;
  email?: string;
}


export default function PlaylistDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { supabase } = useSupabase();
  
  const playlistId = params?.id as string;
  
  const [playlist, setPlaylist] = useState<PlaylistDetalle | null>(null);
  const [canciones, setCanciones] = useState<Cancion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [cancionActual, setCancionActual] = useState<Cancion | null>(null);
  const [reproduciendose, setReproduciendose] = useState(false);
  const [tiempoActual, setTiempoActual] = useState(0);
  const [duracionTotal, setDuracionTotal] = useState(0);
  const [volumen, setVolumen] = useState(0.8);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [mostrarMenuOpciones, setMostrarMenuOpciones] = useState(false);
  const [nombrePlaylist, setNombrePlaylist] = useState('');
  const [descripcionPlaylist, setDescripcionPlaylist] = useState('');
  const [esPublica, setEsPublica] = useState(false);
  const [mensaje, setMensaje] = useState<string>('');

  // Cargar datos iniciales
  useEffect(() => {
    const inicializar = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user && playlistId) {
          await cargarPlaylistDetalle();
          await cargarCancionesPlaylist();
        }
      } catch (error) {
        console.error('Error inicializando:', error);
      } finally {
        setCargando(false);
      }
    };
    
    inicializar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlistId]);

  // Función para reproducir siguiente
  const reproducirSiguiente = useCallback(() => {
    if (!cancionActual) return;
    
    const indiceActual = canciones.findIndex(c => c.id === cancionActual.id);
    const siguienteIndice = (indiceActual + 1) % canciones.length;
    
    if (siguienteIndice < canciones.length) {
      // Crear nuevo audio
      const nuevoAudio = new Audio(canciones[siguienteIndice].archivo_audio_url);
      nuevoAudio.volume = volumen;
      
      if (audio) {
        audio.pause();
      }
      
      setAudio(nuevoAudio);
      setCancionActual(canciones[siguienteIndice]);
      setReproduciendose(true);
      
      nuevoAudio.play().catch(error => {
        console.error('Error reproduciendo siguiente canción:', error);
      });
    }
  }, [cancionActual, canciones, audio, volumen]);

  // Manejar eventos del reproductor de audio
  useEffect(() => {
    if (audio) {
      const actualizarTiempo = () => setTiempoActual(audio.currentTime);
      const actualizarDuracion = () => setDuracionTotal(audio.duration);
      const manejarFin = () => reproducirSiguiente();

      audio.addEventListener('timeupdate', actualizarTiempo);
      audio.addEventListener('loadedmetadata', actualizarDuracion);
      audio.addEventListener('ended', manejarFin);

      return () => {
        audio.removeEventListener('timeupdate', actualizarTiempo);
        audio.removeEventListener('loadedmetadata', actualizarDuracion);
        audio.removeEventListener('ended', manejarFin);
      };
    }
  }, [audio, reproducirSiguiente]);

  const cargarPlaylistDetalle = useCallback(async () => {
    try {
      const { data: playlistData, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('id', playlistId)
        .single();

      if (error) {
        console.error('Error cargando playlist:', error);
        return;
      }

      // Verificar si está en favoritos
      const { data: favoritoData } = await supabase
        .from('playlist_favoritos')
        .select('id')
        .eq('playlist_id', playlistId)
        .eq('usuario_id', user?.id)
        .single();

      setPlaylist({
        ...playlistData,
        es_favorito: !!favoritoData
      });

      setNombrePlaylist(playlistData.nombre);
      setDescripcionPlaylist(playlistData.descripcion || '');
      setEsPublica(playlistData.es_publica);
    } catch (error) {
      console.error('Error cargando playlist:', error);
    }
  }, [supabase, playlistId, user?.id]);

  const cargarCancionesPlaylist = useCallback(async () => {
    try {
      const { data: playlistCanciones, error } = await supabase
        .from('playlist_canciones')
        .select(`
          posicion,
          fecha_agregada,
          canciones:cancion_id (
            id,
            titulo,
            duracion,
            genero,
            año,
            archivo_audio_url,
            imagen_url,
            usuario_subida_id,
            reproducciones,
            album_id,
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (playlistCanciones as any[] || []).map(async (item: any) => {
          const cancion = item.canciones;
          
          // Obtener información del artista/usuario
          let artista = 'Artista desconocido';
          if (cancion.usuario_subida_id) {
            const { data: usuarioData } = await supabase
              .from('usuarios')
              .select('nombre')
              .eq('id', cancion.usuario_subida_id)
              .single();
            
            if (usuarioData?.nombre) {
              artista = usuarioData.nombre;
            }
          }

          // Obtener información del álbum
          let album = 'Álbum desconocido';
          if (cancion.album_id) {
            const { data: albumData } = await supabase
              .from('albumes')
              .select('titulo')
              .eq('id', cancion.album_id)
              .single();
            
            if (albumData?.titulo) {
              album = albumData.titulo;
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
            album: album,
            duracion: cancion.duracion || 0,
            genero: cancion.genero || 'Desconocido',
            año: cancion.año || new Date(cancion.created_at).getFullYear(),
            archivo_audio_url: cancion.archivo_audio_url,
            imagen_url: cancion.imagen_url,
            es_favorito: !!favoritoData,
            reproducciones: cancion.reproducciones || 0,
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
  }, [supabase, playlistId, user?.id]);

  const toggleFavorito = async () => {
    if (!user || !playlist) return;

    try {
      if (playlist.es_favorito) {
        const { error } = await supabase
          .from('playlist_favoritos')
          .delete()
          .eq('playlist_id', playlistId)
          .eq('usuario_id', user.id);

        if (error) throw error;

        setPlaylist(prev => prev ? { ...prev, es_favorito: false } : null);
        setMensaje('Playlist quitada de favoritos');
      } else {
        const { error } = await supabase
          .from('playlist_favoritos')
          .insert([{
            playlist_id: playlistId,
            usuario_id: user.id
          }]);

        if (error) throw error;

        setPlaylist(prev => prev ? { ...prev, es_favorito: true } : null);
        setMensaje('Playlist agregada a favoritos');
      }

      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      console.error('Error toggling favorito:', error);
      setMensaje('Error al actualizar favoritos');
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  const toggleFavoritoCancion = async (cancionId: string) => {
    if (!user) return;

    try {
      const cancion = canciones.find(c => c.id === cancionId);
      if (!cancion) return;

      if (cancion.es_favorito) {
        const { error } = await supabase
          .from('favoritos')
          .delete()
          .eq('cancion_id', cancionId)
          .eq('usuario_id', user.id);

        if (error) throw error;
      } else {
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
    } catch (error) {
      console.error('Error toggling favorito canción:', error);
    }
  };

  const reproducirCancion = async (cancion: Cancion) => {
    try {
      // Pausar audio actual si existe
      if (audio) {
        audio.pause();
      }

      // Crear nuevo audio
      const nuevoAudio = new Audio(cancion.archivo_audio_url);
      nuevoAudio.volume = volumen;
      
      setAudio(nuevoAudio);
      setCancionActual(cancion);
      setReproduciendose(true);
      
      await nuevoAudio.play();

      // Registrar reproducción en estadísticas
      if (user) {
        await supabase
          .from('estadisticas_reproducciones')
          .insert([{
            cancion_id: cancion.id,
            usuario_id: user.id
          }]);

        // Incrementar contador de reproducciones
        await supabase
          .from('canciones')
          .update({ 
            reproducciones: cancion.reproducciones + 1 
          })
          .eq('id', cancion.id);
      }

    } catch (error) {
      console.error('Error reproduciendo canción:', error);
      setMensaje('Error al reproducir la canción');
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  const pausarReproduccion = () => {
    if (audio) {
      audio.pause();
      setReproduciendose(false);
    }
  };

  const reanudarReproduccion = () => {
    if (audio) {
      audio.play();
      setReproduciendose(true);
    }
  };

  const reproducirAnterior = () => {
    if (!cancionActual) return;
    
    const indiceActual = canciones.findIndex(c => c.id === cancionActual.id);
    const anteriorIndice = indiceActual > 0 ? indiceActual - 1 : canciones.length - 1;
    
    reproducirCancion(canciones[anteriorIndice]);
  };

  const cambiarTiempo = (nuevoTiempo: number) => {
    if (audio) {
      audio.currentTime = nuevoTiempo;
      setTiempoActual(nuevoTiempo);
    }
  };

  const cambiarVolumen = (nuevoVolumen: number) => {
    setVolumen(nuevoVolumen);
    if (audio) {
      audio.volume = nuevoVolumen;
    }
  };

  const formatearTiempo = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const segs = Math.floor(segundos % 60);
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

      setCanciones(prev => prev.filter(c => c.id !== cancionId));
      
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
    } catch (error) {
      console.error('Error eliminando canción:', error);
      setMensaje('Error al eliminar la canción');
      setTimeout(() => setMensaje(''), 3000);
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
                    onClick={() => {
                      if (playlist?.es_publica) {
                        const url = `${window.location.origin}/usuario/playlist/${playlistId}`;
                        navigator.clipboard.writeText(url);
                        setMensaje('Enlace copiado al portapapeles');
                        setTimeout(() => setMensaje(''), 3000);
                      } else {
                        setMensaje('Solo se pueden compartir playlists públicas');
                        setTimeout(() => setMensaje(''), 3000);
                      }
                      setMostrarMenuOpciones(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <ShareIcon className="w-4 h-4 mr-3" />
                    Compartir
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-start space-x-6">
            <div className="w-48 h-48 bg-white/20 rounded-lg flex items-center justify-center">
              {playlist.imagen_url ? (
                <Image 
                  src={playlist.imagen_url} 
                  alt={playlist.nombre}
                  width={192}
                  height={192}
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
                  onClick={() => {
                    if (canciones.length > 0) {
                      if (reproduciendose && cancionActual) {
                        pausarReproduccion();
                      } else if (cancionActual) {
                        reanudarReproduccion();
                      } else {
                        reproducirCancion(canciones[0]);
                      }
                    }
                  }}
                  className="bg-green-500 text-white w-14 h-14 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                >
                  {reproduciendose ? (
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
              {/* Header de la tabla */}
              <div className="p-4 bg-gray-50 grid grid-cols-12 gap-4 text-sm font-medium text-gray-500">
                <div className="col-span-1">#</div>
                <div className="col-span-5">Título</div>
                <div className="col-span-2">Álbum</div>
                <div className="col-span-2">Fecha agregada</div>
                <div className="col-span-1">
                  <ClockIcon className="w-4 h-4" />
                </div>
                <div className="col-span-1">Acciones</div>
              </div>

              {canciones.map((cancion) => (
                <div 
                  key={cancion.id}
                  className={`p-4 hover:bg-gray-50 transition-colors grid grid-cols-12 gap-4 items-center ${
                    cancionActual?.id === cancion.id ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="col-span-1">
                    {cancionActual?.id === cancion.id && reproduciendose ? (
                      <button
                        onClick={pausarReproduccion}
                        className="text-green-600"
                      >
                        <PauseIcon className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => reproducirCancion(cancion)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <PlayIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  
                  <div className="col-span-5 flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                      {cancion.imagen_url ? (
                        <Image 
                          src={cancion.imagen_url} 
                          alt={cancion.titulo}
                          width={48}
                          height={48}
                          className="w-full h-full rounded-lg object-cover"
                        />
                      ) : (
                        <MusicalNoteIcon className="w-6 h-6 text-white" />
                      )}
                    </div>
                    
                    <div className="min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {cancion.titulo}
                      </h4>
                      <p className="text-sm text-gray-500 truncate">
                        {cancion.artista}
                      </p>
                    </div>
                  </div>
                  
                  <div className="col-span-2 text-sm text-gray-500 truncate">
                    {cancion.album}
                  </div>
                  
                  <div className="col-span-2 text-sm text-gray-500">
                    {formatearFecha(cancion.fecha_agregada)}
                  </div>
                  
                  <div className="col-span-1 text-sm text-gray-500">
                    {formatearTiempo(cancion.duracion)}
                  </div>
                  
                  <div className="col-span-1 flex items-center space-x-2">
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
                    
                    <button
                      onClick={() => eliminarCancionDePlaylist(cancion.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reproductor de música */}
        {cancionActual && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                {/* Información de la canción */}
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                    {cancionActual.imagen_url ? (
                      <Image 
                        src={cancionActual.imagen_url} 
                        alt={cancionActual.titulo}
                        width={48}
                        height={48}
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : (
                      <MusicalNoteIcon className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {cancionActual.titulo}
                    </h4>
                    <p className="text-sm text-gray-500 truncate">
                      {cancionActual.artista}
                    </p>
                  </div>
                </div>

                {/* Controles centrales */}
                <div className="flex flex-col items-center space-y-2 flex-2 max-w-2xl">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={reproducirAnterior}
                      className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      ⏮️
                    </button>
                    
                    <button
                      onClick={reproduciendose ? pausarReproduccion : reanudarReproduccion}
                      className="bg-gray-900 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
                    >
                      {reproduciendose ? (
                        <PauseIcon className="w-5 h-5" />
                      ) : (
                        <PlayIcon className="w-5 h-5 ml-0.5" />
                      )}
                    </button>
                    
                    <button
                      onClick={reproducirSiguiente}
                      className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      ⏭️
                    </button>
                  </div>
                  
                  {/* Barra de progreso */}
                  <div className="flex items-center space-x-2 w-full">
                    <span className="text-xs text-gray-500">
                      {formatearTiempo(tiempoActual)}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max={duracionTotal || 0}
                      value={tiempoActual}
                      onChange={(e) => cambiarTiempo(Number(e.target.value))}
                      className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-gray-500">
                      {formatearTiempo(duracionTotal)}
                    </span>
                  </div>
                </div>

                {/* Control de volumen */}
                <div className="flex items-center space-x-2 flex-1 justify-end">
                  <span className="text-sm text-gray-500">🔊</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volumen}
                    onChange={(e) => cambiarVolumen(Number(e.target.value))}
                    className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
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
                  onClick={async () => {
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
                    } catch (error) {
                      console.error('Error actualizando playlist:', error);
                      setMensaje('Error al actualizar la playlist');
                      setTimeout(() => setMensaje(''), 3000);
                    }
                  }}
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
    </DashboardLayout>
  );
}