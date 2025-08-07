'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useSupabase } from '@/components/SupabaseProvider';
import Image from 'next/image';
import { 
  PlayIcon,
  PauseIcon,
  HeartIcon,
  TrashIcon,
  ClockIcon,
  UserIcon,
  MusicalNoteIcon,
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
}

export default function PlaylistDetallePage() {
  console.log('🎯 PlaylistDetallePage iniciado');
  
  const params = useParams();
  const router = useRouter();
  const { supabase } = useSupabase();
  
  const [playlist, setPlaylist] = useState<PlaylistDetalle | null>(null);
  const [canciones, setCanciones] = useState<Cancion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cancionReproduciendo, setCancionReproduciendo] = useState<string | null>(null);
  const [audioActual, setAudioActual] = useState<HTMLAudioElement | null>(null);
  const [user, setUser] = useState<any>(null);
  const [favoritosUsuario, setFavoritosUsuario] = useState<Set<string>>(new Set());
  const [mensaje, setMensaje] = useState<string>('');
  
  // Estados para funcionalidades del menú
  const [menuAbiertoCancionId, setMenuAbiertoCancionId] = useState<string | null>(null);
  const [menuAbiertoPlaylist, setMenuAbiertoPlaylist] = useState(false);
  const [mostrarModalEditarPlaylist, setMostrarModalEditarPlaylist] = useState(false);
  const [mostrarModalEliminarPlaylist, setMostrarModalEliminarPlaylist] = useState(false);
  const [mostrarModalAgregarCancion, setMostrarModalAgregarCancion] = useState(false);
  const [nombrePlaylist, setNombrePlaylist] = useState('');
  const [descripcionPlaylist, setDescripcionPlaylist] = useState('');
  const [esPublica, setEsPublica] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState<any[]>([]);
  const [cancionSeleccionada, setCancionSeleccionada] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    const inicializar = async () => {
      try {
        // Obtener usuario actual
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          // Cargar favoritos del usuario
          await cargarFavoritos(user.id);
        }
        
        // Cargar detalles de la playlist
        await cargarPlaylist();
        
      } catch (error) {
        console.error('Error inicializando:', error);
      } finally {
        setCargando(false);
      }
    };
    
    inicializar();
  }, [params.id]);

  /**
   * Cargar favoritos del usuario
   */
  const cargarFavoritos = async (userId: string) => {
    try {
      const { data: favoritos, error } = await supabase
        .from('favoritos')
        .select('cancion_id')
        .eq('usuario_id', userId);

      if (error) {
        console.error('Error cargando favoritos:', error);
      } else {
        const favoritosSet = new Set(favoritos?.map(f => f.cancion_id) || []);
        setFavoritosUsuario(favoritosSet);
      }
    } catch (error) {
      console.error('Error en cargarFavoritos:', error);
    }
  };

  /**
   * Cargar detalles de la playlist y sus canciones
   */
  const cargarPlaylist = useCallback(async () => {
    if (!params.id) return;

    try {
      // Cargar información básica de la playlist
      const { data: playlistData, error: playlistError } = await supabase
        .from('playlists')
        .select('*')
        .eq('id', params.id)
        .single();

      if (playlistError) {
        console.error('Error cargando playlist:', playlistError);
        setMensaje('Error al cargar la playlist');
        return;
      }

      if (!playlistData) {
        setMensaje('Playlist no encontrada');
        return;
      }

      setPlaylist(playlistData);

      // Cargar canciones de la playlist
      const { data: cancionesData, error: cancionesError } = await supabase
        .from('playlist_canciones')
        .select(`
          id,
          posicion,
          fecha_agregada,
          canciones!inner (
            id,
            titulo,
            duracion,
            genero,
            año,
            archivo_audio_url,
            imagen_url,
            reproducciones,
            usuario_subida_id
          )
        `)
        .eq('playlist_id', params.id)
        .order('posicion', { ascending: true });

      if (cancionesError) {
        console.error('Error cargando canciones:', cancionesError);
        setMensaje('Error al cargar las canciones');
        return;
      }

      // Procesar y formatear las canciones
      const cancionesFormateadas = await Promise.all(
        (cancionesData || []).map(async (item: any) => {
          const cancion = item.canciones;
          
          // Obtener información del artista
          let nombreArtista = 'Artista Desconocido';
          try {
            const { data: usuarioData } = await supabase
              .from('usuarios')
              .select('nombre')
              .eq('id', cancion.usuario_subida_id)
              .single();
            
            if (usuarioData?.nombre) {
              nombreArtista = usuarioData.nombre;
            }
          } catch (artistaError) {
            console.warn('Error obteniendo artista:', artistaError);
          }

          // Formatear duración
          const formatearDuracion = (segundos: number) => {
            if (!segundos) return '0:00';
            const mins = Math.floor(segundos / 60);
            const secs = segundos % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
          };

          // Generar URL de audio desde Supabase Storage si es necesario
          let urlAudio = cancion.archivo_audio_url;
          if (urlAudio && !urlAudio.startsWith('http')) {
            try {
              const { data: urlData } = await supabase.storage
                .from('music')
                .createSignedUrl(urlAudio, 3600);
              
              if (urlData?.signedUrl) {
                urlAudio = urlData.signedUrl;
              }
            } catch (storageError) {
              console.warn('Error generando URL de audio:', storageError);
            }
          }

          return {
            id: cancion.id,
            titulo: cancion.titulo,
            artista: nombreArtista,
            album: 'Sin álbum', // Por ahora
            duracion: formatearDuracion(cancion.duracion),
            genero: cancion.genero || 'Sin género',
            año: cancion.año || new Date().getFullYear(),
            archivo_audio_url: urlAudio,
            imagen_url: cancion.imagen_url,
            es_favorito: false, // Se actualizará después
            reproducciones: cancion.reproducciones || 0,
            posicion: item.posicion,
            fecha_agregada: item.fecha_agregada,
            usuario_subida_id: cancion.usuario_subida_id
          };
        })
      );

      setCanciones(cancionesFormateadas);

    } catch (error) {
      console.error('Error en cargarPlaylist:', error);
      setMensaje('Error al cargar la playlist');
    }
  }, [params.id, supabase]);

  // Actualizar estado de favoritos en las canciones
  useEffect(() => {
    setCanciones(prev => prev.map(cancion => ({
      ...cancion,
      es_favorito: favoritosUsuario.has(cancion.id)
    })));
  }, [favoritosUsuario]);

  /**
   * Reproducir/pausar una canción
   */
  const toggleReproduccion = async (cancion: Cancion) => {
    try {
      // Si hay un audio reproduciéndose, pausarlo
      if (audioActual) {
        audioActual.pause();
        audioActual.currentTime = 0;
      }

      // Si es la misma canción, solo pausar
      if (cancionReproduciendo === cancion.id) {
        setCancionReproduciendo(null);
        setAudioActual(null);
        return;
      }

      // Verificar que la canción tenga URL de audio
      if (!cancion.archivo_audio_url) {
        setMensaje('La canción no tiene archivo de audio disponible');
        setTimeout(() => setMensaje(''), 3000);
        return;
      }

      console.log('🎵 Reproduciendo:', cancion.titulo);

      // Crear nuevo elemento de audio
      const nuevoAudio = new Audio(cancion.archivo_audio_url);
      
      nuevoAudio.addEventListener('loadstart', () => {
        console.log('🔄 Cargando audio...');
      });

      nuevoAudio.addEventListener('canplay', () => {
        console.log('✅ Audio listo para reproducir');
      });

      nuevoAudio.addEventListener('error', (e) => {
        console.error('❌ Error reproduciendo audio:', e);
        setMensaje('Error al reproducir la canción');
        setTimeout(() => setMensaje(''), 3000);
        setCancionReproduciendo(null);
        setAudioActual(null);
      });

      nuevoAudio.addEventListener('ended', () => {
        setCancionReproduciendo(null);
        setAudioActual(null);
      });

      // Configurar volumen
      nuevoAudio.volume = 0.7;

      // Intentar reproducir
      try {
        await nuevoAudio.play();
        setCancionReproduciendo(cancion.id);
        setAudioActual(nuevoAudio);
        
        // Incrementar reproducciones
        await incrementarReproducciones(cancion.id);
        
      } catch (playError) {
        console.error('Error al iniciar reproducción:', playError);
        setMensaje('Error al reproducir la canción');
        setTimeout(() => setMensaje(''), 3000);
      }

    } catch (error) {
      console.error('Error en toggleReproduccion:', error);
    }
  };

  /**
   * Incrementar contador de reproducciones
   */
  const incrementarReproducciones = async (cancionId: string) => {
    try {
      const { data: cancionActual } = await supabase
        .from('canciones')
        .select('reproducciones')
        .eq('id', cancionId)
        .single();

      if (cancionActual) {
        await supabase
          .from('canciones')
          .update({ reproducciones: (cancionActual.reproducciones || 0) + 1 })
          .eq('id', cancionId);
      }
    } catch (error) {
      console.error('Error incrementando reproducciones:', error);
    }
  };

  /**
   * Toggle favorito de una canción
   */
  const toggleFavorito = async (cancionId: string) => {
    if (!user) {
      setMensaje('Necesitas iniciar sesión para agregar favoritos');
      setTimeout(() => setMensaje(''), 3000);
      return;
    }

    try {
      const esFavorito = favoritosUsuario.has(cancionId);
      
      if (esFavorito) {
        // Remover de favoritos
        const { error } = await supabase
          .from('favoritos')
          .delete()
          .eq('usuario_id', user.id)
          .eq('cancion_id', cancionId);

        if (error) {
          console.error('Error removiendo favorito:', error);
          return;
        }

        const nuevosGustos = new Set(favoritosUsuario);
        nuevosGustos.delete(cancionId);
        setFavoritosUsuario(nuevosGustos);
        
        setMensaje('Removido de favoritos');
      } else {
        // Agregar a favoritos
        const { error } = await supabase
          .from('favoritos')
          .insert({
            usuario_id: user.id,
            cancion_id: cancionId
          });

        if (error) {
          console.error('Error agregando favorito:', error);
          return;
        }

        const nuevosGustos = new Set(favoritosUsuario);
        nuevosGustos.add(cancionId);
        setFavoritosUsuario(nuevosGustos);
        
        setMensaje('Agregado a favoritos');
      }
      
      setTimeout(() => setMensaje(''), 3000);
      
    } catch (error) {
      console.error('Error en toggleFavorito:', error);
    }
  };

  /**
   * Remover canción de la playlist
   */
  const removerCancionDePlaylist = async (cancionId: string) => {
    if (!user || !playlist) return;

    try {
      // Verificar que el usuario sea el dueño de la playlist
      if (playlist.usuario_id !== user.id) {
        setMensaje('No tienes permisos para modificar esta playlist');
        setTimeout(() => setMensaje(''), 3000);
        return;
      }

      // Remover canción de la playlist
      const { error } = await supabase
        .from('playlist_canciones')
        .delete()
        .eq('playlist_id', playlist.id)
        .eq('cancion_id', cancionId);

      if (error) {
        console.error('Error removiendo canción:', error);
        setMensaje('Error al remover la canción');
        return;
      }

      // Actualizar contador en la playlist
      const nuevoNumero = playlist.numero_canciones - 1;
      await supabase
        .from('playlists')
        .update({ 
          numero_canciones: nuevoNumero,
          updated_at: new Date().toISOString()
        })
        .eq('id', playlist.id);

      // Actualizar estado local
      setCanciones(prev => prev.filter(c => c.id !== cancionId));
      setPlaylist(prev => prev ? { ...prev, numero_canciones: nuevoNumero } : null);
      
      setMensaje('Canción removida de la playlist');
      setTimeout(() => setMensaje(''), 3000);

    } catch (error) {
      console.error('Error en removerCancionDePlaylist:', error);
    }
  };

  /**
   * Reproducir toda la playlist
   */
  const reproducirPlaylist = () => {
    if (canciones.length > 0) {
      toggleReproduccion(canciones[0]);
    }
  };

  /**
   * Formatear duración total
   */
  const formatearDuracionTotal = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    
    if (horas > 0) {
      return `${horas}h ${minutos}m`;
    }
    return `${minutos}m`;
  };

  // ===== FUNCIONES DEL MENÚ DE OPCIONES =====

  /**
   * Cargar playlists del usuario para agregar canciones
   */
  const cargarPlaylistsUsuario = async () => {
    if (!user) return;

    try {
      const { data: playlists, error } = await supabase
        .from('playlists')
        .select('id, nombre, numero_canciones')
        .eq('usuario_id', user.id)
        .neq('id', params.id) // Excluir la playlist actual
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando playlists:', error);
        return;
      }

      setUserPlaylists(playlists || []);
    } catch (error) {
      console.error('Error en cargarPlaylistsUsuario:', error);
    }
  };

  /**
   * Toggle menú de opciones de canción
   */
  const toggleMenuCancion = (cancionId: string) => {
    console.log('🎵 toggleMenuCancion ejecutado para canción:', cancionId, 'estado actual:', menuAbiertoCancionId);
    setMenuAbiertoCancionId(menuAbiertoCancionId === cancionId ? null : cancionId);
  };

  /**
   * Toggle menú de opciones de playlist
   */
  const toggleMenuPlaylist = () => {
    console.log('🔄 toggleMenuPlaylist ejecutado, estado actual:', menuAbiertoPlaylist);
    setMenuAbiertoPlaylist(!menuAbiertoPlaylist);
  };

  /**
   * Editar playlist
   */
  const editarPlaylist = () => {
    if (!playlist) return;
    
    setNombrePlaylist(playlist.nombre);
    setDescripcionPlaylist(playlist.descripcion || '');
    setEsPublica(playlist.es_publica);
    setMostrarModalEditarPlaylist(true);
    setMenuAbiertoPlaylist(false);
  };

  /**
   * Guardar edición de playlist
   */
  const guardarEdicionPlaylist = async () => {
    if (!nombrePlaylist.trim() || !playlist || !user) return;

    // Verificar permisos
    if (playlist.usuario_id !== user.id) {
      setMensaje('No tienes permisos para editar esta playlist');
      setTimeout(() => setMensaje(''), 3000);
      return;
    }

    try {
      const { error } = await supabase
        .from('playlists')
        .update({
          nombre: nombrePlaylist.trim(),
          descripcion: descripcionPlaylist.trim() || null,
          es_publica: esPublica
        })
        .eq('id', playlist.id);

      if (error) throw error;

      // Actualizar estado local
      setPlaylist(prev => prev ? {
        ...prev,
        nombre: nombrePlaylist.trim(),
        descripcion: descripcionPlaylist.trim() || undefined,
        es_publica: esPublica
      } : null);

      setMostrarModalEditarPlaylist(false);
      setMensaje('Playlist actualizada exitosamente');
      setTimeout(() => setMensaje(''), 3000);
    } catch (error: any) {
      console.error('Error actualizando playlist:', error);
      setMensaje('Error al actualizar la playlist');
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  /**
   * Confirmar eliminación de playlist
   */
  const confirmarEliminarPlaylist = () => {
    setMostrarModalEliminarPlaylist(true);
    setMenuAbiertoPlaylist(false);
  };

  /**
   * Eliminar playlist
   */
  const eliminarPlaylist = async () => {
    if (!playlist || !user) return;

    // Verificar permisos
    if (playlist.usuario_id !== user.id) {
      setMensaje('No tienes permisos para eliminar esta playlist');
      setTimeout(() => setMensaje(''), 3000);
      return;
    }

    try {
      // Eliminar canciones de la playlist
      await supabase
        .from('playlist_canciones')
        .delete()
        .eq('playlist_id', playlist.id);

      // Eliminar la playlist
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlist.id);

      if (error) throw error;

      setMensaje('Playlist eliminada exitosamente');
      setTimeout(() => {
        router.push('/usuario/biblioteca');
      }, 1500);
    } catch (error: any) {
      console.error('Error eliminando playlist:', error);
      setMensaje('Error al eliminar la playlist');
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  /**
   * Toggle privacidad de playlist
   */
  const togglePrivacidadPlaylist = async () => {
    if (!playlist || !user) return;

    // Verificar permisos
    if (playlist.usuario_id !== user.id) {
      setMensaje('No tienes permisos para cambiar la privacidad');
      setTimeout(() => setMensaje(''), 3000);
      return;
    }

    try {
      const nuevaPrivacidad = !playlist.es_publica;
      
      const { error } = await supabase
        .from('playlists')
        .update({ es_publica: nuevaPrivacidad })
        .eq('id', playlist.id);

      if (error) throw error;

      // Actualizar estado local
      setPlaylist(prev => prev ? { ...prev, es_publica: nuevaPrivacidad } : null);
      setMenuAbiertoPlaylist(false);
      
      setMensaje(`Playlist ${nuevaPrivacidad ? 'pública' : 'privada'} exitosamente`);
      setTimeout(() => setMensaje(''), 3000);
    } catch (error: any) {
      console.error('Error cambiando privacidad:', error);
      setMensaje('Error al cambiar la privacidad');
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  /**
   * Compartir playlist
   */
  const compartirPlaylist = async () => {
    if (!playlist) return;

    if (playlist.es_publica) {
      const url = `${window.location.origin}/usuario/playlist/${playlist.id}`;
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
    setMenuAbiertoPlaylist(false);
  };

  /**
   * Abrir modal para agregar canción a otra playlist
   */
  const abrirModalAgregarCancion = async (cancionId: string) => {
    setCancionSeleccionada(cancionId);
    await cargarPlaylistsUsuario();
    setMostrarModalAgregarCancion(true);
    setMenuAbiertoCancionId(null);
  };

  /**
   * Agregar canción a otra playlist
   */
  const agregarCancionAOtraPlaylist = async (playlistId: string) => {
    if (!cancionSeleccionada || !user) return;

    try {
      // Verificar si la canción ya está en la playlist
      const { data: existeCancion } = await supabase
        .from('playlist_canciones')
        .select('id')
        .eq('playlist_id', playlistId)
        .eq('cancion_id', cancionSeleccionada)
        .single();

      if (existeCancion) {
        setMensaje('La canción ya está en esa playlist');
        setTimeout(() => setMensaje(''), 3000);
        return;
      }

      // Obtener la siguiente posición
      const { data: posicionData } = await supabase
        .from('playlist_canciones')
        .select('posicion')
        .eq('playlist_id', playlistId)
        .order('posicion', { ascending: false })
        .limit(1);

      const nuevaPosicion = (posicionData?.[0]?.posicion || 0) + 1;

      // Agregar canción a la playlist
      const { error } = await supabase
        .from('playlist_canciones')
        .insert({
          playlist_id: playlistId,
          cancion_id: cancionSeleccionada,
          posicion: nuevaPosicion,
          agregada_por: user.id
        });

      if (error) throw error;

      // Actualizar contador de canciones
      const { data: playlistActual } = await supabase
        .from('playlists')
        .select('numero_canciones')
        .eq('id', playlistId)
        .single();

      const { error: updateError } = await supabase
        .from('playlists')
        .update({ 
          numero_canciones: (playlistActual?.numero_canciones || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', playlistId);

      if (updateError) console.warn('Error actualizando contador:', updateError);

      setMostrarModalAgregarCancion(false);
      setCancionSeleccionada(null);
      setMensaje('Canción agregada a la playlist');
      setTimeout(() => setMensaje(''), 3000);
    } catch (error: any) {
      console.error('Error agregando canción:', error);
      setMensaje('Error al agregar la canción');
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  // Limpiar audio al desmontar
  useEffect(() => {
    return () => {
      if (audioActual) {
        audioActual.pause();
        audioActual.currentTime = 0;
      }
    };
  }, [audioActual]);

  // Debug: Verificar cambios en estados del menú
  useEffect(() => {
    console.log('🔄 Estado menuAbiertoPlaylist cambió a:', menuAbiertoPlaylist);
  }, [menuAbiertoPlaylist]);

  useEffect(() => {
    console.log('🎵 Estado menuAbiertoCancionId cambió a:', menuAbiertoCancionId);
  }, [menuAbiertoCancionId]);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuAbiertoCancionId && !(event.target as Element).closest('.menu-dropdown-cancion')) {
        setMenuAbiertoCancionId(null);
      }
      if (menuAbiertoPlaylist && !(event.target as Element).closest('.menu-dropdown-playlist')) {
        setMenuAbiertoPlaylist(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuAbiertoCancionId, menuAbiertoPlaylist]);

  if (cargando) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!playlist) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <MusicalNoteIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">Playlist no encontrada</h2>
          <p className="text-gray-500 mb-6">La playlist que buscas no existe o no tienes acceso a ella</p>
          <button
            onClick={() => router.back()}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Volver
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header de la playlist */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-lg p-8 text-white">
          <div className="flex items-start space-x-6">
            {/* Imagen de la playlist */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
                {playlist.imagen_url ? (
                  <Image 
                    src={playlist.imagen_url} 
                    alt={playlist.nombre}
                    width={128}
                    height={128}
                    className="w-32 h-32 rounded-lg object-cover"
                  />
                ) : (
                  <MusicalNoteIcon className="w-16 h-16 text-white opacity-70" />
                )}
              </div>
            </div>

            {/* Información de la playlist */}
            <div className="flex-1">
              <button
                onClick={() => router.back()}
                className="flex items-center text-white opacity-80 hover:opacity-100 mb-4 transition-opacity"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Volver
              </button>
              
              <p className="text-sm opacity-80 mb-2">PLAYLIST</p>
              <h1 className="text-4xl font-bold mb-4">{playlist.nombre}</h1>
              
              {playlist.descripcion && (
                <p className="text-lg opacity-90 mb-4">{playlist.descripcion}</p>
              )}
              
              <div className="flex items-center space-x-4 text-sm opacity-80">
                <span>{playlist.numero_canciones} canciones</span>
                {playlist.duracion_total > 0 && (
                  <>
                    <span>•</span>
                    <span>{formatearDuracionTotal(playlist.duracion_total)}</span>
                  </>
                )}
                <span>•</span>
                <span>{playlist.es_publica ? 'Pública' : 'Privada'}</span>
              </div>
            </div>
          </div>

          {/* Controles de la playlist */}
          <div className="flex items-center space-x-4 mt-8">
            <button
              onClick={reproducirPlaylist}
              disabled={canciones.length === 0}
              className="bg-green-500 text-white p-4 rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PlayIcon className="w-6 h-6" />
            </button>
            
            <button className="text-white opacity-80 hover:opacity-100 transition-opacity">
              <HeartIcon className="w-8 h-8" />
            </button>
            
            {/* Menú de opciones de playlist */}
            <div className="relative">
              <button 
                onClick={toggleMenuPlaylist}
                className="text-white opacity-80 hover:opacity-100 transition-opacity"
              >
                <EllipsisVerticalIcon className="w-8 h-8" />
              </button>
              
              {/* Dropdown del menú de playlist */}
              {menuAbiertoPlaylist && user && playlist.usuario_id === user.id && (
                <div className="menu-dropdown-playlist absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <button
                    onClick={editarPlaylist}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <PencilIcon className="w-4 h-4 mr-3" />
                    Editar información
                  </button>
                  <button
                    onClick={togglePrivacidadPlaylist}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    {playlist.es_publica ? (
                      <>
                        <EyeSlashIcon className="w-4 h-4 mr-3" />
                        Hacer privada
                      </>
                    ) : (
                      <>
                        <EyeIcon className="w-4 h-4 mr-3" />
                        Hacer pública
                      </>
                    )}
                  </button>
                  <button
                    onClick={compartirPlaylist}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    disabled={!playlist.es_publica}
                  >
                    <ShareIcon className="w-4 h-4 mr-3" />
                    Compartir
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={confirmarEliminarPlaylist}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <TrashIcon className="w-4 h-4 mr-3" />
                    Eliminar playlist
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lista de canciones */}
        <div className="bg-white rounded-lg shadow">
          {canciones.length === 0 ? (
            <div className="text-center py-12">
              <MusicalNoteIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Playlist vacía</h3>
              <p className="text-gray-500 mb-6">Esta playlist no tiene canciones aún</p>
              <button
                onClick={() => router.push('/usuario/buscar')}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Buscar Música
              </button>
            </div>
          ) : (
            <div className="overflow-hidden">
              {/* Header de la tabla */}
              <div className="px-6 py-4 border-b border-gray-200 text-sm text-gray-600">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-1">#</div>
                  <div className="col-span-5">TÍTULO</div>
                  <div className="col-span-2">GÉNERO</div>
                  <div className="col-span-2">DURACIÓN</div>
                  <div className="col-span-2">ACCIONES</div>
                </div>
              </div>

              {/* Lista de canciones */}
              <div className="divide-y divide-gray-200">
                {canciones.map((cancion, index) => (
                  <div key={cancion.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Posición */}
                      <div className="col-span-1">
                        <span className="text-gray-500 text-sm">{cancion.posicion}</span>
                      </div>

                      {/* Información de la canción */}
                      <div className="col-span-5">
                        <div className="flex items-center space-x-3">
                          {/* Imagen/Play Button */}
                          <div className="relative w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded flex items-center justify-center group cursor-pointer">
                            {cancion.imagen_url ? (
                              <Image 
                                src={cancion.imagen_url} 
                                alt={cancion.titulo}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded object-cover"
                              />
                            ) : (
                              <MusicalNoteIcon className="w-6 h-6 text-white" />
                            )}
                            
                            {/* Overlay de play */}
                            <div 
                              className="absolute inset-0 bg-black bg-opacity-50 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => toggleReproduccion(cancion)}
                            >
                              {cancionReproduciendo === cancion.id ? (
                                <PauseIcon className="w-5 h-5 text-white" />
                              ) : (
                                <PlayIcon className="w-5 h-5 text-white" />
                              )}
                            </div>
                          </div>

                          {/* Título y artista */}
                          <div>
                            <h4 className="font-medium text-gray-900">{cancion.titulo}</h4>
                            <p className="text-sm text-gray-500">{cancion.artista}</p>
                          </div>
                        </div>
                      </div>

                      {/* Género */}
                      <div className="col-span-2">
                        <span className="text-sm text-gray-600">{cancion.genero}</span>
                      </div>

                      {/* Duración */}
                      <div className="col-span-2">
                        <span className="text-sm text-gray-600">{cancion.duracion}</span>
                      </div>

                      {/* Acciones */}
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          {/* Favorito */}
                          <button
                            onClick={() => toggleFavorito(cancion.id)}
                            className={`p-2 rounded-full transition-colors ${
                              cancion.es_favorito
                                ? 'text-red-600 hover:text-red-700'
                                : 'text-gray-400 hover:text-red-600'
                            }`}
                          >
                            {cancion.es_favorito ? (
                              <HeartIconSolid className="w-4 h-4" />
                            ) : (
                              <HeartIcon className="w-4 h-4" />
                            )}
                          </button>

                          {/* Menú de opciones de canción */}
                          <div className="relative">
                            <button
                              onClick={() => toggleMenuCancion(cancion.id)}
                              className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
                            >
                              <EllipsisVerticalIcon className="w-4 h-4" />
                            </button>
                            
                            {/* Dropdown del menú de canción */}
                            {menuAbiertoCancionId === cancion.id && (
                              <div className="menu-dropdown-cancion absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                <button
                                  onClick={() => abrirModalAgregarCancion(cancion.id)}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                >
                                  <PlusIcon className="w-4 h-4 mr-3" />
                                  Agregar a playlist
                                </button>
                                {user && playlist.usuario_id === user.id && (
                                  <button
                                    onClick={() => {
                                      removerCancionDePlaylist(cancion.id);
                                      setMenuAbiertoCancionId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                                  >
                                    <TrashIcon className="w-4 h-4 mr-3" />
                                    Remover de playlist
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
      {mostrarModalEditarPlaylist && (
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
                    placeholder="Nombre de la playlist"
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
                  onClick={() => {
                    setMostrarModalEditarPlaylist(false);
                    setNombrePlaylist('');
                    setDescripcionPlaylist('');
                    setEsPublica(false);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarEdicionPlaylist}
                  disabled={!nombrePlaylist.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para confirmar eliminación de playlist */}
      {mostrarModalEliminarPlaylist && (
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
                ¿Estás seguro de que quieres eliminar la playlist &quot;{playlist?.nombre}&quot;? 
                Se eliminarán todas las canciones de la playlist.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setMostrarModalEliminarPlaylist(false)}
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

      {/* Modal para agregar canción a otra playlist */}
      {mostrarModalAgregarCancion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Agregar a Playlist
              </h3>
              
              {userPlaylists.length === 0 ? (
                <div className="text-center py-8">
                  <MusicalNoteIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No tienes otras playlists</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {userPlaylists.map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => agregarCancionAOtraPlaylist(playlist.id)}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{playlist.nombre}</p>
                          <p className="text-sm text-gray-500">{playlist.numero_canciones} canciones</p>
                        </div>
                        <PlusIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setMostrarModalAgregarCancion(false);
                    setCancionSeleccionada(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
