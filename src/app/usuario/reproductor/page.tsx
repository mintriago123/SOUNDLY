'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/SupabaseProvider';
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
  artista: string;
  album?: string;
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

  // Estados principales
  const [cancionActual, setCancionActual] = useState<Cancion | null>(null);
  const [playlist, setPlaylist] = useState<Cancion[]>([]);
  const [indiceActual, setIndiceActual] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volumen, setVolumen] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [modoAleatorio, setModoAleatorio] = useState(false);
  const [modoRepetir, setModoRepetir] = useState<ModoRepetir>('off');
  const [mostrarPlaylist, setMostrarPlaylist] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [cancionesFavoritas, setCancionesFavoritas] = useState<Set<string>>(new Set());

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
      
      // Listar archivos en el bucket music
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
        router.push('/auth/login?redirectTo=/usuario/reproductor');
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
      
      // Cargar canciones públicas después de establecer el usuario
      await cargarCancionesPublicas();
      
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
  const generarUrlAudio = async (urlOriginal: string) => {
    if (!urlOriginal || urlOriginal.startsWith('http')) {
      return urlOriginal;
    }

    try {
      // Intentar URL pública primero
      const { data: urlData } = supabase.storage
        .from('music')
        .getPublicUrl(urlOriginal);
      
      if (urlData?.publicUrl) {
        return urlData.publicUrl;
      }
    } catch (error) {
      console.error('Error generando URL pública:', error);
    }

    // Si falla la URL pública, intentar URL firmada
    try {
      const { data: signedUrlData, error: signedError } = await supabase.storage
        .from('music')
        .createSignedUrl(urlOriginal, 3600);
      
      if (signedUrlData?.signedUrl && !signedError) {
        return signedUrlData.signedUrl;
      }
    } catch (error) {
      console.error('Error generando URL firmada:', error);
    }

    return urlOriginal;
  };

  /**
   * Verificar accesibilidad de URL
   */
  const verificarUrlAudio = async (url: string) => {
    if (!url) return false;
    
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.warn('Error verificando URL:', url, error);
      return false;
    }
  };

  /**
   * Formatear canción para la interfaz
   */
  const formatearCancionParaInterfaz = (cancion: any, urlAudio: string) => {
    return {
      ...cancion,
      archivo_audio_url: urlAudio,
      artista: cancion.usuarios?.nombre || 'Artista Desconocido',
      album: cancion.album_id ? 'Álbum' : 'Sin álbum',
      es_favorita: false,
      fecha_lanzamiento: cancion.created_at
    };
  };

  /**
   * Cargar canciones públicas de todos los artistas desde la base de datos
   */
  const cargarCancionesPublicas = async () => {
    try {
      console.log('🔍 Iniciando carga de canciones públicas...');
      
      // Primero, diagnosticar qué hay en la tabla canciones
      const { data: todasLasCanciones, error: errorTodas } = await supabase
        .from('canciones')
        .select('*')
        .limit(10);
      
      console.log('📊 Total de canciones en la tabla:', todasLasCanciones?.length || 0);
      console.log('📋 Primeras canciones:', todasLasCanciones);
      
      if (errorTodas) {
        console.error('❌ Error consultando todas las canciones:', errorTodas);
      }
      
      // Cargar canciones públicas de la base de datos
      const { data: cancionesData, error } = await supabase
        .from('canciones')
        .select(`
          *,
          usuarios(nombre)
        `)
        .eq('estado', 'activa')
        .eq('es_publica', true)
        .order('reproducciones', { ascending: false })
        .limit(50); // Limitar a las 50 más populares

      console.log('🎵 Canciones públicas encontradas:', cancionesData?.length || 0);
      console.log('📝 Datos de canciones públicas:', cancionesData);

      if (error) {
        console.error('Error cargando canciones públicas:', error);
        return;
      }

      if (!cancionesData || cancionesData.length === 0) {
        console.log('⚠️ No hay canciones públicas disponibles');
        
        // Intentar cargar cualquier canción para diagnóstico
        const { data: cualquierCancion } = await supabase
          .from('canciones')
          .select('*')
          .limit(10);
          
        console.log('🔍 Canciones disponibles (cualquier estado):', cualquierCancion);
        
        setPlaylist([]);
        return;
      }

      // Mapear datos y generar URLs públicas para compatibilidad con la interfaz
      const cancionesFormateadas = await Promise.all(
        cancionesData.map(async (cancion: any) => {
          console.log('Procesando canción:', cancion.titulo, 'URL original:', cancion.archivo_audio_url);
          
          const urlAudio = await generarUrlAudio(cancion.archivo_audio_url);
          const esAccesible = await verificarUrlAudio(urlAudio);
          
          if (!esAccesible) {
            console.warn('URL no accesible para:', cancion.titulo);
          } else {
            console.log('URL verificada como accesible:', urlAudio);
          }
          
          return formatearCancionParaInterfaz(cancion, urlAudio);
        })
      );

      console.log('Canciones públicas cargadas:', cancionesFormateadas);
      setPlaylist(cancionesFormateadas);
      
      // Establecer la primera canción como actual
      if (cancionesFormateadas.length > 0) {
        setCancionActual(cancionesFormateadas[0]);
        setIndiceActual(0);
      }
    } catch (error) {
      console.error('Error cargando canciones públicas:', error);
    }
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

      // Actualizar el estado de favoritas en la playlist
      setPlaylist(prevPlaylist => 
        prevPlaylist.map(cancion => ({
          ...cancion,
          es_favorita: favoritosSet.has(cancion.id)
        }))
      );
    } catch (error) {
      console.error('Error cargando favoritos:', error);
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
   * Reproducir siguiente canción
   */
  const siguienteCancion = () => {
    if (playlist.length === 0) return;

    let siguienteIndice;
    
    if (modoAleatorio) {
      siguienteIndice = Math.floor(Math.random() * playlist.length);
    } else {
      siguienteIndice = (indiceActual + 1) % playlist.length;
    }

    setIndiceActual(siguienteIndice);
    setCancionActual(playlist[siguienteIndice]);
  };

  /**
   * Reproducir canción anterior
   */
  const cancionAnterior = () => {
    if (playlist.length === 0) return;

    let anteriorIndice;
    
    if (modoAleatorio) {
      anteriorIndice = Math.floor(Math.random() * playlist.length);
    } else {
      anteriorIndice = indiceActual === 0 ? playlist.length - 1 : indiceActual - 1;
    }

    setIndiceActual(anteriorIndice);
    setCancionActual(playlist[anteriorIndice]);
  };

  /**
   * Seleccionar canción específica de la playlist
   */
  const seleccionarCancion = (cancion: Cancion, indice: number) => {
    setCancionActual(cancion);
    setIndiceActual(indice);
    setIsPlaying(true);
  };

  /**
   * Actualizar estado de favorito en la interfaz
   */
  const actualizarEstadoFavorito = (cancionId: string, esFavorita: boolean) => {
    // Actualizar estado local
    const nuevasFavoritas = new Set(cancionesFavoritas);
    if (esFavorita) {
      nuevasFavoritas.add(cancionId);
    } else {
      nuevasFavoritas.delete(cancionId);
    }
    setCancionesFavoritas(nuevasFavoritas);

    // Actualizar playlist
    setPlaylist(prevPlaylist => 
      prevPlaylist.map(cancion => 
        cancion.id === cancionId 
          ? { ...cancion, es_favorita: esFavorita }
          : cancion
      )
    );

    // Actualizar canción actual si es la misma
    if (cancionActual?.id === cancionId) {
      setCancionActual(prev => prev ? { ...prev, es_favorita: esFavorita } : null);
    }
  };

  /**
   * Quitar canción de favoritos
   */
  const quitarDeFavoritos = async (cancionId: string, userId: string) => {
    const { error } = await supabase
      .from('favoritos')
      .delete()
      .eq('usuario_id', userId)
      .eq('cancion_id', cancionId);

    if (error) {
      console.error('Error quitando de favoritos:', error);
      return false;
    }

    // Actualizar contador en la tabla canciones
    const conteoReal = await obtenerConteoFavoritos(cancionId);
    await supabase
      .from('canciones')
      .update({ favoritos: conteoReal })
      .eq('id', cancionId);

    actualizarEstadoFavorito(cancionId, false);
    console.log('Canción quitada de favoritos');
    return true;
  };

  /**
   * Agregar canción a favoritos
   */
  const agregarAFavoritos = async (cancionId: string, userId: string) => {
    const { error } = await supabase
      .from('favoritos')
      .insert({
        usuario_id: userId,
        cancion_id: cancionId,
        fecha_agregada: new Date().toISOString()
      });

    if (error) {
      console.error('Error agregando a favoritos:', error);
      return false;
    }

    // Actualizar contador en la tabla canciones
    const conteoReal = await obtenerConteoFavoritos(cancionId);
    await supabase
      .from('canciones')
      .update({ favoritos: conteoReal })
      .eq('id', cancionId);

    actualizarEstadoFavorito(cancionId, true);
    console.log('Canción agregada a favoritos');
    return true;
  };

  /**
   * Toggle favorito de la canción actual
   */
  const toggleFavorito = async (cancionId?: string) => {
    if (!usuario) return;
    
    const idCancion = cancionId || cancionActual?.id;
    if (!idCancion) return;

    const esFavorita = cancionesFavoritas.has(idCancion);

    try {
      if (esFavorita) {
        await quitarDeFavoritos(idCancion, usuario.id);
      } else {
        await agregarAFavoritos(idCancion, usuario.id);
      }
    } catch (error) {
      console.error('Error en toggle favorito:', error);
    }
  };

  /**
   * Renderizar controles principales del reproductor
   */
  const renderControlesPrincipales = () => (
    <div className="flex justify-center space-x-4 mb-6">
      <button
        onClick={cancionAnterior}
        className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
        title="Anterior"
      >
        <BackwardIcon className="w-6 h-6" />
      </button>
      
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="p-4 rounded-full bg-purple-600 hover:bg-purple-700 text-white transition-colors transform hover:scale-105"
        title={isPlaying ? 'Pausar' : 'Reproducir'}
      >
        {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8 ml-1" />}
      </button>
      
      <button
        onClick={siguienteCancion}
        className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
        title="Siguiente"
      >
        <ForwardIcon className="w-6 h-6" />
      </button>
    </div>
  );

  /**
   * Renderizar modos de reproducción
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
   * Renderizar control de volumen
   */
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

  /**
   * Formatear duración en MM:SS
   */
  const formatearDuracion = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  /**
   * Formatear número con separadores de miles
   */
  const formatearNumero = (numero: number) => {
    return numero.toLocaleString('es-ES');
  };

  /**
   * Obtener título del modo de repetición
   */
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
            {cancionActual && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="md:flex">
                  
                  {/* Imagen del álbum */}
                  <div className="md:w-80 h-80 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center relative overflow-hidden">
                    {cancionActual.imagen_url ? (
                      <img 
                        src={cancionActual.imagen_url} 
                        alt={cancionActual.album}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-white">
                        <MusicalNoteIcon className="w-24 h-24 mx-auto mb-4 opacity-80" />
                        <p className="text-lg font-medium opacity-90">{cancionActual.album || 'Sin álbum'}</p>
                      </div>
                    )}
                    
                    {/* Overlay con controles */}
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 transition-transform"
                      >
                        {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8 ml-1" />}
                      </button>
                    </div>
                  </div>
                  
                  {/* Información detallada */}
                  <div className="flex-1 p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                          {cancionActual.titulo}
                        </h2>
                        <p className="text-xl text-gray-600 mb-1">{cancionActual.artista}</p>
                        <p className="text-gray-500">{cancionActual.album}</p>
                      </div>
                      
                      {/* Acciones rápidas */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleFavorito()}
                          className={`p-3 rounded-full transition-colors ${
                            cancionActual.es_favorita 
                              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={cancionActual.es_favorita ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                        >
                          {cancionActual.es_favorita ? (
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
                        <span className="ml-2 font-medium">{formatearDuracion(cancionActual.duracion)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Género:</span>
                        <span className="ml-2 font-medium">{cancionActual.genero || 'No especificado'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Reproducciones:</span>
                        <span className="ml-2 font-medium">{formatearNumero(cancionActual.reproducciones || 0)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Lanzamiento:</span>
                        <span className="ml-2 font-medium">
                          {cancionActual.fecha_lanzamiento ? 
                            new Date(cancionActual.fecha_lanzamiento).getFullYear() : 
                            'No disponible'
                          }
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
                      {cancionActual.es_favorita && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          ❤️ Favorita
                        </span>
                      )}
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        🎵 {cancionActual.genero}
                      </span>
                    </div>
                  </div>
                </div>
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
                <button
                  onClick={() => setMostrarPlaylist(!mostrarPlaylist)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {mostrarPlaylist ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              
              {mostrarPlaylist && (
                <div className="max-h-96 overflow-y-auto">
                  {playlist.map((cancion, indice) => {
                    const isCurrentSong = cancionActual?.id === cancion.id;
                    return (
                      <button
                        key={cancion.id}
                        onClick={() => seleccionarCancion(cancion, indice)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            seleccionarCancion(cancion, indice);
                          }
                        }}
                        className={`w-full p-4 border-b border-gray-100 transition-colors hover:bg-gray-50 text-left ${
                          isCurrentSong ? 'bg-purple-50 border-purple-200' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
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
                          
                          {/* Duración y favorito */}
                          <div className="flex items-center space-x-2">
                            {cancion.es_favorita && (
                              <HeartIconSolid className="w-4 h-4 text-red-500" />
                            )}
                            <span className="text-sm text-gray-500">{formatearDuracion(cancion.duracion)}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Reproductor fijo en la parte inferior - Comentado por ahora */}
        {/* 
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <GlobalMusicPlayer
            cancion={cancionActual ? {
              id: cancionActual.id,
              titulo: cancionActual.titulo,
              artista: cancionActual.artista,
              duracion: cancionActual.duracion,
              url_archivo: cancionActual.archivo_audio_url
            } : null}
            onNext={siguienteCancion}
            onPrevious={cancionAnterior}
            playlist={playlist}
          />
        </div>
        */}
      </div>
    </DashboardLayout>
  );
}
