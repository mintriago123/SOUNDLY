'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useSupabase } from '@/components/SupabaseProvider';
import { ClipboardDocumentListIcon, PlusIcon, MagnifyingGlassIcon, MusicalNoteIcon, EllipsisVerticalIcon, PlayIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Playlist {
  id: string;
  nombre: string;
  descripcion?: string;
  usuario_id: string;
  es_publica: boolean;
  imagen_url?: string;
  created_at: string;
  canciones_count?: number;
}

interface Cancion {
  id: string;
  titulo: string;
  artista: string;
  album?: string;
  duracion: string;
  archivo_audio: string;
  imagen_url?: string;
}

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [showPlaylistMenu, setShowPlaylistMenu] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  // Estados para agregar música
  const [showAddMusicModal, setShowAddMusicModal] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [availableSongs, setAvailableSongs] = useState<Cancion[]>([]);
  const [playlistSongs, setPlaylistSongs] = useState<Cancion[]>([]);
  const [showPlaylistDetails, setShowPlaylistDetails] = useState<string | null>(null);
  const [songSearchTerm, setSongSearchTerm] = useState('');
  const [songsInCurrentPlaylist, setSongsInCurrentPlaylist] = useState<string[]>([]);
  
  const { supabase } = useSupabase();

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
    
    // Inicializar base de datos y cargar playlists
    initializeDatabase();
  }, []);

  useEffect(() => {
    if (user) {
      cargarPlaylists();
    }
  }, [user]);

  // Función para crear las tablas necesarias si no existen
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
            created_at timestamp with time zone DEFAULT now()
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
          created_at timestamp with time zone DEFAULT now(),
          UNIQUE(playlist_id, cancion_id)
        );
      `;
      
      const { error: playlistCancionesError } = await supabase.rpc('execute_sql', { sql: createPlaylistCancionesSQL });
      if (playlistCancionesError) {
        console.warn('No se pudo crear tabla playlist_canciones:', playlistCancionesError);
      }

      console.log('Base de datos inicializada');
      
      // Cargar playlists después de inicializar
      if (user) {
        cargarPlaylists();
      }
    } catch (error) {
      console.warn('Error inicializando base de datos:', error);
      setLoading(false);
    }
  };

  const cargarPlaylists = async () => {
    try {
      setLoading(true);
      
      // Verificar que hay usuario autenticado
      if (!user) {
        console.log('No hay usuario autenticado');
        setPlaylists([]);
        return;
      }

      // Cargar playlists desde Supabase con conteo de canciones
      const { data: playlistsData, error } = await supabase
        .from('playlists')
        .select(`
          id,
          nombre,
          descripcion,
          usuario_id,
          es_publica,
          imagen_url,
          created_at
        `)
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando playlists:', error);
        setPlaylists([]);
        return;
      }

      // Agregar conteo de canciones a cada playlist
      const playlistsWithCount = await Promise.all(
        (playlistsData || []).map(async (playlist) => {
          const { count } = await supabase
            .from('playlist_canciones')
            .select('*', { count: 'exact', head: true })
            .eq('playlist_id', playlist.id);
          
          return {
            ...playlist,
            canciones_count: count || 0
          };
        })
      );

      // Crear playlist virtual de "Favoritos"
      let favoritosCount = 0;
      try {
        const { count, error: favoritosError } = await supabase
          .from('favoritos')
          .select('*', { count: 'exact', head: true })
          .eq('usuario_id', user.id);
        
        if (favoritosError) {
          console.warn('Error contando favoritos:', favoritosError);
          console.warn('Código de error:', favoritosError.code);
          // Si la tabla no existe o no es accesible, usar 0
          favoritosCount = 0;
        } else {
          favoritosCount = count || 0;
        }
      } catch (error) {
        console.warn('Error verificando favoritos:', error);
        favoritosCount = 0;
      }

      const playlistFavoritos: Playlist = {
        id: 'favoritos-virtual',
        nombre: '❤️ Mis Favoritos',
        descripcion: 'Tus canciones favoritas',
        usuario_id: user.id,
        es_publica: false,
        created_at: new Date().toISOString(),
        canciones_count: favoritosCount
      };

      // Combinar playlist de favoritos con las playlists normales
      const todasLasPlaylists = [playlistFavoritos, ...playlistsWithCount];

      console.log('Playlists cargadas desde BD (incluyendo favoritos):', todasLasPlaylists);
      setPlaylists(todasLasPlaylists);
      
    } catch (error) {
      console.error('Error general cargando playlists:', error);
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar canciones que ya están en la playlist
  const cargarCancionesEnPlaylist = async (playlistId: string) => {
    try {
      // Si es la playlist virtual de favoritos
      if (playlistId === 'favoritos-virtual') {
        if (!user) {
          setSongsInCurrentPlaylist([]);
          return;
        }

        try {
          const { data: favoritos, error } = await supabase
            .from('favoritos')
            .select('cancion_id')
            .eq('usuario_id', user.id);

          if (error) {
            console.error('Error cargando favoritos para modal:', error);
            setSongsInCurrentPlaylist([]);
            return;
          }

          const cancionIds = favoritos?.map(item => item.cancion_id) || [];
          setSongsInCurrentPlaylist(cancionIds);
          console.log('Canciones favoritas en modal:', cancionIds.length);
        } catch (error) {
          console.error('Error general cargando favoritos para modal:', error);
          setSongsInCurrentPlaylist([]);
        }
        return;
      }

      // Para playlists normales
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
          
          // Intentar obtener el nombre del usuario/artista
          if (cancion.usuario_id) {
            try {
              const { data: usuario } = await supabase
                .from('usuarios')
                .select('nombre_usuario')
                .eq('id', cancion.usuario_id)
                .single();
              
              if (usuario?.nombre_usuario) {
                artista = usuario.nombre_usuario;
              }
            } catch (userError) {
              console.warn('Error obteniendo usuario:', userError);
            }
          }

          return {
            id: cancion.id,
            titulo: cancion.titulo,
            artista: artista,
            duracion: cancion.duracion || '0:00',
            archivo_audio: cancion.archivo_audio,
            imagen_url: cancion.imagen_url
          };
        })
      );

      console.log('Canciones formateadas:', cancionesFormateadas.length);
      setAvailableSongs(cancionesFormateadas);
      
    } catch (error) {
      console.error('Error general cargando canciones:', error);
      setAvailableSongs([]);
    }
  };

  // Función para cargar canciones de una playlist específica
  const cargarCancionesPlaylist = async (playlistId: string) => {
    try {
      console.log('Cargando canciones de playlist:', playlistId);
      
      // Si es la playlist virtual de favoritos, manejar diferente
      if (playlistId === 'favoritos-virtual') {
        return await cargarCancionesFavoritas();
      }
      
      // Primero obtener los IDs de las canciones en la playlist
      const { data: playlistCanciones, error: errorPlaylist } = await supabase
        .from('playlist_canciones')
        .select('cancion_id, posicion')
        .eq('playlist_id', playlistId)
        .order('posicion');

      if (errorPlaylist) {
        console.error('Error cargando canciones de playlist:', errorPlaylist);
        setPlaylistSongs([]);
        return;
      }

      if (!playlistCanciones || playlistCanciones.length === 0) {
        console.log('No hay canciones en esta playlist');
        setPlaylistSongs([]);
        return;
      }

      console.log('Canciones en playlist encontradas:', playlistCanciones.length);

      // Obtener los detalles de cada canción
      const cancionesFormateadas = await Promise.all(
        playlistCanciones.map(async (item) => {
          try {
            // Obtener detalles de la canción
            const { data: cancion, error: errorCancion } = await supabase
              .from('canciones')
              .select('*')
              .eq('id', item.cancion_id)
              .single();

            if (errorCancion || !cancion) {
              console.warn('Error obteniendo canción:', item.cancion_id, errorCancion);
              return null;
            }

            // Obtener nombre del artista
            let artista = 'Artista desconocido';
            if (cancion.usuario_id) {
              try {
                const { data: usuario } = await supabase
                  .from('usuarios')
                  .select('nombre_usuario')
                  .eq('id', cancion.usuario_id)
                  .single();
                
                if (usuario?.nombre_usuario) {
                  artista = usuario.nombre_usuario;
                }
              } catch (userError) {
                console.warn('Error obteniendo usuario para canción:', userError);
              }
            }

            return {
              id: cancion.id,
              titulo: cancion.titulo,
              artista: artista,
              duracion: cancion.duracion || '0:00',
              archivo_audio: cancion.archivo_audio,
              imagen_url: cancion.imagen_url
            };
          } catch (error) {
            console.error('Error procesando canción:', item.cancion_id, error);
            return null;
          }
        })
      );

      // Filtrar las canciones válidas
      const cancionesValidas = cancionesFormateadas.filter(cancion => cancion !== null);
      console.log('Canciones válidas cargadas:', cancionesValidas.length);
      
      setPlaylistSongs(cancionesValidas);
      
    } catch (error) {
      console.error('Error general cargando canciones de playlist:', error);
      setPlaylistSongs([]);
    }
  };

  // Función específica para cargar canciones favoritas
  const cargarCancionesFavoritas = async () => {
    try {
      if (!user) {
        console.log('No hay usuario para cargar favoritos');
        setPlaylistSongs([]);
        return;
      }

      console.log('Cargando canciones favoritas del usuario:', user.id);

      // Obtener las canciones favoritas del usuario directamente
      const { data: favoritos, error: errorFavoritos } = await supabase
        .from('favoritos')
        .select('cancion_id, fecha_agregada')
        .eq('usuario_id', user.id)
        .order('fecha_agregada', { ascending: false });

      if (errorFavoritos) {
        console.error('Error cargando favoritos:', errorFavoritos);
        console.error('Código de error:', errorFavoritos.code);
        console.error('Mensaje de error:', errorFavoritos.message);
        
        // Si el error indica que la tabla no existe o no hay acceso, mostrar lista vacía
        if (errorFavoritos.code === '42P01' || errorFavoritos.message?.includes('does not exist')) {
          console.log('La tabla favoritos no existe o no es accesible, mostrando lista vacía');
        }
        
        setPlaylistSongs([]);
        return;
      }

      if (!favoritos || favoritos.length === 0) {
        console.log('No hay canciones favoritas');
        setPlaylistSongs([]);
        return;
      }

      console.log('Favoritos encontrados:', favoritos.length);

      // Obtener los detalles de cada canción favorita
      const cancionesFormateadas = await Promise.all(
        favoritos.map(async (item) => {
          try {
            // Obtener detalles de la canción
            const { data: cancion, error: errorCancion } = await supabase
              .from('canciones')
              .select('*')
              .eq('id', item.cancion_id)
              .single();

            if (errorCancion || !cancion) {
              console.warn('Error obteniendo canción favorita:', item.cancion_id, errorCancion);
              return null;
            }

            // Obtener nombre del artista
            let artista = 'Artista desconocido';
            if (cancion.usuario_subida_id) {
              try {
                const { data: usuario } = await supabase
                  .from('usuarios')
                  .select('nombre')
                  .eq('id', cancion.usuario_subida_id)
                  .single();
                
                if (usuario?.nombre) {
                  artista = usuario.nombre;
                }
              } catch (userError) {
                console.warn('Error obteniendo usuario para canción favorita:', userError);
              }
            }

            return {
              id: cancion.id,
              titulo: cancion.titulo,
              artista: artista,
              duracion: cancion.duracion ? `${Math.floor(cancion.duracion / 60)}:${(cancion.duracion % 60).toString().padStart(2, '0')}` : '0:00',
              archivo_audio: cancion.archivo_audio_url,
              imagen_url: cancion.imagen_url
            };
          } catch (error) {
            console.error('Error procesando canción favorita:', item.cancion_id, error);
            return null;
          }
        })
      );

      // Filtrar las canciones válidas
      const cancionesValidas = cancionesFormateadas.filter(cancion => cancion !== null);
      console.log('Canciones favoritas válidas cargadas:', cancionesValidas.length);
      
      setPlaylistSongs(cancionesValidas);
      
    } catch (error) {
      console.error('Error general cargando canciones favoritas:', error);
      setPlaylistSongs([]);
    }
  };

  // Función para agregar canción a playlist
  const agregarCancionAPlaylist = async (cancionId: string, playlistId: string) => {
    try {
      // Si es la playlist virtual de favoritos
      if (playlistId === 'favoritos-virtual') {
        return await agregarAFavoritos(cancionId);
      }

      // Verificar si la canción ya está en la playlist
      const { data: existe, error: errorExiste } = await supabase
        .from('playlist_canciones')
        .select('id')
        .eq('playlist_id', playlistId)
        .eq('cancion_id', cancionId)
        .single();

      if (existe) {
        alert('Esta canción ya está en la playlist');
        return;
      }

      // Obtener la siguiente posición
      const { count } = await supabase
        .from('playlist_canciones')
        .select('*', { count: 'exact', head: true })
        .eq('playlist_id', playlistId);

      // Insertar la canción en la playlist
      const { error } = await supabase
        .from('playlist_canciones')
        .insert([{
          playlist_id: playlistId,
          cancion_id: cancionId,
          posicion: (count || 0) + 1
        }]);

      if (error) {
        console.error('Error agregando canción a playlist:', error);
        alert('Error al agregar la canción a la playlist');
        return;
      }

      console.log('Canción agregada exitosamente');
      
      // Actualizar la lista de canciones en la playlist actual
      setSongsInCurrentPlaylist(prev => [...prev, cancionId]);
      
      // Recargar las canciones de la playlist si está siendo visualizada
      if (showPlaylistDetails === playlistId) {
        cargarCancionesPlaylist(playlistId);
      }
      
      // Recargar las playlists para actualizar el conteo
      cargarPlaylists();
      
    } catch (error) {
      console.error('Error general agregando canción:', error);
      alert('Error al agregar la canción a la playlist');
    }
  };

  // Función para agregar canción a favoritos
  const agregarAFavoritos = async (cancionId: string) => {
    try {
      if (!user) {
        alert('Debes estar autenticado para agregar favoritos');
        return;
      }

      console.log('Agregando canción a favoritos:', cancionId);

      // Verificar si ya está en favoritos
      const { data: existe, error: errorExiste } = await supabase
        .from('favoritos')
        .select('id')
        .eq('usuario_id', user.id)
        .eq('cancion_id', cancionId)
        .maybeSingle();

      if (errorExiste) {
        console.error('Error verificando favorito existente:', errorExiste);
        alert('Error al verificar favoritos');
        return;
      }

      if (existe) {
        alert('Esta canción ya está en tus favoritos');
        return;
      }

      // Agregar a favoritos
      const { error } = await supabase
        .from('favoritos')
        .insert([{
          usuario_id: user.id,
          cancion_id: cancionId
        }]);

      if (error) {
        console.error('Error agregando a favoritos:', error);
        alert('Error al agregar la canción a favoritos');
        return;
      }

      console.log('Canción agregada a favoritos exitosamente');
      
      // Actualizar la lista de canciones en favoritos
      setSongsInCurrentPlaylist(prev => [...prev, cancionId]);
      
      // Recargar las canciones si estamos viendo favoritos
      if (showPlaylistDetails === 'favoritos-virtual') {
        cargarCancionesFavoritas();
      }
      
      // Recargar las playlists para actualizar el conteo
      cargarPlaylists();
      
    } catch (error) {
      console.error('Error general agregando a favoritos:', error);
      alert('Error al agregar la canción a favoritos');
    }
  };

  // Función para quitar canción de playlist (desde el modal de agregar música)
  const quitarCancionDePlaylist = async (cancionId: string, playlistId: string) => {
    try {
      // Si es la playlist virtual de favoritos
      if (playlistId === 'favoritos-virtual') {
        return await quitarDeFavoritos(cancionId);
      }

      const { error } = await supabase
        .from('playlist_canciones')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('cancion_id', cancionId);

      if (error) {
        console.error('Error quitando canción de playlist:', error);
        alert('Error al quitar la canción de la playlist');
        return;
      }

      console.log('Canción quitada exitosamente');
      
      // Actualizar la lista de canciones en la playlist actual
      setSongsInCurrentPlaylist(prev => prev.filter(id => id !== cancionId));
      
      // Recargar las canciones de la playlist si está siendo visualizada
      if (showPlaylistDetails === playlistId) {
        cargarCancionesPlaylist(playlistId);
      }
      
      // Recargar las playlists para actualizar el conteo
      cargarPlaylists();
      
    } catch (error) {
      console.error('Error general quitando canción:', error);
      alert('Error al quitar la canción de la playlist');
    }
  };

  // Función para quitar canción de favoritos
  const quitarDeFavoritos = async (cancionId: string) => {
    try {
      if (!user) {
        alert('Debes estar autenticado para quitar favoritos');
        return;
      }

      console.log('Quitando canción de favoritos:', cancionId);

      const { error } = await supabase
        .from('favoritos')
        .delete()
        .eq('usuario_id', user.id)
        .eq('cancion_id', cancionId);

      if (error) {
        console.error('Error quitando de favoritos:', error);
        alert('Error al quitar la canción de favoritos');
        return;
      }

      console.log('Canción quitada de favoritos exitosamente');
      
      // Actualizar la lista de canciones en favoritos
      setSongsInCurrentPlaylist(prev => prev.filter(id => id !== cancionId));
      
      // Recargar las canciones si estamos viendo favoritos
      if (showPlaylistDetails === 'favoritos-virtual') {
        cargarCancionesFavoritas();
      }
      
      // Recargar las playlists para actualizar el conteo
      cargarPlaylists();
      
    } catch (error) {
      console.error('Error general quitando de favoritos:', error);
      alert('Error al quitar la canción de favoritos');
    }
  };

  // Función para eliminar canción de playlist
  const eliminarCancionDePlaylist = async (cancionId: string, playlistId: string) => {
    try {
      // Si es la playlist virtual de favoritos
      if (playlistId === 'favoritos-virtual') {
        return await quitarDeFavoritos(cancionId);
      }

      const { error } = await supabase
        .from('playlist_canciones')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('cancion_id', cancionId);

      if (error) {
        console.error('Error eliminando canción de playlist:', error);
        alert('Error al eliminar la canción de la playlist');
        return;
      }

      console.log('Canción eliminada exitosamente');
      
      // Actualizar el estado de canciones en la playlist actual si está abierto el modal
      if (selectedPlaylistId === playlistId) {
        setSongsInCurrentPlaylist(prev => prev.filter(id => id !== cancionId));
      }
      
      // Recargar las canciones de la playlist
      cargarCancionesPlaylist(playlistId);
      
      // Recargar las playlists para actualizar el conteo
      cargarPlaylists();
      
    } catch (error) {
      console.error('Error general eliminando canción:', error);
      alert('Error al eliminar la canción de la playlist');
    }
  };

  // Función para abrir modal de agregar música
  const abrirModalAgregarMusica = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setShowAddMusicModal(true);
    cargarCancionesDisponibles();
    cargarCancionesEnPlaylist(playlistId);
  };

  // Función para ver detalles de playlist
  const verDetallesPlaylist = (playlistId: string) => {
    setShowPlaylistDetails(playlistId);
    cargarCancionesPlaylist(playlistId);
  };

  const crearPlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    
    if (!user) {
      console.error('Usuario no autenticado');
      return;
    }

    try {
      // Crear nueva playlist en Supabase
      const { data, error } = await supabase
        .from('playlists')
        .insert([{
          nombre: newPlaylistName.trim(),
          descripcion: newPlaylistDescription.trim() || null,
          usuario_id: user.id,
          es_publica: false
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creando playlist:', error);
        alert('Error al crear la playlist. Por favor intenta de nuevo.');
        return;
      }

      if (data) {
        // Agregar la nueva playlist al estado
        setPlaylists(prev => [data, ...prev]);
        console.log('Playlist creada exitosamente:', data);
        
        // Limpiar formulario
        setNewPlaylistName('');
        setNewPlaylistDescription('');
        setShowCreateModal(false);
      }
      
    } catch (error) {
      console.error('Error general creando playlist:', error);
      alert('Error al crear la playlist. Por favor intenta de nuevo.');
    }
  };

  const eliminarPlaylist = async (playlistId: string) => {
    // No permitir eliminar la playlist virtual de favoritos
    if (playlistId === 'favoritos-virtual') {
      alert('No puedes eliminar la playlist de favoritos');
      return;
    }

    if (!confirm('¿Estás seguro de que quieres eliminar esta playlist?')) return;

    if (!user) {
      console.error('Usuario no autenticado');
      return;
    }

    try {
      // Eliminar de Supabase
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId);

      if (error) {
        console.error('Error eliminando playlist:', error);
        alert('Error al eliminar la playlist. Por favor intenta de nuevo.');
        return;
      }

      // Actualizar estado local
      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
      setShowPlaylistMenu(null);
      console.log('Playlist eliminada exitosamente');
      
    } catch (error) {
      console.error('Error general eliminando playlist:', error);
      alert('Error al eliminar la playlist. Por favor intenta de nuevo.');
    }
  };

  const filteredPlaylists = playlists.filter(playlist =>
    playlist.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    playlist.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAvailableSongs = availableSongs.filter(song => 
    song.titulo.toLowerCase().includes(songSearchTerm.toLowerCase()) ||
    song.artista.toLowerCase().includes(songSearchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className={`${themeClasses.bgCard} rounded-lg shadow p-6`}>
          <div className="flex items-center space-x-3 mb-4">
            <ClipboardDocumentListIcon className={`h-8 w-8 ${themeClasses.text}`} />
            <h2 className={`text-2xl font-bold ${themeClasses.text}`}>
              Mis Playlists 🎵
            </h2>
          </div>
          <p className={themeClasses.textSecondary}>
            Organiza tu música en listas de reproducción personalizadas
          </p>
        </div>

        {/* Controles */}
        <div className={`${themeClasses.bgCard} rounded-lg shadow p-6`}>
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex gap-4">
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Nueva Playlist</span>
              </button>
              <button className={`border ${themeClasses.border} ${themeClasses.text} px-4 py-2 rounded-lg ${themeClasses.bgHover} transition-colors`}>
                📥 Importar
              </button>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar playlists..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${themeClasses.inputBg} border ${themeClasses.inputBorder} rounded-lg px-3 py-2 pl-10 w-64 focus:ring-2 focus:ring-blue-400 outline-none ${themeClasses.text}`}
                />
                <MagnifyingGlassIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${themeClasses.textMuted}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Playlists */}
        <div className={`${themeClasses.bgCard} rounded-lg shadow`}>
          <div className={`p-6 border-b ${themeClasses.border}`}>
            <div className="flex justify-between items-center">
              <h3 className={`text-lg font-medium ${themeClasses.text}`}>
                Tus Playlists ({filteredPlaylists.length})
              </h3>
              <div className="flex gap-2">
                <button className={`${themeClasses.textMuted} hover:${themeClasses.text} transition-colors`}>📊</button>
                <button className={`${themeClasses.textMuted} hover:${themeClasses.text} transition-colors`}>⚙️</button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className={themeClasses.textMuted}>Cargando playlists...</p>
              </div>
            )}

            {!loading && filteredPlaylists.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎼</div>
                <h4 className={`text-xl font-medium mb-2 ${themeClasses.text}`}>
                  {searchTerm ? 'No se encontraron playlists' : 'No tienes playlists aún'}
                </h4>
                <p className={`${themeClasses.textMuted} mb-6`}>
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Crea tu primera playlist para organizar tu música'}
                </p>
                {!searchTerm && (
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
                  >
                    <PlusIcon className="h-5 w-5" />
                    <span>Crear Primera Playlist</span>
                  </button>
                )}
              </div>
            )}

            {!loading && filteredPlaylists.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPlaylists.map((playlist) => (
                  <div key={playlist.id} className={`playlist-card ${themeClasses.bgHover} border ${themeClasses.border} rounded-lg p-4 transition-colors group relative`}>
                    {/* Menú de opciones */}
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => setShowPlaylistMenu(showPlaylistMenu === playlist.id ? null : playlist.id)}
                        className={`${themeClasses.textMuted} hover:${themeClasses.text} p-2 rounded-full hover:bg-gray-100 transition-colors`}
                        title="Opciones de playlist"
                      >
                        <EllipsisVerticalIcon className="h-5 w-5" />
                      </button>
                      {showPlaylistMenu === playlist.id && (
                        <div className={`absolute right-0 mt-2 w-48 ${themeClasses.bgCard} rounded-md shadow-lg border ${themeClasses.border} z-10`}>
                          <div className="py-1">
                            <button 
                              onClick={() => verDetallesPlaylist(playlist.id)}
                              className={`flex items-center space-x-2 w-full text-left px-4 py-2 text-sm ${themeClasses.text} ${themeClasses.bgHover}`}
                            >
                              <PlayIcon className="h-4 w-4" />
                              <span>Ver canciones</span>
                            </button>
                            <button 
                              onClick={() => abrirModalAgregarMusica(playlist.id)}
                              className={`flex items-center space-x-2 w-full text-left px-4 py-2 text-sm ${themeClasses.text} ${themeClasses.bgHover}`}
                            >
                              <PlusIcon className="h-4 w-4" />
                              <span>{playlist.id === 'favoritos-virtual' ? 'Gestionar favoritos' : 'Agregar música'}</span>
                            </button>
                            {playlist.id !== 'favoritos-virtual' && (
                              <>
                                <button className={`flex items-center space-x-2 w-full text-left px-4 py-2 text-sm ${themeClasses.text} ${themeClasses.bgHover}`}>
                                  <PencilIcon className="h-4 w-4" />
                                  <span>Editar</span>
                                </button>
                                <button 
                                  onClick={() => eliminarPlaylist(playlist.id)}
                                  className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                  <span>Eliminar</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Imagen de playlist */}
                    <div className="w-full h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-4 flex items-center justify-center">
                      {playlist.id === 'favoritos-virtual' ? (
                        <div className="text-4xl">❤️</div>
                      ) : playlist.imagen_url ? (
                        <img src={playlist.imagen_url} alt={playlist.nombre} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <MusicalNoteIcon className="h-12 w-12 text-white" />
                      )}
                    </div>

                    {/* Información de playlist */}
                    <div>
                      <h4 className={`font-medium ${themeClasses.text} mb-1 pr-8`}>{playlist.nombre}</h4>
                      {playlist.descripcion && (
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
            <div className={`${themeClasses.bgCard} rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-medium ${themeClasses.text}`}>
                  {selectedPlaylistId === 'favoritos-virtual' ? 'Gestionar Favoritos' : 'Agregar Música a Playlist'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddMusicModal(false);
                    setSongsInCurrentPlaylist([]);
                  }}
                  className={`${themeClasses.textMuted} hover:${themeClasses.text}`}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              {/* Buscador de canciones */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar canciones..."
                    value={songSearchTerm}
                    onChange={(e) => setSongSearchTerm(e.target.value)}
                    className={`w-full ${themeClasses.inputBg} border ${themeClasses.inputBorder} rounded-lg px-3 py-2 pl-10 focus:ring-2 focus:ring-blue-400 outline-none ${themeClasses.text}`}
                  />
                  <MagnifyingGlassIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${themeClasses.textMuted}`} />
                </div>
              </div>

              {/* Lista de canciones disponibles */}
              <div className="max-h-96 overflow-y-auto">
                {filteredAvailableSongs.length === 0 ? (
                  <div className="text-center py-8">
                    <MusicalNoteIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className={themeClasses.textMuted}>
                      {availableSongs.length === 0 
                        ? 'No hay canciones disponibles en la plataforma' 
                        : 'No se encontraron canciones con ese término de búsqueda'
                      }
                    </p>
                    {availableSongs.length === 0 && (
                      <p className={`text-xs ${themeClasses.textMuted} mt-2`}>
                        Asegúrate de que haya música subida en la plataforma
                      </p>
                    )}
                  </div>
                ) : (
                  filteredAvailableSongs.map((song) => {
                    const isInPlaylist = songsInCurrentPlaylist.includes(song.id);
                    
                    return (
                      <div key={song.id} className={`flex items-center justify-between p-3 border-b ${themeClasses.border} last:border-b-0`}>
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
                        
                        {isInPlaylist ? (
                          <button
                            onClick={() => quitarCancionDePlaylist(song.id, selectedPlaylistId!)}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors flex items-center space-x-1"
                          >
                            <TrashIcon className="h-4 w-4" />
                            <span>Quitar</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => agregarCancionAPlaylist(song.id, selectedPlaylistId!)}
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors flex items-center space-x-1"
                          >
                            <PlusIcon className="h-4 w-4" />
                            <span>Agregar</span>
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal para ver detalles de playlist */}
        {showPlaylistDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${themeClasses.bgCard} rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[80vh] overflow-hidden`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-medium ${themeClasses.text}`}>
                  {showPlaylistDetails === 'favoritos-virtual' ? 'Mis Canciones Favoritas' : 'Canciones en Playlist'}
                </h3>
                <button
                  onClick={() => setShowPlaylistDetails(null)}
                  className={`${themeClasses.textMuted} hover:${themeClasses.text}`}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              {/* Lista de canciones en la playlist */}
              <div className="max-h-96 overflow-y-auto">
                {playlistSongs.length === 0 ? (
                  <div className="text-center py-8">
                    <MusicalNoteIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className={themeClasses.textMuted}>
                      {showPlaylistDetails === 'favoritos-virtual' 
                        ? 'No tienes canciones favoritas aún' 
                        : 'No hay canciones en esta playlist'
                      }
                    </p>
                    <button
                      onClick={() => {
                        setShowPlaylistDetails(null);
                        abrirModalAgregarMusica(showPlaylistDetails!);
                      }}
                      className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                      {showPlaylistDetails === 'favoritos-virtual' 
                        ? 'Agregar favoritos' 
                        : 'Agregar canciones'
                      }
                    </button>
                  </div>
                ) : (
                  playlistSongs.map((song, index) => (
                    <div key={song.id} className={`flex items-center justify-between p-3 border-b ${themeClasses.border} last:border-b-0`}>
                      <div className="flex items-center space-x-3">
                        <span className={`text-sm ${themeClasses.textMuted} w-8`}>{index + 1}</span>
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
                        onClick={() => eliminarCancionDePlaylist(song.id, showPlaylistDetails!)}
                        className="text-red-600 hover:text-red-800 px-2 py-1 rounded transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              
              {playlistSongs.length > 0 && (
                <div className="mt-4 flex justify-between">
                  <button
                    onClick={() => {
                      setShowPlaylistDetails(null);
                      abrirModalAgregarMusica(showPlaylistDetails!);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                  >
                    {showPlaylistDetails === 'favoritos-virtual' 
                      ? 'Gestionar más favoritos' 
                      : 'Agregar más canciones'
                    }
                  </button>
                  <div className={`text-sm ${themeClasses.textMuted}`}>
                    Total: {playlistSongs.length} canciones
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
