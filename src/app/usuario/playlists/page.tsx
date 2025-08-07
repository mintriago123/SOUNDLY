'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useSupabase } from '@/components/SupabaseProvider';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  MusicalNoteIcon,
  PlayIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface Playlist {
  id: string;
  nombre: string;
  descripcion?: string;
  numero_canciones: number;
  duracion_total: number;
  es_publica: boolean;
  imagen_url?: string;
  created_at: string;
}

export default function PlaylistsPage() {
  const router = useRouter();
  const { supabase } = useSupabase();
  
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [cargando, setCargando] = useState(true);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [user, setUser] = useState<any>(null);
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [nombrePlaylist, setNombrePlaylist] = useState('');
  const [descripcionPlaylist, setDescripcionPlaylist] = useState('');
  const [esPublica, setEsPublica] = useState(false);
  
  // Estados para menú de opciones
  const [menuAbiertoId, setMenuAbiertoId] = useState<string | null>(null);
  const [playlistEditando, setPlaylistEditando] = useState<Playlist | null>(null);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [mensaje, setMensaje] = useState<string>('');

  useEffect(() => {
    const inicializar = async () => {
      try {
        // Obtener usuario actual
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          await cargarPlaylists(user.id);
        }
      } catch (error) {
        console.error('Error inicializando:', error);
      } finally {
        setCargando(false);
      }
    };
    
    inicializar();
    
    // Inicializar base de datos
    initializeDatabase();
  }, []);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuAbiertoId && !(event.target as Element).closest('.menu-dropdown')) {
        setMenuAbiertoId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuAbiertoId]);

  /**
   * Función para crear las tablas necesarias si no existen
   */
  const initializeDatabase = async () => {
    try {
      // Crear tabla playlists si no existe
      const { error: playlistsError } = await supabase.rpc('create_playlists_table', {});
      
      if (playlistsError && !playlistsError.message.includes('already exists')) {
        console.log('Intentando crear tabla playlists manualmente...');
        
        // Intentar crear la tabla directamente
        const createPlaylistsSQL = `
          CREATE TABLE IF NOT EXISTS playlists (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            nombre varchar(255) NOT NULL,
            descripcion text,
            usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
            es_publica boolean DEFAULT false,
            imagen_url text,
            numero_canciones integer DEFAULT 0,
            duracion_total integer DEFAULT 0,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now()
          );
        `;
        
        const { error } = await supabase.rpc('execute_sql', { sql: createPlaylistsSQL });
        if (error) {
          console.warn('No se pudo crear tabla playlists:', error);
        }
      }

      // Crear tabla playlist_canciones si no existe
      const createPlaylistCancionesSQL = `
        CREATE TABLE IF NOT EXISTS playlist_canciones (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          playlist_id uuid NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
          cancion_id uuid NOT NULL REFERENCES canciones(id) ON DELETE CASCADE,
          posicion integer NOT NULL DEFAULT 0,
          agregada_por uuid REFERENCES usuarios(id),
          fecha_agregada timestamp with time zone DEFAULT now(),
          UNIQUE(playlist_id, cancion_id)
        );
      `;
      
      const { error: playlistCancionesError } = await supabase.rpc('execute_sql', { sql: createPlaylistCancionesSQL });
      if (playlistCancionesError) {
        console.warn('No se pudo crear tabla playlist_canciones:', playlistCancionesError);
      }

      console.log('Base de datos inicializada');
      
    } catch (error) {
      console.warn('Error inicializando base de datos:', error);
    }
  };

  /**
   * Cargar playlists del usuario
   */
  const cargarPlaylists = async (userId: string) => {
    try {
      const { data: playlistsData, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('usuario_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando playlists:', error);
        return;
      }

      // Agregar conteo de canciones a cada playlist si no está disponible
      const playlistsConConteo = await Promise.all(
        (playlistsData || []).map(async (playlist) => {
          let numeroCancionesActual = playlist.numero_canciones || 0;
          
          // Si no tiene conteo, calcularlo
          if (!playlist.numero_canciones) {
            const { count } = await supabase
              .from('playlist_canciones')
              .select('*', { count: 'exact', head: true })
              .eq('playlist_id', playlist.id);
            
            numeroCancionesActual = count || 0;
            
            // Actualizar en la base de datos
            await supabase
              .from('playlists')
              .update({ numero_canciones: numeroCancionesActual })
              .eq('id', playlist.id);
          }
          
          return {
            ...playlist,
            numero_canciones: numeroCancionesActual
          };
        })
      );

      console.log('Playlists cargadas:', playlistsConConteo);
      setPlaylists(playlistsConConteo);
    } catch (error) {
      console.error('Error cargando playlists:', error);
    }
  };

  /**
   * Crear nueva playlist
   */
  const crearPlaylist = async () => {
    if (!nombrePlaylist.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert([{
          nombre: nombrePlaylist.trim(),
          descripcion: descripcionPlaylist.trim() || null,
          usuario_id: user.id,
          es_publica: esPublica,
          numero_canciones: 0,
          duracion_total: 0
        }])
        .select()
        .single();

      if (error) throw error;

      // Agregar la nueva playlist al estado
      setPlaylists(prev => [data, ...prev]);
      
      // Limpiar modal
      setMostrarModalCrear(false);
      setNombrePlaylist('');
      setDescripcionPlaylist('');
      setEsPublica(false);
      
      setMensaje('Playlist creada exitosamente');
      setTimeout(() => setMensaje(''), 3000);
    } catch (error: any) {
      console.error('Error creando playlist:', error.message);
      setMensaje('Error al crear la playlist');
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  /**
   * Toggle del menú de opciones
   */
  const toggleMenu = (playlistId: string) => {
    setMenuAbiertoId(menuAbiertoId === playlistId ? null : playlistId);
  };

  /**
   * Editar playlist
   */
  const editarPlaylist = (playlist: Playlist) => {
    setPlaylistEditando(playlist);
    setNombrePlaylist(playlist.nombre);
    setDescripcionPlaylist(playlist.descripcion || '');
    setEsPublica(playlist.es_publica);
    setMostrarModalEditar(true);
    setMenuAbiertoId(null);
  };

  /**
   * Guardar edición de playlist
   */
  const guardarEdicionPlaylist = async () => {
    if (!nombrePlaylist.trim() || !playlistEditando || !user) return;

    try {
      const { error } = await supabase
        .from('playlists')
        .update({
          nombre: nombrePlaylist.trim(),
          descripcion: descripcionPlaylist.trim() || null,
          es_publica: esPublica,
          updated_at: new Date().toISOString()
        })
        .eq('id', playlistEditando.id);

      if (error) throw error;

      // Actualizar en el estado local
      setPlaylists(prev => 
        prev.map(p => 
          p.id === playlistEditando.id 
            ? { 
                ...p, 
                nombre: nombrePlaylist.trim(),
                descripcion: descripcionPlaylist.trim() || undefined,
                es_publica: esPublica
              }
            : p
        )
      );

      setMostrarModalEditar(false);
      setPlaylistEditando(null);
      setNombrePlaylist('');
      setDescripcionPlaylist('');
      setEsPublica(false);
      
      setMensaje('Playlist actualizada exitosamente');
      setTimeout(() => setMensaje(''), 3000);
    } catch (error: any) {
      console.error('Error actualizando playlist:', error.message);
      setMensaje('Error al actualizar la playlist');
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  /**
   * Confirmar eliminación de playlist
   */
  const confirmarEliminar = (playlist: Playlist) => {
    setPlaylistEditando(playlist);
    setMostrarModalEliminar(true);
    setMenuAbiertoId(null);
  };

  /**
   * Eliminar playlist
   */
  const eliminarPlaylist = async () => {
    if (!playlistEditando || !user) return;

    try {
      // Eliminar primero las canciones de la playlist
      await supabase
        .from('playlist_canciones')
        .delete()
        .eq('playlist_id', playlistEditando.id);

      // Luego eliminar la playlist
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistEditando.id);

      if (error) throw error;

      setMostrarModalEliminar(false);
      setPlaylistEditando(null);
      setPlaylists(prev => prev.filter(p => p.id !== playlistEditando.id));
      setMensaje('Playlist eliminada exitosamente');
      setTimeout(() => setMensaje(''), 3000);
    } catch (error: any) {
      console.error('Error al eliminar playlist:', error.message);
      setMensaje('Error al eliminar la playlist');
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  /**
   * Toggle privacidad de playlist
   */
  const togglePrivacidad = async (playlist: Playlist) => {
    try {
      const { error } = await supabase
        .from('playlists')
        .update({ 
          es_publica: !playlist.es_publica,
          updated_at: new Date().toISOString()
        })
        .eq('id', playlist.id);

      if (error) throw error;

      setPlaylists(prev => 
        prev.map(p => 
          p.id === playlist.id 
            ? { ...p, es_publica: !p.es_publica } 
            : p
        )
      );
      setMenuAbiertoId(null);
      setMensaje(`Playlist ${!playlist.es_publica ? 'pública' : 'privada'} exitosamente`);
      setTimeout(() => setMensaje(''), 3000);
    } catch (error: any) {
      console.error('Error al cambiar privacidad:', error.message);
      setMensaje('Error al cambiar la privacidad');
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  /**
   * Compartir playlist
   */
  const compartirPlaylist = async (playlist: Playlist) => {
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
    setMenuAbiertoId(null);
  };

  /**
   * Filtrar playlists por término de búsqueda
   */
  const playlistsFiltradas = playlists.filter(playlist =>
    playlist.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
    playlist.descripcion?.toLowerCase().includes(terminoBusqueda.toLowerCase())
  );

  /**
   * Formatear duración
   */
  const formatearDuracion = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    
    if (horas > 0) {
      return `${horas}h ${minutos}m`;
    }
    return `${minutos}m`;
  };

  /**
   * Formatear fecha
   */
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  };

  // Función para cargar canciones que ya están en la playlist
  const cargarCancionesEnPlaylist = async (playlistId: string) => {
    try {
      const { data: playlistCanciones, error } = await supabase
        .from('playlist_canciones')
        .select('cancion_id')
        .eq('playlist_id', playlistId);

      if (error) {
        console.error('Error cargando canciones en playlist:', error);
        setSongsInCurrentPlaylist([]);
        return;
      }

      const cancionIds = playlistCanciones?.map(item => item.cancion_id) || [];
      setSongsInCurrentPlaylist(cancionIds);
      console.log('Canciones en playlist actual:', cancionIds.length);
    } catch (error) {
      console.error('Error general cargando canciones en playlist:', error);
      setSongsInCurrentPlaylist([]);
    }
  };

  // Función para cargar canciones disponibles
  const cargarCancionesDisponibles = async () => {
    try {
      console.log('Iniciando carga de canciones disponibles...');
      
      // Primero intentemos cargar las canciones básicas
      const { data: canciones, error } = await supabase
        .from('canciones')
        .select('*')
        .order('titulo');

      if (error) {
        console.error('Error cargando canciones:', error);
        // Intentar consulta más simple
        const { data: cancionesSimple, error: errorSimple } = await supabase
          .from('canciones')
          .select('id, titulo, duracion, archivo_audio, imagen_url, usuario_id');
        
        if (errorSimple) {
          console.error('Error con consulta simple:', errorSimple);
          setAvailableSongs([]);
          return;
        }
        
        console.log('Canciones cargadas (consulta simple):', cancionesSimple?.length || 0);
        
        const cancionesFormateadas = cancionesSimple?.map((cancion: any) => ({
          id: cancion.id,
          titulo: cancion.titulo,
          artista: 'Artista desconocido',
          duracion: cancion.duracion || '0:00',
          archivo_audio: cancion.archivo_audio,
          imagen_url: cancion.imagen_url
        })) || [];

        setAvailableSongs(cancionesFormateadas);
        return;
      }

      console.log('Canciones cargadas exitosamente:', canciones?.length || 0);

      // Si tenemos canciones, intentar obtener información del usuario
      const cancionesFormateadas = await Promise.all(
        (canciones || []).map(async (cancion: any) => {
          let artista = 'Artista desconocido';
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Mis Playlists 🎵
          </h2>
          <p className="text-gray-600">
            Gestiona y organiza tu colección de música
          </p>
        </div>

        {/* Controles de playlists */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex gap-4">
              <button 
                onClick={() => router.push('/usuario/buscar')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Buscar Música
              </button>
              <button 
                onClick={() => setMostrarModalCrear(true)}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Crear Playlist
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Buscar en tus playlists..."
                value={terminoBusqueda}
                onChange={(e) => setTerminoBusqueda(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 w-64 focus:ring-2 focus:ring-blue-400 outline-none"
              />
              <button className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                <MagnifyingGlassIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Vista de playlists */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Tus Playlists ({playlistsFiltradas.length})
              </h3>
            </div>
          </div>
          
          {cargando ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : playlistsFiltradas.length === 0 ? (
            <div className="p-6">
              <div className="text-center text-gray-500 py-12">
                <div className="text-6xl mb-4">🎼</div>
                <h4 className="text-xl font-medium mb-2">
                  {terminoBusqueda ? 'No se encontraron playlists' : 'No tienes playlists aún'}
                </h4>
                <p className="text-gray-400 mb-6">
                  {terminoBusqueda 
                    ? 'Intenta con otros términos de búsqueda'
                    : 'Crea tu primera playlist para comenzar'
                  }
                </p>
                {!terminoBusqueda && (
                  <button 
                    onClick={() => setMostrarModalCrear(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon className="w-5 h-5 inline mr-2" />
                    Crear Primera Playlist
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {playlistsFiltradas.map((playlist) => (
                  <div 
                    key={playlist.id} 
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors group relative"
                  >
                    {/* Menú de opciones */}
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMenu(playlist.id);
                        }}
                        className="p-2 rounded-full bg-white/80 hover:bg-white shadow-sm transition-all duration-200 opacity-0 group-hover:opacity-100"
                      >
                        <EllipsisVerticalIcon className="w-5 h-5 text-gray-600" />
                      </button>
                      
                      {/* Dropdown del menú */}
                      {menuAbiertoId === playlist.id && (
                        <div className="menu-dropdown absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              editarPlaylist(playlist);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                          >
                            <PencilIcon className="w-4 h-4 mr-3" />
                            Editar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePrivacidad(playlist);
                            }}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              compartirPlaylist(playlist);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                            disabled={!playlist.es_publica}
                          >
                            <ShareIcon className="w-4 h-4 mr-3" />
                            Compartir
                          </button>
                          <hr className="my-1" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmarEliminar(playlist);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                          >
                            <TrashIcon className="w-4 h-4 mr-3" />
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Área clickeable para navegar */}
                    <div 
                      className="cursor-pointer"
                      onClick={() => router.push(`/usuario/playlist/${playlist.id}`)}
                    >
                      {/* Imagen de la playlist */}
                      <div className="relative mb-4">
                        <div className="w-full aspect-square bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                          {playlist.imagen_url ? (
                            <img 
                              src={playlist.imagen_url} 
                              alt={playlist.nombre}
                              className="w-full h-full rounded-lg object-cover"
                            />
                          ) : (
                            <MusicalNoteIcon className="w-12 h-12 text-white" />
                          )}
                        </div>
                        
                        {/* Botón de play en hover */}
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/usuario/playlist/${playlist.id}`);
                            }}
                            className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 transition-colors"
                          >
                            <PlayIcon className="w-6 h-6" />
                          </button>
                        </div>
                      </div>

                      {/* Información de la playlist */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1 truncate">
                          {playlist.nombre}
                        </h4>
                        {playlist.descripcion && (
                          <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                            {playlist.descripcion}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>{playlist.numero_canciones} canciones</span>
                          {playlist.duracion_total > 0 && (
                            <span>{formatearDuracion(playlist.duracion_total)}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                          <span>{playlist.es_publica ? 'Pública' : 'Privada'}</span>
                          <span>{formatearFecha(playlist.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reproductor rápido */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Reproductor Rápido</h3>
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-300 rounded-lg flex items-center justify-center">
                🎵
              </div>
              <div>
                <p className="font-medium text-gray-900">Sin reproducción</p>
                <p className="text-sm text-gray-500">Selecciona una canción</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="text-gray-400 hover:text-gray-600">⏮️</button>
              <button className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-700">
                ▶️
              </button>
              <button className="text-gray-400 hover:text-gray-600">⏭️</button>
            </div>
          </div>
        </div>
      </div>

      {/* Mensaje de notificación */}
      {mensaje && (
        <div className="fixed top-4 right-4 bg-purple-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {mensaje}
        </div>
      )}

      {/* Modal para crear playlist */}
      {mostrarModalCrear && (
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
                    placeholder="Mi nueva playlist"
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
                    placeholder="Describe tu playlist..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
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
                    setMostrarModalCrear(false);
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Crear Playlist
                </button>
              </div>
            </div>
          </div>
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
                    placeholder="Nombre de la playlist"
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
                    placeholder="Describe tu playlist..."
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
                  onClick={() => {
                    setMostrarModalEditar(false);
                    setPlaylistEditando(null);
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
                ¿Estás seguro de que quieres eliminar la playlist &quot;{playlistEditando?.nombre}&quot;? 
                Se eliminarán todas las canciones de la playlist.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setMostrarModalEliminar(false);
                    setPlaylistEditando(null);
                  }}
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
                        <p className={`text-sm ${themeClasses.textMuted} mb-2 line-clamp-2`}>{playlist.descripcion}</p>
                      )}
                      <div className={`text-xs ${themeClasses.textMuted} space-y-1`}>
                        <p>{playlist.canciones_count || 0} canciones</p>
                        <p>
                          {playlist.es_publica ? '🌍 Pública' : '🔒 Privada'} • 
                          {new Date(playlist.created_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal de creación */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${themeClasses.bgCard} rounded-lg p-6 w-full max-w-md mx-4`}>
              <h3 className={`text-lg font-medium ${themeClasses.text} mb-4`}>Nueva Playlist</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="playlist-name" className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                    Nombre de la playlist *
                  </label>
                  <input
                    id="playlist-name"
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="Ej: Mis favoritos"
                    className={`w-full ${themeClasses.inputBg} border ${themeClasses.inputBorder} rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none ${themeClasses.text}`}
                  />
                </div>
                
                <div>
                  <label htmlFor="playlist-description" className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                    Descripción (opcional)
                  </label>
                  <textarea
                    id="playlist-description"
                    value={newPlaylistDescription}
                    onChange={(e) => setNewPlaylistDescription(e.target.value)}
                    placeholder="Describe tu playlist..."
                    rows={3}
                    className={`w-full ${themeClasses.inputBg} border ${themeClasses.inputBorder} rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none ${themeClasses.text}`}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className={`px-4 py-2 border ${themeClasses.border} ${themeClasses.text} rounded-lg ${themeClasses.bgHover} transition-colors`}
                >
                  Cancelar
                </button>
                <button
                  onClick={crearPlaylist}
                  disabled={!newPlaylistName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Crear Playlist
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para agregar música */}
        {showAddMusicModal && selectedPlaylistId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${themeClasses.bgCard} rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-medium ${themeClasses.text}`}>Agregar Música a la Playlist</h3>
                <button
                  onClick={() => {
                    setShowAddMusicModal(false);
                    setSelectedPlaylistId(null);
                    setSongSearchTerm('');
                  }}
                  className={`${themeClasses.textMuted} hover:${themeClasses.text} transition-colors`}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Buscar canciones..."
                  value={songSearchTerm}
                  onChange={(e) => setSongSearchTerm(e.target.value)}
                  className={`w-full ${themeClasses.inputBg} border ${themeClasses.inputBorder} rounded-lg px-3 py-2 pl-10 focus:ring-2 focus:ring-blue-400 outline-none ${themeClasses.text}`}
                />
                <MagnifyingGlassIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${themeClasses.textMuted}`} />
              </div>

              <div className="flex-1 overflow-y-auto">
                {availableSongs.length === 0 && (
                  <div className="text-center py-8">
                    <MusicalNoteIcon className={`h-12 w-12 ${themeClasses.textMuted} mx-auto mb-2`} />
                    <p className={themeClasses.textMuted}>No hay canciones disponibles</p>
                  </div>
                )}

                <div className="space-y-2">
                  {filteredAvailableSongs.map((song) => {
                    const isInPlaylist = songsInCurrentPlaylist.includes(song.id);
                    return (
                      <div key={song.id} className={`flex items-center justify-between p-3 border ${themeClasses.border} rounded-lg ${themeClasses.bgHover}`}>
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            {song.imagen_url ? (
                              <img src={song.imagen_url} alt={song.titulo} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <MusicalNoteIcon className="h-6 w-6 text-white" />
                            )}
                          </div>
                          <div>
                            <h4 className={`font-medium ${themeClasses.text}`}>{song.titulo}</h4>
                            <p className={`text-sm ${themeClasses.textMuted}`}>{song.artista}</p>
                            <p className={`text-xs ${themeClasses.textMuted}`}>{song.duracion}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => isInPlaylist 
                            ? quitarCancionDePlaylist(song.id, selectedPlaylistId!) 
                            : agregarCancionAPlaylist(song.id, selectedPlaylistId!)
                          }
                          className={`px-3 py-1 rounded-lg transition-colors ${
                            isInPlaylist 
                              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                              : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                          }`}
                        >
                          {isInPlaylist ? 'Quitar' : 'Agregar'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal para ver canciones de la playlist */}
        {showPlaylistDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${themeClasses.bgCard} rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-medium ${themeClasses.text}`}>Canciones de la Playlist</h3>
                <button
                  onClick={() => {
                    setShowPlaylistDetails(null);
                    setPlaylistSongs([]);
                  }}
                  className={`${themeClasses.textMuted} hover:${themeClasses.text} transition-colors`}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {playlistSongs.length === 0 && (
                  <div className="text-center py-8">
                    <MusicalNoteIcon className={`h-12 w-12 ${themeClasses.textMuted} mx-auto mb-2`} />
                    <p className={themeClasses.textMuted}>Esta playlist está vacía</p>
                    <button
                      onClick={() => {
                        setShowPlaylistDetails(null);
                        abrirModalAgregarMusica(showPlaylistDetails!);
                      }}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Agregar Canciones
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {playlistSongs.map((song, index) => (
                    <div key={song.id} className={`flex items-center justify-between p-3 border ${themeClasses.border} rounded-lg ${themeClasses.bgHover}`}>
                      <div className="flex items-center space-x-3">
                        <span className={`text-sm ${themeClasses.textMuted} w-6`}>{index + 1}</span>
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          {song.imagen_url ? (
                            <img src={song.imagen_url} alt={song.titulo} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <MusicalNoteIcon className="h-6 w-6 text-white" />
                          )}
                        </div>
                        <div>
                          <h4 className={`font-medium ${themeClasses.text}`}>{song.titulo}</h4>
                          <p className={`text-sm ${themeClasses.textMuted}`}>{song.artista}</p>
                          <p className={`text-xs ${themeClasses.textMuted}`}>{song.duracion}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Reproducir"
                        >
                          <PlayIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => eliminarCancionDePlaylist(song.id, showPlaylistDetails!)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar de playlist"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
