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
    previousSong 
  } = useMusicPlayer();

  // Estados principales
  const [canciones, setCanciones] = useState<Cancion[]>([]);
  const [volumen, setVolumen] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
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
      
      // Cargar canciones después de establecer el usuario
      await cargarCancionesUsuario(userData);
      
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
   * Cargar canciones reales del usuario desde la base de datos
   */
  const cargarCancionesUsuario = async (usuarioData: any) => {
    try {
      // Cargar canciones del artista desde la base de datos
      const { data: cancionesData, error } = await supabase
        .from('canciones')
        .select('*')
        .eq('usuario_subida_id', usuarioData.id)
        .eq('estado', 'activa')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando canciones:', error);
        return;
      }

      if (!cancionesData || cancionesData.length === 0) {
        console.log('No hay canciones disponibles');
        setCanciones([]);
        return;
      }

      // Procesar canciones con funciones auxiliares
      const cancionesFormateadas = await Promise.all(
        cancionesData.map(async (cancion) => {
          const urlAudio = await generarUrlAudio(cancion);
          await verificarUrlAudio(urlAudio);
          return formatearCancionParaInterfaz(cancion, usuarioData, urlAudio);
        })
      );

      console.log('Canciones cargadas:', cancionesFormateadas);
      setCanciones(cancionesFormateadas);
      
      // Nota: La configuración de playlist se hace mediante el contexto global
      // cuando se selecciona una canción específica para reproducir
    } catch (error) {
      console.error('Error cargando playlist:', error);
    }
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
    
    // Convertir toda la playlist
    const playlistParaContexto = canciones.map(c => ({
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
      ? canciones.filter(cancion => cancionesFavoritas.has(cancion.id))
      : canciones;
    
    if (cancionesFiltradas.length === 0) {
      return (
        <div className="p-8 text-center text-gray-500">
          <span className="text-4xl mb-2 block">
            {mostrarSoloFavoritas ? '💔' : '🎵'}
          </span>
          <p>
            {mostrarSoloFavoritas 
              ? 'No tienes canciones favoritas aún' 
              : 'No hay canciones disponibles'
            }
          </p>
        </div>
      );
    }
    
    return cancionesFiltradas.map((cancion, indice) => {
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
                <p className="text-sm text-gray-600 truncate">{cancion.artista}</p>
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
      <div className="flex items-center space-x-3">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="text-gray-600 hover:text-gray-800"
        >
          {isMuted || volumen === 0 ? (
            <SpeakerXMarkIcon className="w-5 h-5" />
          ) : (
            <SpeakerWaveIcon className="w-5 h-5" />
          )}
        </button>
        
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volumen}
          onChange={(e) => {
            const nuevoVolumen = parseFloat(e.target.value);
            setVolumen(nuevoVolumen);
            if (nuevoVolumen > 0) setIsMuted(false);
          }}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        
        <span className="text-sm text-gray-500 min-w-[3rem]">
          {Math.round((isMuted ? 0 : volumen) * 100)}%
        </span>
      </div>
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
                <h1 className="text-3xl font-bold">Reproductor Musical</h1>
                <p className="text-purple-100 mt-1">
                  Disfruta de tu música con calidad premium
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
                <div className="text-2xl font-bold">{cancionesFavoritas.size}</div>
                <div className="text-sm text-purple-200">Favoritas</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{usuario?.rol === 'premium' ? 'HD' : 'STD'}</div>
                <div className="text-sm text-purple-200">Calidad</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna Principal - Reproductor */}
          <div className="lg:col-span-2 space-y-6">
            
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No hay canciones disponibles</h2>
                <p className="text-gray-600 mb-6">
                  Parece que aún no has subido ninguna canción a tu biblioteca.
                </p>
                <button
                  onClick={() => router.push('/artista/musica')}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  Subir tu primera canción
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
