'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/SupabaseProvider';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  MusicalNoteIcon,
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  HeartIcon,
  ShareIcon,
  QueueListIcon,
  ArrowPathIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

/**
 * Interfaces para tipado de datos
 */
interface Cancion {
  id: string;
  titulo: string;
  duracion: number;
  genero: string;
  año: number;
  archivo_audio_url: string;
  imagen_url?: string;
  letra?: string;
  reproducciones: number;
  es_publica: boolean;
  estado: 'activa' | 'inactiva' | 'borrador';
  created_at: string;
  album_id?: string;
  numero_pista?: number;
  favoritos: number;
  descargas: number;
  usuario_subida_id: string;
  // Campos adicionales para compatibilidad
  artista?: string;
  album?: string;
  es_favorita?: boolean;
  fecha_lanzamiento?: string;
}

interface Playlist {
  id: string;
  nombre: string;
  descripcion?: string;
  canciones: Cancion[];
  imagen_url?: string;
}

type ModoRepetir = 'off' | 'one' | 'all';

/**
 * Página del Reproductor Musical - Interfaz completa de reproducción
 * 
 * Características principales:
 * - Reproductor de audio completo con controles avanzados
 * - Lista de reproducción actual
 * - Información detallada de la canción
 * - Controles de favoritos y compartir
 * - Visualizador de ecualizador (simulado)
 * - Historial de reproducción
 * - Modo aleatorio y repetición
 */
export default function ReproductorPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  
  // Usar el contexto global del reproductor
  const { 
    playSong, 
    currentSong, 
    isPlaying, 
    playlist, 
    pauseSong, 
    resumeSong, 
    nextSong, 
    previousSong,
    volume,
    setVolume
  } = useMusicPlayer();

  // Estados principales
  const [playlistsUsuario, setPlaylistsUsuario] = useState<any[]>([]);
  const [playlistActual, setPlaylistActual] = useState<any | null>(null);
  const [cancionesPlaylist, setCancionesPlaylist] = useState<Cancion[]>([]);
  const [modoAleatorio, setModoAleatorio] = useState(false);
  const [modoRepetir, setModoRepetir] = useState<ModoRepetir>('off');
  const [mostrarPlaylist, setMostrarPlaylist] = useState(true);
  const [mostrarSoloFavoritas, setMostrarSoloFavoritas] = useState(false);
  const [usuario, setUsuario] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [cancionesFavoritas, setCancionesFavoritas] = useState<Set<string>>(new Set());
  const [mensajeFavorito, setMensajeFavorito] = useState<string>('');

  // Estados para visualizador
  const [barrasEcualizador, setBarrasEcualizador] = useState<Array<{ id: string; altura: number }>>([]);

  useEffect(() => {
    verificarUsuarioYCargarDatos();
    generarVisualizador();
    
    // Ejecutar diagnóstico en desarrollo
    if (process.env.NODE_ENV === 'development') {
      setTimeout(diagnosticarStorage, 2000);
    }
  }, []);

  // Generar barras del ecualizador animadas
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setBarrasEcualizador(
          Array.from({ length: 20 }, (_, index) => ({
            id: `barra-${index}`,
            altura: Math.random() * 100
          }))
        );
      }, 150);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  /**
   * Función para diagnosticar problemas de Supabase Storage
   */
  const diagnosticarStorage = async () => {
    try {
      console.log('🔍 Iniciando diagnóstico de Supabase Storage...');
      
      // Verificar conexión a Supabase
      const { data: { user } } = await supabase.auth.getUser();
      console.log('✅ Usuario autenticado:', user?.email);
      
      // Listar archivos en el bucket music (no audio-files)
      const { data: files, error: listError } = await supabase.storage
        .from('music')
        .list('', { limit: 10 });
      
      if (listError) {
        console.error('❌ Error listando archivos:', listError);
        return;
      }
      
      console.log('📁 Archivos en storage:', files);
      
      // Probar generar URL pública para el primer archivo
      if (files && files.length > 0) {
        const firstFile = files[0];
        
        // Probar URL pública
        const { data: urlData } = supabase.storage
          .from('music')
          .getPublicUrl(firstFile.name);
        
        console.log('🔗 URL pública de prueba:', urlData.publicUrl);
        
        // Verificar accesibilidad de URL pública
        try {
          const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
          console.log('✅ Estado de respuesta URL pública:', response.status, response.statusText);
        } catch (fetchError) {
          console.error('❌ Error accediendo a URL pública:', fetchError);
          
          // Si falla la URL pública, probar URL firmada
          try {
            const { data: signedData, error: signedError } = await supabase.storage
              .from('music')
              .createSignedUrl(firstFile.name, 3600);
            
            if (signedData?.signedUrl && !signedError) {
              console.log('🔗 URL firmada de prueba:', signedData.signedUrl);
              
              const signedResponse = await fetch(signedData.signedUrl, { method: 'HEAD' });
              console.log('✅ Estado de respuesta URL firmada:', signedResponse.status, signedResponse.statusText);
            } else {
              console.error('❌ Error generando URL firmada:', signedError);
            }
          } catch (signedFetchError) {
            console.error('❌ Error accediendo a URL firmada:', signedFetchError);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error en diagnóstico:', error);
    }
  };

  /**
   * Verificar usuario autenticado y cargar datos musicales
   */
  const verificarUsuarioYCargarDatos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login?redirectTo=/dashboard/reproductor');
        return;
      }

      // Obtener datos del usuario
      const { data: userData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!userData) {
        router.push('/auth/login');
        return;
      }

      setUsuario(userData);
      
      // Cargar playlists del usuario después de establecer el usuario
      await cargarPlaylistsUsuario(userData);
      
      // Cargar favoritos del usuario
      await cargarFavoritos(userData.id);
      
    } catch (error) {
      console.error('Error verificando usuario:', error);
      router.push('/auth/login');
    } finally {
      setCargando(false);
    }
  };

  /**
   * Generar URL de audio desde Supabase Storage
   */
  const generarUrlAudio = async (cancion: any): Promise<string> => {
    let urlAudio = cancion.archivo_audio_url;
    
    console.log('Procesando canción:', cancion.titulo, 'URL original:', urlAudio);
    
    // Si la URL no es completa, generar URL pública desde Supabase Storage
    if (urlAudio && !urlAudio.startsWith('http')) {
      try {
        // Primero intentar URL pública
        const { data: urlData } = supabase.storage
          .from('music')
          .getPublicUrl(urlAudio);
        
        if (urlData?.publicUrl) {
          urlAudio = urlData.publicUrl;
          console.log('URL pública generada:', urlAudio);
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
            console.log('URL firmada generada:', urlAudio);
          } else {
            console.error('Error generando URL firmada:', signedError);
          }
        } catch (signedErrorCatch) {
          console.error('Error en URL firmada:', signedErrorCatch);
        }
      }
    }
    
    return urlAudio;
  };

  /**
   * Verificar accesibilidad de URL de audio
   */
  const verificarUrlAudio = async (url: string): Promise<void> => {
    if (url) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (!response.ok) {
          console.warn('URL no accesible:', url, 'Status:', response.status);
        } else {
          console.log('URL verificada como accesible:', url);
        }
      } catch (error) {
        console.warn('Error verificando URL:', url, error);
      }
    }
  };

  /**
   * Formatear datos de canción para la interfaz
   */
  const formatearCancionParaInterfaz = (cancion: any, usuarioData: any, urlAudio: string) => {
    return {
      ...cancion,
      archivo_audio_url: urlAudio,
      artista: usuarioData?.nombre || 'Artista Desconocido',
      album: cancion.album_id ? 'Álbum' : 'Sin álbum',
      es_favorita: false,
      fecha_lanzamiento: cancion.created_at
    };
  };
  /**
   * Cargar las playlists del usuario
   */
  const cargarPlaylistsUsuario = async (usuarioData: any) => {
    try {
      console.log('Cargando playlists del usuario:', usuarioData.id);

      // Cargar playlists normales del usuario con conteo de canciones
      const { data: playlistsData, error: playlistsError } = await supabase
        .from('playlists')
        .select(`
          *,
          playlist_canciones(count)
        `)
        .eq('usuario_id', usuarioData.id)
        .order('created_at', { ascending: false });

      if (playlistsError) {
        console.error('Error cargando playlists:', playlistsError);
        return;
      }

      // Crear playlist virtual de favoritos
      const { count: favoritosCount } = await supabase
        .from('favoritos')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', usuarioData.id);

      const playlistFavoritos = {
        id: 'favoritos-virtual',
        nombre: '❤️ Mis Favoritos',
        descripcion: 'Tus canciones favoritas',
        usuario_id: usuarioData.id,
        es_publica: false,
        created_at: new Date().toISOString(),
        canciones_count: favoritosCount || 0,
        es_favoritos: true
      };

      // Formatear playlists normales con conteo de canciones
      const playlistsFormateadas = (playlistsData || []).map(playlist => ({
        ...playlist,
        canciones_count: playlist.playlist_canciones?.[0]?.count || 0
      }));

      // Combinar playlists
      const todasLasPlaylists = [playlistFavoritos, ...playlistsFormateadas];
      setPlaylistsUsuario(todasLasPlaylists);

      // Si no hay playlist seleccionada, seleccionar la primera (favoritos)
      // Solo si el usuario está completamente cargado
      if (!playlistActual && todasLasPlaylists.length > 0 && usuarioData?.id) {
        setTimeout(() => {
          seleccionarPlaylist(todasLasPlaylists[0]);
        }, 100);
      }

      console.log('Playlists cargadas:', todasLasPlaylists);
    } catch (error) {
      console.error('Error cargando playlists:', error);
    }
  };

  /**
   * Cargar canciones de una playlist específica
   */
  const cargarCancionesDePlaylist = async (playlist: any) => {
    try {
      console.log('Cargando canciones de playlist:', playlist.nombre);

      if (!usuario) {
        console.warn('Usuario no está cargado aún');
        return;
      }

      let cancionesData: any[] = [];

      if (playlist.id === 'favoritos-virtual') {
        // Cargar canciones favoritas
        const { data: favoritos, error: favoritosError } = await supabase
          .from('favoritos')
          .select(`
            cancion_id,
            canciones:cancion_id (
              *,
              usuario_subida:usuarios!canciones_usuario_subida_id_fkey(
                id,
                nombre,
                email
              )
            )
          `)
          .eq('usuario_id', usuario.id)
          .order('fecha_agregada', { ascending: false });

        if (favoritosError) {
          console.error('Error cargando favoritos:', favoritosError);
          return;
        }

        cancionesData = favoritos?.map(fav => fav.canciones).filter(Boolean) || [];
      } else {
        // Cargar canciones de playlist normal
        const { data: playlistCanciones, error: playlistError } = await supabase
          .from('playlist_canciones')
          .select(`
            cancion_id,
            posicion,
            canciones:cancion_id (
              *,
              usuario_subida:usuarios!canciones_usuario_subida_id_fkey(
                id,
                nombre,
                email
              )
            )
          `)
          .eq('playlist_id', playlist.id)
          .order('posicion');

        if (playlistError) {
          console.error('Error cargando canciones de playlist:', playlistError);
          return;
        }

        cancionesData = playlistCanciones?.map(pc => pc.canciones).filter(Boolean) || [];
      }

      if (!cancionesData || cancionesData.length === 0) {
        console.log('No hay canciones en esta playlist');
        setCancionesPlaylist([]);
        return;
      }

      // Procesar canciones con URLs de audio
      const cancionesFormateadas = await Promise.all(
        cancionesData.map(async (cancion) => {
          const urlAudio = await generarUrlAudio(cancion);
          await verificarUrlAudio(urlAudio);
          
          const artistaData = cancion.usuario_subida || { nombre: 'Artista Desconocido' };
          
          return {
            ...cancion,
            archivo_audio_url: urlAudio,
            artista: artistaData.nombre || 'Artista Desconocido',
            album: cancion.album_id ? 'Álbum' : 'Sin álbum',
            es_favorita: false,
            fecha_lanzamiento: cancion.created_at
          };
        })
      );

      console.log('Canciones de playlist cargadas:', cancionesFormateadas.length);
      setCancionesPlaylist(cancionesFormateadas);
      
    } catch (error) {
      console.error('Error cargando canciones de playlist:', error);
      setCancionesPlaylist([]);
    }
  };

  /**
   * Seleccionar una playlist para reproducir
   */
  const seleccionarPlaylist = async (playlist: any) => {
    if (!usuario) {
      console.warn('Usuario no está cargado, no se puede seleccionar playlist');
      return;
    }

    setPlaylistActual(playlist);
    await cargarCancionesDePlaylist(playlist);
  };

  /**
   * Generar barras iniciales del ecualizador
   */
  const generarVisualizador = () => {
    const numeroBarras = 20;
    const barras = Array.from({ length: numeroBarras }, (_, index) => ({
      id: `barra-${index}`,
      altura: Math.random() * 60 + 10
    }));
    setBarrasEcualizador(barras);
  };

  /**
   * Seleccionar canción específica de la playlist
   */
  const seleccionarCancion = (cancion: Cancion) => {
    // Convertir al formato del contexto
    const cancionParaContexto = {
      id: cancion.id,
      titulo: cancion.titulo,
      artista: cancion.artista || 'Artista Desconocido',
      album: cancion.album,
      genero: cancion.genero,
      duracion: cancion.duracion,
      url_archivo: cancion.archivo_audio_url,
      usuario_id: cancion.usuario_subida_id
    };
    
    // Convertir toda la playlist actual
    const playlistParaContexto = cancionesPlaylist.map((c: any) => ({
      id: c.id,
      titulo: c.titulo,
      artista: c.artista || 'Artista Desconocido',
      album: c.album,
      genero: c.genero,
      duracion: c.duracion,
      url_archivo: c.archivo_audio_url,
      usuario_id: c.usuario_subida_id
    }));
    
    // Usar el contexto global para reproducir
    playSong(cancionParaContexto, playlistParaContexto);
  };

  /**
   * Obtener conteo actualizado de favoritos para una canción
   */
  const obtenerConteoFavoritos = async (cancionId: string): Promise<number> => {
    try {
      const { count } = await supabase
        .from('favoritos')
        .select('*', { count: 'exact', head: true })
        .eq('cancion_id', cancionId);

      return count || 0;
    } catch (error) {
      console.error('Error obteniendo conteo de favoritos:', error);
      return 0;
    }
  };

  /**
   * Cargar canciones favoritas del usuario
   */
  const cargarFavoritos = async (userId: string) => {
    try {
      const { data: favoritosData, error } = await supabase
        .from('favoritos')
        .select('cancion_id')
        .eq('usuario_id', userId);

      if (error) {
        console.error('Error cargando favoritos:', error);
        return;
      }

      const favoritosSet = new Set(favoritosData?.map(fav => fav.cancion_id) || []);
      setCancionesFavoritas(favoritosSet);
    } catch (error) {
      console.error('Error cargando favoritos:', error);
    }
  };

  /**
   * Toggle favorito de la canción actual
   */
  const toggleFavorito = async (cancionId?: string) => {
    if (!usuario) return;
    
    const idCancion = cancionId || currentSong?.id;
    if (!idCancion) return;

    const esFavorita = cancionesFavoritas.has(idCancion);

    try {
      if (esFavorita) {
        // Quitar de favoritos
        const { error } = await supabase
          .from('favoritos')
          .delete()
          .eq('usuario_id', usuario.id)
          .eq('cancion_id', idCancion);

        if (error) {
          console.error('Error quitando de favoritos:', error);
          return;
        }

        // Actualizar contador en la tabla canciones con el conteo real
        const conteoReal = await obtenerConteoFavoritos(idCancion);
        const { error: updateError } = await supabase
          .from('canciones')
          .update({ favoritos: conteoReal })
          .eq('id', idCancion);

        if (updateError) {
          console.error('Error actualizando contador de favoritos:', updateError);
        }

        // Actualizar estado local
        const nuevasFavoritas = new Set(cancionesFavoritas);
        nuevasFavoritas.delete(idCancion);
        setCancionesFavoritas(nuevasFavoritas);

        // Mostrar mensaje de feedback
        setMensajeFavorito('Canción quitada de favoritos');
        setTimeout(() => setMensajeFavorito(''), 3000);

        console.log('Canción quitada de favoritos');
      } else {
        // Agregar a favoritos
        const { error } = await supabase
          .from('favoritos')
          .insert({
            usuario_id: usuario.id,
            cancion_id: idCancion,
            fecha_agregada: new Date().toISOString()
          });

        if (error) {
          console.error('Error agregando a favoritos:', error);
          return;
        }

        // Actualizar contador en la tabla canciones con el conteo real
        const conteoReal = await obtenerConteoFavoritos(idCancion);
        const { error: updateError } = await supabase
          .from('canciones')
          .update({ favoritos: conteoReal })
          .eq('id', idCancion);

        if (updateError) {
          console.error('Error actualizando contador de favoritos:', updateError);
        }

        // Actualizar estado local
        const nuevasFavoritas = new Set(cancionesFavoritas);
        nuevasFavoritas.add(idCancion);
        setCancionesFavoritas(nuevasFavoritas);

        // Mostrar mensaje de feedback
        setMensajeFavorito('Canción agregada a favoritos');
        setTimeout(() => setMensajeFavorito(''), 3000);

        console.log('Canción agregada a favoritos');
      }
    } catch (error) {
      console.error('Error en toggle favorito:', error);
    }
  };

  const formatearDuracion = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  /**
   * Renderizar controles principales del reproductor
   */
  const renderControlesPrincipales = () => (
    <div className="flex justify-center space-x-4 mb-6">
      <button
        onClick={previousSong}
        disabled={!currentSong || playlist.length <= 1}
        className="p-3 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
        title="Canción anterior"
      >
        <BackwardIcon className="w-6 h-6" />
      </button>
      
      <button
        onClick={isPlaying ? pauseSong : resumeSong}
        disabled={!currentSong}
        className="p-4 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        title={isPlaying ? "Pausar" : "Reproducir"}
      >
        {isPlaying ? (
          <PauseIcon className="w-8 h-8" />
        ) : (
          <PlayIcon className="w-8 h-8" />
        )}
      </button>
      
      <button
        onClick={nextSong}
        disabled={!currentSong || playlist.length <= 1}
        className="p-3 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
        title="Siguiente canción"
      >
        <ForwardIcon className="w-6 h-6" />
      </button>
    </div>
  );

  /**
   * Renderizar modos de reproducción (aleatorio y repetir)
   */
  const renderModosReproduccion = () => (
    <div className="flex justify-center space-x-4 mb-6">
      <button
        onClick={() => setModoAleatorio(!modoAleatorio)}
        className={`p-2 rounded-lg transition-colors ${
          modoAleatorio 
            ? 'bg-purple-100 text-purple-700' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title="Modo aleatorio"
      >
        🔀
      </button>
      
      <button
        onClick={() => {
          const modos: ModoRepetir[] = ['off', 'one', 'all'];
          const indiceActual = modos.indexOf(modoRepetir);
          const siguienteModo = modos[(indiceActual + 1) % modos.length];
          setModoRepetir(siguienteModo);
        }}
        className={`p-2 rounded-lg transition-colors ${
          modoRepetir !== 'off' 
            ? 'bg-purple-100 text-purple-700' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title={getRepeatModeTitle(modoRepetir)}
      >
        <ArrowPathIcon className="w-5 h-5" />
        {modoRepetir === 'one' && <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-600 rounded-full text-xs text-white flex items-center justify-center">1</span>}
      </button>
    </div>
  );

  /**
   * Renderizar lista de canciones de la playlist
   */
  const renderPlaylistCanciones = () => {
    const cancionesFiltradas = mostrarSoloFavoritas 
      ? cancionesPlaylist.filter((cancion: any) => cancionesFavoritas.has(cancion.id))
      : cancionesPlaylist;
    
    if (cancionesFiltradas.length === 0) {
      return (
        <div className="p-8 text-center text-gray-500">
          <span className="text-4xl mb-2 block">
            {mostrarSoloFavoritas ? '💔' : '🎵'}
          </span>
          <p>
            {mostrarSoloFavoritas 
              ? 'No hay canciones favoritas en la selección' 
              : playlistActual?.nombre ? `No hay canciones en "${playlistActual.nombre}"` : 'Selecciona una playlist'
            }
          </p>
        </div>
      );
    }
    
    return cancionesFiltradas.map((cancion: any, indice: number) => {
      const isCurrentSong = currentSong?.id === cancion.id;
      return (
        <div
          key={cancion.id}
          className={`w-full p-4 border-b border-gray-100 transition-colors hover:bg-gray-50 ${
            isCurrentSong ? 'bg-purple-50 border-purple-200' : ''
          }`}
        >
          <div className="flex items-center space-x-3">
            {/* Botón de reproducción */}
            <button
              onClick={() => seleccionarCancion(cancion)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  seleccionarCancion(cancion);
                }
              }}
              className="flex items-center space-x-3 flex-1 text-left"
            >
              {/* Indicador de reproducción */}
              <div className="w-8 text-center">
                {renderPlaylistIndicator(cancion, isCurrentSong, indice)}
              </div>
              
              {/* Información de la canción */}
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${
                  isCurrentSong ? 'text-purple-700' : 'text-gray-900'
                }`}>
                  {cancion.titulo}
                </p>
                <p className="text-sm text-gray-600 truncate">
                  👤 {cancion.artista} • 🎵 {cancion.genero || 'Sin género'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  📊 {cancion.reproducciones || 0} reproducciones • ❤️ {cancion.favoritos || 0} favoritos
                </p>
              </div>
            </button>
            
            {/* Duración y favoritos */}
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorito(cancion.id);
                }}
                className={`p-1 rounded transition-colors ${
                  cancionesFavoritas.has(cancion.id)
                    ? 'text-red-600 hover:text-red-700'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title={cancionesFavoritas.has(cancion.id) ? "Quitar de favoritos" : "Agregar a favoritos"}
              >
                {cancionesFavoritas.has(cancion.id) ? (
                  <HeartIconSolid className="w-4 h-4" />
                ) : (
                  <HeartIcon className="w-4 h-4" />
                )}
              </button>
              <span className="text-sm text-gray-500">{formatearDuracion(cancion.duracion)}</span>
            </div>
          </div>
        </div>
      );
    });
  };
  const renderControlVolumen = () => (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Control de Volumen</h4>
      <div className="flex items-center space-x-3">
        <button 
          onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
          className="text-gray-600 hover:text-purple-600 transition-colors p-1"
          title={volume === 0 ? "Activar sonido" : "Silenciar"}
        >
          {volume === 0 ? (
            <SpeakerXMarkIcon className="w-5 h-5" />
          ) : (
            <SpeakerWaveIcon className="w-5 h-5" />
          )}
        </button>
        
        <div className="flex-1 relative">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => {
              const nuevoVolumen = parseFloat(e.target.value);
              setVolume(nuevoVolumen);
            }}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
            style={{
              background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${volume * 100}%, #e5e7eb ${volume * 100}%, #e5e7eb 100%)`
            }}
          />
        </div>
        
        <span className="text-sm text-gray-500 min-w-[3rem] font-medium">
          {Math.round(volume * 100)}%
        </span>
      </div>
      
      {/* Indicador visual del nivel de volumen */}
      {/* <div className="flex justify-center space-x-1">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className={`w-1 h-2 rounded-full transition-colors ${
              i < Math.floor(volume * 10) 
                ? volume > 0.7 ? 'bg-green-500' : volume > 0.3 ? 'bg-yellow-500' : 'bg-red-500'
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div> */}
    </div>
  );
  const getRepeatModeTitle = (modo: ModoRepetir) => {
    switch (modo) {
      case 'off': return 'Repetir: desactivado';
      case 'one': return 'Repetir: una canción';
      case 'all': return 'Repetir: todas';
      default: return 'Repetir';
    }
  };

  /**
   * Renderizar indicador de reproducción en playlist
   */
  const renderPlaylistIndicator = (cancion: Cancion, isCurrentSong: boolean, index: number) => {
    if (isCurrentSong) {
      return isPlaying ? (
        <div className="flex space-x-1 justify-center">
          <div className="w-1 h-4 bg-purple-600 animate-pulse"></div>
          <div className="w-1 h-4 bg-purple-600 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-1 h-4 bg-purple-600 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        </div>
      ) : (
        <PauseIcon className="w-4 h-4 text-purple-600 mx-auto" />
      );
    }
    return <span className="text-sm text-gray-400">{index + 1}</span>;
  };

  if (cargando) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Cargando reproductor...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Estilos para la barra de volumen personalizada */}
      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          box-shadow: 0 0 4px rgba(139, 92, 246, 0.3);
          transition: all 0.2s ease;
        }
        
        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 0 8px rgba(139, 92, 246, 0.5);
        }
        
        .slider-thumb::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 4px rgba(139, 92, 246, 0.3);
          transition: all 0.2s ease;
        }
        
        .slider-thumb::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 0 8px rgba(139, 92, 246, 0.5);
        }
      `}</style>
      
      {/* Notificación de favoritos */}
      {mensajeFavorito && (
        <div 
          className="fixed top-4 right-4 bg-purple-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 ease-in-out"
          style={{ 
            animation: 'slideInRight 0.3s ease-out',
          }}
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">💜</span>
            <span>{mensajeFavorito}</span>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header del Reproductor */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <MusicalNoteIcon className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Reproductor de Playlists</h1>
                <p className="text-purple-100 mt-1">
                  Reproduce tu música organizada en playlists
                </p>
              </div>
            </div>
            
            {/* Estadísticas rápidas */}
            <div className="hidden md:flex space-x-6 text-center">
              <div>
                <div className="text-2xl font-bold">{playlist.length}</div>
                <div className="text-sm text-purple-200">En cola</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{cancionesPlaylist.length}</div>
                <div className="text-sm text-purple-200">En playlist</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{playlistsUsuario.length}</div>
                <div className="text-sm text-purple-200">Playlists</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna Principal - Reproductor */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Selector de Playlist */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Reproducir Playlist</h3>
                <span className="text-sm text-gray-500">
                  {playlistActual ? `${cancionesPlaylist.length} canciones` : 'Ninguna seleccionada'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {playlistsUsuario.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => seleccionarPlaylist(playlist)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      playlistActual?.id === playlist.id
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                        {playlist.es_favoritos ? (
                          <HeartIconSolid className="w-5 h-5 text-white" />
                        ) : (
                          <MusicalNoteIcon className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{playlist.nombre}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {playlist.canciones_count || 0} canciones
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              {playlistsUsuario.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MusicalNoteIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No tienes playlists aún</p>
                  <p className="text-sm">Ve a la sección de Playlists para crear una</p>
                </div>
              )}
            </div>
            
            {/* Información de la Canción Actual */}
            {currentSong ? (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="md:flex">
                  
                  {/* Imagen del álbum */}
                  <div className="md:w-80 h-80 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center relative overflow-hidden">
                    <div className="text-center text-white">
                      <MusicalNoteIcon className="w-24 h-24 mx-auto mb-4 opacity-80" />
                      <p className="text-lg font-medium opacity-90">{currentSong.album || 'Sin álbum'}</p>
                    </div>
                    
                    {/* Overlay con info */}
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <div className="text-center text-white">
                        <MusicalNoteIcon className="w-16 h-16 mx-auto mb-2" />
                        <p className="text-sm">Controlado por reproductor global</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Información detallada */}
                  <div className="flex-1 p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                          {currentSong.titulo}
                        </h2>
                        <p className="text-xl text-gray-600 mb-1">{currentSong.artista}</p>
                        <p className="text-gray-500">{currentSong.album}</p>
                      </div>
                      
                      {/* Acciones rápidas - Simplificadas */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleFavorito()}
                          className={`p-3 rounded-full transition-colors ${
                            cancionesFavoritas.has(currentSong.id)
                              ? 'bg-red-100 text-red-600 hover:bg-red-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={cancionesFavoritas.has(currentSong.id) ? "Quitar de favoritos" : "Agregar a favoritos"}
                        >
                          {cancionesFavoritas.has(currentSong.id) ? (
                            <HeartIconSolid className="w-5 h-5" />
                          ) : (
                            <HeartIcon className="w-5 h-5" />
                          )}
                        </button>
                        
                        <button className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                          <ShareIcon className="w-5 h-5" />
                        </button>
                        
                        <button className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                          <EllipsisHorizontalIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Metadata de la canción */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Duración:</span>
                        <span className="ml-2 font-medium">{formatearDuracion(currentSong.duracion)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Género:</span>
                        <span className="ml-2 font-medium">{currentSong.genero || 'No especificado'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Artista:</span>
                        <span className="ml-2 font-medium">{currentSong.artista}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Estado:</span>
                        <span className="ml-2 font-medium">{isPlaying ? 'Reproduciendo' : 'Pausado'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Favorito:</span>
                        <span className="ml-2 font-medium">
                          {cancionesFavoritas.has(currentSong.id) ? (
                            <span className="text-red-600">❤️ Sí</span>
                          ) : (
                            <span className="text-gray-400">🤍 No</span>
                          )}
                        </span>
                      </div>
                    </div>
                    
                    {/* Tags de calidad */}
                    <div className="flex space-x-2 mt-6">
                      {usuario?.rol === 'premium' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800">
                          💎 Calidad HD
                        </span>
                      )}
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        🎵 {currentSong.genero}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <MusicalNoteIcon className="w-24 h-24 mx-auto text-gray-300 mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No hay canciones en la plataforma</h2>
                <p className="text-gray-600 mb-6">
                  Aún no hay canciones subidas por los artistas en la plataforma.
                </p>
                <button
                  onClick={() => router.push('/admin/biblioteca')}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  Ver biblioteca completa
                </button>
              </div>
            )}
            
            {/* Visualizador de Audio */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <SpeakerWaveIcon className="w-5 h-5 mr-2 text-purple-600" />
                Visualizador de Audio
              </h3>
              
              <div className="h-32 bg-gray-900 rounded-lg p-4 flex items-end justify-center space-x-1">
                {barrasEcualizador.map((barra) => (
                  <div
                    key={barra.id}
                    className="bg-gradient-to-t from-purple-500 to-pink-500 rounded-sm transition-all duration-150"
                    style={{
                      height: `${isPlaying ? barra.altura : 10}%`,
                      width: '4px'
                    }}
                  />
                ))}
              </div>
              
              <div className="mt-4 text-center text-sm text-gray-500">
                {isPlaying ? '🎵 Reproduciendo...' : '⏸️ En pausa'}
              </div>
            </div>
          </div>
          
          {/* Columna Lateral - Playlist y Controles */}
          <div className="space-y-6">
            
            {/* Panel de Control */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Controles</h3>
              
              {/* Controles principales */}
              {renderControlesPrincipales()}
              
              {/* Modos de reproducción */}
              {renderModosReproduccion()}
              
              {/* Control de volumen */}
              {renderControlVolumen()}
            </div>
            
            {/* Playlist Actual */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <QueueListIcon className="w-5 h-5 mr-2 text-purple-600" />
                  Cola de Reproducción
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setMostrarSoloFavoritas(!mostrarSoloFavoritas)}
                    className={`px-3 py-1 rounded-md text-xs transition-colors ${
                      mostrarSoloFavoritas
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={mostrarSoloFavoritas ? "Mostrar todas" : "Solo favoritas"}
                  >
                    {mostrarSoloFavoritas ? '❤️ Favoritas' : '🎵 Todas'}
                  </button>
                  <button
                    onClick={() => setMostrarPlaylist(!mostrarPlaylist)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {mostrarPlaylist ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>
              
              {mostrarPlaylist && (
                <div className="max-h-96 overflow-y-auto">
                  {renderPlaylistCanciones()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
