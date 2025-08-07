'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  MagnifyingGlassIcon,
  MusicalNoteIcon,
  PlayIcon,
  PauseIcon,
  HeartIcon,
  PlusIcon,
  FunnelIcon,
  SpeakerWaveIcon,
  ClockIcon,
  UserIcon
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
  url_storage: string;
  imagen_url?: string;
  es_favorito: boolean;
  reproducciones: number;
  archivo_audio_url: string;
  estado: string;
  es_publica: boolean;
  created_at: string;
  usuario_subida_id: string;
}

interface FiltrosBusqueda {
  genero: string;
  año: string;
  duracion: string;
  artista: string;
}

export default function BuscarMusicaPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [termino, setTermino] = useState('');
  const [canciones, setCanciones] = useState<Cancion[]>([]);
  const [cancionesFiltradas, setCancionesFiltradas] = useState<Cancion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [cancionReproduciendo, setCancionReproduciendo] = useState<string | null>(null);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [audioActual, setAudioActual] = useState<HTMLAudioElement | null>(null);
  const [user, setUser] = useState<any>(null);
  const [favoritosUsuario, setFavoritosUsuario] = useState<Set<string>>(new Set());
  const [mensajeFavorito, setMensajeFavorito] = useState<string>('');
  const [filtros, setFiltros] = useState<FiltrosBusqueda>({
    genero: '',
    año: '',
    duracion: '',
    artista: ''
  });

  const [generos, setGeneros] = useState<string[]>(['Todos']);
  const [años, setAños] = useState<string[]>(['Todos']);
  const duraciones = ['Todos', 'Corta (< 3 min)', 'Media (3-5 min)', 'Larga (> 5 min)'];

  /**
   * Actualizar géneros y años dinámicamente basándose en las canciones
   */
  const actualizarFiltrosDinamicos = useCallback(() => {
    const generosUnicos = new Set<string>();
    const añosUnicos = new Set<number>();

    canciones.forEach(cancion => {
      if (cancion.genero) generosUnicos.add(cancion.genero);
      if (cancion.año) añosUnicos.add(cancion.año);
    });

    setGeneros(['Todos', ...Array.from(generosUnicos).sort((a, b) => a.localeCompare(b))]);
    setAños(['Todos', ...Array.from(añosUnicos).sort((a, b) => b - a).map(String)]);
  }, [canciones]);

  useEffect(() => {
    actualizarFiltrosDinamicos();
  }, [actualizarFiltrosDinamicos]);

  // Cargar usuario y sus favoritos al iniciar
  useEffect(() => {
    const cargarUsuarioYFavoritos = async () => {
      try {
        // Obtener usuario actual
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          // Cargar favoritos del usuario
          const { data: favoritos, error } = await supabase
            .from('favoritos')
            .select('cancion_id')
            .eq('usuario_id', user.id);

          if (error) {
            console.error('Error cargando favoritos:', error);
          } else {
            const favoritosSet = new Set(favoritos?.map(f => f.cancion_id) || []);
            setFavoritosUsuario(favoritosSet);
            console.log('Favoritos cargados:', favoritosSet.size);
          }
        }
      } catch (error) {
        console.error('Error cargando usuario y favoritos:', error);
      }
    };
    
    cargarUsuarioYFavoritos();
  }, [supabase]);

  // Actualizar el estado de favoritos en las canciones cuando cambian los favoritos del usuario
  useEffect(() => {
    setCanciones(prev => prev.map(cancion => ({
      ...cancion,
      es_favorito: favoritosUsuario.has(cancion.id)
    })));
  }, [favoritosUsuario]);

  /**
   * Cargar canciones públicas desde la base de datos de Supabase
   */
  const cargarCanciones = useCallback(async () => {
    setCargando(true);
    try {
      console.log('🔍 Cargando canciones desde la base de datos...');
      
      // Obtener canciones públicas y activas con información del usuario
      const { data: cancionesData, error } = await supabase
        .from('canciones')
        .select(`
          *,
          usuarios(nombre, email)
        `)
        .eq('estado', 'activa')
        .eq('es_publica', true)
        .order('reproducciones', { ascending: false });

      if (error) {
        console.error('Error cargando canciones:', error);
        return;
      }

      console.log('📊 Canciones encontradas:', cancionesData?.length || 0);
      console.log('📋 Datos:', cancionesData);

      if (!cancionesData || cancionesData.length === 0) {
        console.log('⚠️ No hay canciones públicas disponibles');
        setCanciones([]);
        return;
      }

      // Formatear duración desde segundos a MM:SS - función movida fuera del map
      const formatearDuracion = (segundos: number) => {
        if (!segundos) return '0:00';
        const mins = Math.floor(segundos / 60);
        const secs = segundos % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      };

      // Procesar y formatear las canciones
      const cancionesFormateadas = await Promise.all(
        cancionesData.map(async (cancion: {
          id: string;
          titulo: string;
          duracion: number;
          genero?: string;
          año?: number;
          archivo_audio_url: string;
          imagen_url?: string;
          reproducciones: number;
          estado: string;
          es_publica: boolean;
          created_at: string;
          usuario_subida_id: string;
          usuarios?: { nombre?: string; email?: string };
          album?: string;
        }) => {
          let urlAudio = cancion.archivo_audio_url;
          
          // Si la URL no es completa, generar URL pública desde Supabase Storage
          if (urlAudio && !urlAudio.startsWith('http')) {
            try {
              const { data: urlData } = supabase.storage
                .from('music')
                .getPublicUrl(urlAudio);
              
              if (urlData?.publicUrl) {
                urlAudio = urlData.publicUrl;
                console.log('🔗 URL pública generada para:', cancion.titulo, urlAudio);
              }
            } catch (error) {
              console.error('Error generando URL para:', cancion.titulo, error);
            }
          }

          return {
            id: cancion.id,
            titulo: cancion.titulo,
            artista: cancion.usuarios?.nombre || 'Artista Desconocido',
            album: cancion.album || 'Sin álbum',
            duracion: formatearDuracion(cancion.duracion),
            genero: cancion.genero || 'Sin género',
            año: cancion.año || new Date(cancion.created_at).getFullYear(),
            url_storage: urlAudio,
            archivo_audio_url: urlAudio,
            imagen_url: cancion.imagen_url,
            es_favorito: false, // Se actualizará después con el useEffect
            reproducciones: cancion.reproducciones || 0,
            estado: cancion.estado,
            es_publica: cancion.es_publica,
            created_at: cancion.created_at,
            usuario_subida_id: cancion.usuario_subida_id
          };
        })
      );

      console.log('✅ Canciones formateadas:', cancionesFormateadas);
      setCanciones(cancionesFormateadas);
      
    } catch (error) {
      console.error('Error cargando canciones:', error);
    } finally {
      setCargando(false);
    }
  }, [supabase]); // Solo supabase como dependencia

  const aplicarFiltros = useCallback(() => {
    let resultado = [...canciones];

    // Filtro por término de búsqueda
    if (termino.trim()) {
      resultado = resultado.filter(cancion =>
        cancion.titulo.toLowerCase().includes(termino.toLowerCase()) ||
        cancion.artista.toLowerCase().includes(termino.toLowerCase()) ||
        cancion.album.toLowerCase().includes(termino.toLowerCase()) ||
        cancion.genero.toLowerCase().includes(termino.toLowerCase())
      );
    }

    // Filtro por género
    if (filtros.genero && filtros.genero !== 'Todos') {
      resultado = resultado.filter(cancion => cancion.genero === filtros.genero);
    }

    // Filtro por año
    if (filtros.año && filtros.año !== 'Todos') {
      resultado = resultado.filter(cancion => cancion.año.toString() === filtros.año);
    }

    // Filtro por artista
    if (filtros.artista.trim()) {
      resultado = resultado.filter(cancion =>
        cancion.artista.toLowerCase().includes(filtros.artista.toLowerCase())
      );
    }

    // Filtro por duración
    if (filtros.duracion && filtros.duracion !== 'Todos') {
      resultado = resultado.filter(cancion => {
        const [minutos, segundos] = cancion.duracion.split(':').map(Number);
        const duracionTotal = minutos + segundos / 60;
        
        switch (filtros.duracion) {
          case 'Corta (< 3 min)':
            return duracionTotal < 3;
          case 'Media (3-5 min)':
            return duracionTotal >= 3 && duracionTotal <= 5;
          case 'Larga (> 5 min)':
            return duracionTotal > 5;
          default:
            return true;
        }
      });
    }

    setCancionesFiltradas(resultado);
  }, [termino, filtros, canciones]);

  /**
   * Búsqueda en tiempo real con debounce
   */
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (termino.trim().length >= 2 || termino.trim().length === 0) {
        aplicarFiltros();
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(delayedSearch);
  }, [termino, aplicarFiltros]);

  /**
   * Limpiar audio al desmontar el componente
   */
  useEffect(() => {
    return () => {
      if (audioActual) {
        audioActual.pause();
        audioActual.currentTime = 0;
      }
    };
  }, [audioActual]);

  /**
   * Función para reproducir/pausar audio real
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
        console.error('La canción no tiene archivo de audio:', cancion.titulo);
        alert('Esta canción no tiene archivo de audio disponible');
        return;
      }

      console.log('🎵 Intentando reproducir:', cancion.titulo, 'URL:', cancion.archivo_audio_url);

      // Crear nuevo elemento de audio
      const nuevoAudio = new Audio(cancion.archivo_audio_url);
      
      // Configurar eventos del audio
      nuevoAudio.addEventListener('loadstart', () => {
        console.log('📡 Iniciando carga de audio...');
      });

      nuevoAudio.addEventListener('canplay', () => {
        console.log('✅ Audio listo para reproducir');
      });

      nuevoAudio.addEventListener('error', (e) => {
        console.error('❌ Error cargando audio:', e);
        alert(`Error reproduciendo: ${cancion.titulo}`);
        setCancionReproduciendo(null);
        setAudioActual(null);
      });

      nuevoAudio.addEventListener('ended', () => {
        console.log('🔚 Reproducción terminada');
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
        console.log('🎶 Reproduciendo:', cancion.titulo);
        
        // Opcional: Incrementar contador de reproducciones
        await incrementarReproducciones(cancion.id);
        
      } catch (playError) {
        console.error('Error iniciando reproducción:', playError);
        alert(`No se pudo reproducir: ${cancion.titulo}`);
      }

    } catch (error) {
      console.error('Error en toggleReproduccion:', error);
    }
  };

  /**
   * Incrementar contador de reproducciones en la base de datos
   */
  const incrementarReproducciones = async (cancionId: string) => {
    try {
      // Primero obtener el valor actual
      const { data: cancionActual } = await supabase
        .from('canciones')
        .select('reproducciones')
        .eq('id', cancionId)
        .single();

      if (cancionActual) {
        const nuevasReproducciones = (cancionActual.reproducciones || 0) + 1;
        
        const { error } = await supabase
          .from('canciones')
          .update({ reproducciones: nuevasReproducciones })
          .eq('id', cancionId);

        if (error) {
          console.error('Error incrementando reproducciones:', error);
        } else {
          // Actualizar el estado local
          setCanciones(prev => prev.map(cancion => 
            cancion.id === cancionId 
              ? { ...cancion, reproducciones: nuevasReproducciones }
              : cancion
          ));
        }
      }
    } catch (error) {
      console.error('Error en incrementarReproducciones:', error);
    }
  };

  /**
   * Cargar canciones al montar el componente
   */
  useEffect(() => {
    cargarCanciones();
  }, [cargarCanciones]);

  const toggleFavorito = async (cancionId: string) => {
    if (!user) {
      console.warn('Usuario no autenticado');
      // Redirigir a favoritos para que vea que necesita autenticarse
      router.push('/usuario/favoritos');
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

        // Actualizar estado local
        setFavoritosUsuario(prev => {
          const newSet = new Set(prev);
          newSet.delete(cancionId);
          return newSet;
        });

        // Mostrar mensaje de confirmación
        setMensajeFavorito('❤️ Canción removida de favoritos');
        setTimeout(() => setMensajeFavorito(''), 3000);
        
        console.log(`Canción ${cancionId} removida de favoritos`);
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

        // Actualizar estado local
        setFavoritosUsuario(prev => new Set([...prev, cancionId]));
        
        // Mostrar mensaje de confirmación
        setMensajeFavorito('💖 Canción agregada a favoritos');
        setTimeout(() => setMensajeFavorito(''), 3000);
        
        console.log(`Canción ${cancionId} agregada a favoritos`);
      }
    } catch (error) {
      console.error('Error en toggleFavorito:', error);
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      genero: '',
      año: '',
      duracion: '',
      artista: ''
    });
    setTermino('');
  };

  const formatearNumero = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Mensaje de confirmación de favoritos */}
        {mensajeFavorito && (
          <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg">
            {mensajeFavorito}
          </div>
        )}
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                <MagnifyingGlassIcon className="w-8 h-8 mr-3 text-purple-600" />
                Buscar Música 🎵
              </h2>
              <p className="text-gray-600">
                Explora y descubre nueva música en nuestra biblioteca
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/usuario/favoritos')}
                className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <HeartIconSolid className="w-5 h-5" />
                <span>Mis Favoritos</span>
                {favoritosUsuario.size > 0 && (
                  <span className="bg-red-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {favoritosUsuario.size}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Buscador y filtros */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            {/* Barra de búsqueda principal */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={termino}
                onChange={(e) => setTermino(e.target.value)}
                placeholder="Buscar por título, artista, álbum o género..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
              />
            </div>

            {/* Controles de filtros */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => setMostrarFiltros(!mostrarFiltros)}
                  className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                    mostrarFiltros
                      ? 'bg-purple-100 border-purple-300 text-purple-700'
                      : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FunnelIcon className="w-4 h-4 mr-2" />
                  Filtros
                </button>
                {(termino || Object.values(filtros).some(f => f)) && (
                  <button
                    onClick={limpiarFiltros}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 underline"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>📊 {formatearNumero(cancionesFiltradas.length)} canciones encontradas</span>
              </div>
            </div>

            {/* Panel de filtros */}
            {mostrarFiltros && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border">
                <div>
                  <label htmlFor="filtro-genero" className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                  <select
                    id="filtro-genero"
                    value={filtros.genero}
                    onChange={(e) => setFiltros(prev => ({ ...prev, genero: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  >
                    {generos.map(genero => (
                      <option key={genero} value={genero === 'Todos' ? '' : genero}>
                        {genero}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="filtro-año" className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                  <select
                    id="filtro-año"
                    value={filtros.año}
                    onChange={(e) => setFiltros(prev => ({ ...prev, año: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  >
                    {años.map(año => (
                      <option key={año} value={año === 'Todos' ? '' : año}>
                        {año}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="filtro-duracion" className="block text-sm font-medium text-gray-700 mb-1">Duración</label>
                  <select
                    id="filtro-duracion"
                    value={filtros.duracion}
                    onChange={(e) => setFiltros(prev => ({ ...prev, duracion: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  >
                    {duraciones.map(duracion => (
                      <option key={duracion} value={duracion === 'Todos' ? '' : duracion}>
                        {duracion}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="filtro-artista" className="block text-sm font-medium text-gray-700 mb-1">Artista</label>
                  <input
                    id="filtro-artista"
                    type="text"
                    value={filtros.artista}
                    onChange={(e) => setFiltros(prev => ({ ...prev, artista: e.target.value }))}
                    placeholder="Buscar artista..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resultados de búsqueda */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <MusicalNoteIcon className="w-5 h-5 mr-2" />
              Resultados de Búsqueda
            </h3>
          </div>

          {cargando ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Buscando música en la base de datos...</p>
            </div>
          ) : (
            <>
              {cancionesFiltradas.length === 0 ? (
                <div className="p-12 text-center">
                  <MagnifyingGlassIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {termino.trim() || Object.values(filtros).some(f => f) 
                      ? 'No se encontraron canciones' 
                      : 'No hay canciones disponibles'
                    }
                  </h3>
                  <p className="text-gray-600">
                    {termino.trim() || Object.values(filtros).some(f => f)
                      ? 'Intenta cambiar los filtros o términos de búsqueda'
                      : 'Parece que no hay canciones públicas en la base de datos aún'
                    }
                  </p>
                  {!termino && !Object.values(filtros).some(f => f) && (
                    <button
                      onClick={cargarCanciones}
                      className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      🔄 Recargar canciones
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {cancionesFiltradas.map((cancion) => (
                    <div key={cancion.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        {/* Imagen del álbum */}
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                            {cancion.imagen_url ? (
                              <Image 
                                src={cancion.imagen_url} 
                                alt={`Álbum ${cancion.album}`}
                                width={64}
                                height={64}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                            ) : (
                              <MusicalNoteIcon className="w-8 h-8 text-white" />
                            )}
                          </div>
                        </div>

                    {/* Información de la canción */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg font-medium text-gray-900 truncate">
                          {cancion.titulo}
                        </h4>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {cancion.genero}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <UserIcon className="w-4 h-4 mr-1" />
                          {cancion.artista}
                        </div>
                        <div className="flex items-center">
                          <MusicalNoteIcon className="w-4 h-4 mr-1" />
                          {cancion.album}
                        </div>
                        <div className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {cancion.duracion}
                        </div>
                        <div className="flex items-center">
                          <SpeakerWaveIcon className="w-4 h-4 mr-1" />
                          {formatearNumero(cancion.reproducciones)}
                        </div>
                      </div>
                    </div>

                    {/* Controles */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleFavorito(cancion.id)}
                        className={`p-2 rounded-full transition-colors ${
                          cancion.es_favorito
                            ? 'text-red-600 hover:text-red-700'
                            : 'text-gray-400 hover:text-red-600'
                        }`}
                      >
                        {cancion.es_favorito ? (
                          <HeartIconSolid className="w-5 h-5" />
                        ) : (
                          <HeartIcon className="w-5 h-5" />
                        )}
                      </button>

                      <button
                        onClick={() => toggleReproduccion(cancion)}
                        className="p-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                        title={cancionReproduciendo === cancion.id ? 'Pausar' : 'Reproducir'}
                      >
                        {cancionReproduciendo === cancion.id ? (
                          <PauseIcon className="w-5 h-5" />
                        ) : (
                          <PlayIcon className="w-5 h-5" />
                        )}
                      </button>

                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
                        title="Agregar a playlist"
                      >
                        <PlusIcon className="w-5 h-5" />
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
    </DashboardLayout>
  );
}
