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

  // Tema oscuro
  const themeClasses = {
    bg: 'bg-gray-900',
    bgCard: 'bg-gray-800',
    text: 'text-white',
    textMuted: 'text-gray-400',
    border: 'border-gray-700',
    hover: 'hover:bg-gray-700',
    button: 'bg-blue-600 hover:bg-blue-500 text-white',
    buttonSecondary: 'bg-gray-700 hover:bg-gray-600 text-white',
    input: 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
  };

  useEffect(() => {
    cargarPlaylists();
    obtenerUsuario();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.menu-dropdown')) {
        setMenuAbiertoId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const obtenerUsuario = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error al obtener usuario:', error);
    }
  };

  const cargarPlaylists = async () => {
    try {
      setCargando(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('playlists')
        .select(`
          id,
          nombre,
          descripcion,
          es_publica,
          imagen_url,
          created_at,
          numero_canciones,
          duracion_total
        `)
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error al cargar playlists:', error);
        setMensaje('Error al cargar las playlists');
        return;
      }

      setPlaylists(data || []);
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error al cargar las playlists');
    } finally {
      setCargando(false);
    }
  };

  const toggleMenu = (playlistId: string) => {
    setMenuAbiertoId(menuAbiertoId === playlistId ? null : playlistId);
  };

  const editarPlaylist = (playlist: Playlist) => {
    setPlaylistEditando(playlist);
    setNombrePlaylist(playlist.nombre);
    setDescripcionPlaylist(playlist.descripcion || '');
    setEsPublica(playlist.es_publica);
    setMostrarModalEditar(true);
    setMenuAbiertoId(null);
  };

  const eliminarPlaylist = (playlist: Playlist) => {
    setPlaylistEditando(playlist);
    setMostrarModalEliminar(true);
    setMenuAbiertoId(null);
  };

  const togglePrivacidad = async (playlist: Playlist) => {
    try {
      const { error } = await supabase
        .from('playlists')
        .update({ es_publica: !playlist.es_publica })
        .eq('id', playlist.id);

      if (error) {
        console.error('Error al cambiar privacidad:', error);
        setMensaje('Error al cambiar la privacidad');
        return;
      }

      setMensaje(playlist.es_publica ? 'Playlist marcada como privada' : 'Playlist marcada como pública');
      cargarPlaylists();
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error al cambiar la privacidad');
    }
    setMenuAbiertoId(null);
  };

  const compartirPlaylist = async (playlist: Playlist) => {
    try {
      const url = `${window.location.origin}/playlist/${playlist.id}`;
      await navigator.clipboard.writeText(url);
      setMensaje('Enlace copiado al portapapeles');
    } catch (error) {
      console.error('Error al copiar enlace:', error);
      setMensaje('Error al copiar el enlace');
    }
    setMenuAbiertoId(null);
  };

  const crearPlaylist = async () => {
    if (!nombrePlaylist.trim()) {
      setMensaje('El nombre de la playlist es obligatorio');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { error } = await supabase
        .from('playlists')
        .insert({
          nombre: nombrePlaylist.trim(),
          descripcion: descripcionPlaylist.trim() || null,
          es_publica: esPublica,
          usuario_id: user.id,
          numero_canciones: 0,
          duracion_total: 0
        });

      if (error) {
        console.error('Error al crear playlist:', error);
        setMensaje('Error al crear la playlist');
        return;
      }

      setMensaje('Playlist creada exitosamente');
      setMostrarModalCrear(false);
      setNombrePlaylist('');
      setDescripcionPlaylist('');
      setEsPublica(false);
      cargarPlaylists();
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error al crear la playlist');
    }
  };

  const confirmarEditarPlaylist = async () => {
    if (!nombrePlaylist.trim() || !playlistEditando) {
      setMensaje('El nombre de la playlist es obligatorio');
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
        .eq('id', playlistEditando.id);

      if (error) {
        console.error('Error al editar playlist:', error);
        setMensaje('Error al editar la playlist');
        return;
      }

      setMensaje('Playlist editada exitosamente');
      setMostrarModalEditar(false);
      setPlaylistEditando(null);
      setNombrePlaylist('');
      setDescripcionPlaylist('');
      setEsPublica(false);
      cargarPlaylists();
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error al editar la playlist');
    }
  };

  const confirmarEliminarPlaylist = async () => {
    if (!playlistEditando) return;

    try {
      // Primero eliminar las canciones de la playlist
      const { error: errorCanciones } = await supabase
        .from('playlist_canciones')
        .delete()
        .eq('playlist_id', playlistEditando.id);

      if (errorCanciones) {
        console.error('Error al eliminar canciones:', errorCanciones);
        setMensaje('Error al eliminar las canciones de la playlist');
        return;
      }

      // Luego eliminar la playlist
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistEditando.id);

      if (error) {
        console.error('Error al eliminar playlist:', error);
        setMensaje('Error al eliminar la playlist');
        return;
      }

      setMensaje('Playlist eliminada exitosamente');
      setMostrarModalEliminar(false);
      setPlaylistEditando(null);
      cargarPlaylists();
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error al eliminar la playlist');
    }
  };

  const playlistsFiltradas = playlists.filter(playlist =>
    playlist.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase())
  );

  const formatearDuracion = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    
    if (horas > 0) {
      return `${horas}h ${minutos}m`;
    }
    return `${minutos}m`;
  };

  return (
    <DashboardLayout>
      <div className={`min-h-screen ${themeClasses.bg}`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className={`text-3xl font-bold ${themeClasses.text}`}>Mis Playlists</h1>
              <p className={`${themeClasses.textMuted} mt-1`}>
                Gestiona tus playlists personalizadas
              </p>
            </div>
            
            <button
              onClick={() => setMostrarModalCrear(true)}
              className={`inline-flex items-center px-4 py-2 rounded-lg ${themeClasses.button} transition-colors`}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nueva Playlist
            </button>
          </div>

          {/* Barra de búsqueda */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className={`h-5 w-5 ${themeClasses.textMuted}`} />
            </div>
            <input
              type="text"
              placeholder="Buscar playlists..."
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              className={`block w-full pl-10 pr-3 py-2 border rounded-lg ${themeClasses.input} ${themeClasses.border} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>

          {/* Mensaje */}
          {mensaje && (
            <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg">
              {mensaje}
            </div>
          )}

          {/* Lista de playlists */}
          {cargando ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : playlistsFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <MusicalNoteIcon className={`mx-auto h-12 w-12 ${themeClasses.textMuted}`} />
              <h3 className={`mt-2 text-sm font-medium ${themeClasses.text}`}>
                {terminoBusqueda ? 'No se encontraron playlists' : 'No tienes playlists'}
              </h3>
              <p className={`mt-1 text-sm ${themeClasses.textMuted}`}>
                {terminoBusqueda ? 'Intenta con otro término de búsqueda' : 'Comienza creando tu primera playlist'}
              </p>
              {!terminoBusqueda && (
                <div className="mt-6">
                  <button
                    onClick={() => setMostrarModalCrear(true)}
                    className={`inline-flex items-center px-4 py-2 rounded-lg ${themeClasses.button} transition-colors`}
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Nueva Playlist
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {playlistsFiltradas.map((playlist) => (
                <div
                  key={playlist.id}
                  className={`${themeClasses.bgCard} rounded-lg overflow-hidden shadow-sm ${themeClasses.hover} transition-colors group cursor-pointer`}
                >
                  {/* Imagen de la playlist */}
                  <div className="aspect-square bg-gradient-to-br from-purple-500 to-pink-500 relative">
                    {playlist.imagen_url ? (
                      <img
                        src={playlist.imagen_url}
                        alt={playlist.nombre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MusicalNoteIcon className="h-16 w-16 text-white/70" />
                      </div>
                    )}
                    
                    {/* Botón de reproducir */}
                    <button
                      onClick={() => router.push(`/usuario/playlist/${playlist.id}`)}
                      className="absolute bottom-2 right-2 bg-green-500 hover:bg-green-400 text-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <PlayIcon className="h-6 w-6 ml-0.5" />
                    </button>
                  </div>

                  {/* Información de la playlist */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 
                          className={`font-medium ${themeClasses.text} truncate cursor-pointer hover:underline`}
                          onClick={() => router.push(`/usuario/playlist/${playlist.id}`)}
                        >
                          {playlist.nombre}
                        </h3>
                        {playlist.descripcion && (
                          <p className={`text-sm ${themeClasses.textMuted} mb-2 line-clamp-2`}>
                            {playlist.descripcion}
                          </p>
                        )}
                        <div className={`text-xs ${themeClasses.textMuted} space-y-1`}>
                          <p>{playlist.numero_canciones || 0} canciones</p>
                          <p>
                            {playlist.es_publica ? '🌍 Pública' : '🔒 Privada'} • 
                            {new Date(playlist.created_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>

                      {/* Menú de opciones */}
                      <div className="relative menu-dropdown">
                        <button
                          onClick={() => toggleMenu(playlist.id)}
                          className={`p-1 rounded-full ${themeClasses.hover} transition-colors`}
                        >
                          <EllipsisVerticalIcon className={`h-5 w-5 ${themeClasses.textMuted}`} />
                        </button>

                        {menuAbiertoId === playlist.id && (
                          <div className={`absolute right-0 top-8 w-48 ${themeClasses.bgCard} rounded-lg shadow-lg border ${themeClasses.border} z-10`}>
                            <div className="py-1">
                              <button
                                onClick={() => editarPlaylist(playlist)}
                                className={`flex items-center w-full px-4 py-2 text-sm ${themeClasses.text} ${themeClasses.hover} transition-colors`}
                              >
                                <PencilIcon className="h-4 w-4 mr-3" />
                                Editar
                              </button>
                              
                              <button
                                onClick={() => togglePrivacidad(playlist)}
                                className={`flex items-center w-full px-4 py-2 text-sm ${themeClasses.text} ${themeClasses.hover} transition-colors`}
                              >
                                {playlist.es_publica ? (
                                  <>
                                    <EyeSlashIcon className="h-4 w-4 mr-3" />
                                    Hacer privada
                                  </>
                                ) : (
                                  <>
                                    <EyeIcon className="h-4 w-4 mr-3" />
                                    Hacer pública
                                  </>
                                )}
                              </button>
                              
                              <button
                                onClick={() => compartirPlaylist(playlist)}
                                className={`flex items-center w-full px-4 py-2 text-sm ${themeClasses.text} ${themeClasses.hover} transition-colors`}
                              >
                                <ShareIcon className="h-4 w-4 mr-3" />
                                Compartir
                              </button>
                              
                              <div className={`border-t ${themeClasses.border} my-1`}></div>
                              
                              <button
                                onClick={() => eliminarPlaylist(playlist)}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <TrashIcon className="h-4 w-4 mr-3" />
                                Eliminar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de creación */}
        {mostrarModalCrear && (
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
                    value={nombrePlaylist}
                    onChange={(e) => setNombrePlaylist(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg ${themeClasses.input} ${themeClasses.border} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Ingresa el nombre de la playlist"
                  />
                </div>

                <div>
                  <label htmlFor="playlist-description" className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                    Descripción (opcional)
                  </label>
                  <textarea
                    id="playlist-description"
                    value={descripcionPlaylist}
                    onChange={(e) => setDescripcionPlaylist(e.target.value)}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg ${themeClasses.input} ${themeClasses.border} focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
                    placeholder="Describe tu playlist"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="is-public"
                    type="checkbox"
                    checked={esPublica}
                    onChange={(e) => setEsPublica(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is-public" className={`ml-2 text-sm ${themeClasses.text}`}>
                    Hacer pública
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
                  className={`px-4 py-2 text-sm font-medium rounded-lg ${themeClasses.buttonSecondary} transition-colors`}
                >
                  Cancelar
                </button>
                <button
                  onClick={crearPlaylist}
                  className={`px-4 py-2 text-sm font-medium rounded-lg ${themeClasses.button} transition-colors`}
                >
                  Crear Playlist
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de edición */}
        {mostrarModalEditar && playlistEditando && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${themeClasses.bgCard} rounded-lg p-6 w-full max-w-md mx-4`}>
              <h3 className={`text-lg font-medium ${themeClasses.text} mb-4`}>Editar Playlist</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-playlist-name" className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                    Nombre de la playlist *
                  </label>
                  <input
                    id="edit-playlist-name"
                    type="text"
                    value={nombrePlaylist}
                    onChange={(e) => setNombrePlaylist(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg ${themeClasses.input} ${themeClasses.border} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Ingresa el nombre de la playlist"
                  />
                </div>

                <div>
                  <label htmlFor="edit-playlist-description" className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                    Descripción (opcional)
                  </label>
                  <textarea
                    id="edit-playlist-description"
                    value={descripcionPlaylist}
                    onChange={(e) => setDescripcionPlaylist(e.target.value)}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg ${themeClasses.input} ${themeClasses.border} focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
                    placeholder="Describe tu playlist"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="edit-is-public"
                    type="checkbox"
                    checked={esPublica}
                    onChange={(e) => setEsPublica(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="edit-is-public" className={`ml-2 text-sm ${themeClasses.text}`}>
                    Hacer pública
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
                  className={`px-4 py-2 text-sm font-medium rounded-lg ${themeClasses.buttonSecondary} transition-colors`}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarEditarPlaylist}
                  className={`px-4 py-2 text-sm font-medium rounded-lg ${themeClasses.button} transition-colors`}
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de eliminación */}
        {mostrarModalEliminar && playlistEditando && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${themeClasses.bgCard} rounded-lg p-6 w-full max-w-md mx-4`}>
              <h3 className={`text-lg font-medium ${themeClasses.text} mb-4`}>Eliminar Playlist</h3>
              <p className={`${themeClasses.textMuted} mb-6`}>
                ¿Estás seguro de que quieres eliminar la playlist "{playlistEditando.nombre}"? 
                Esta acción no se puede deshacer y se eliminarán todas las canciones de la playlist.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setMostrarModalEliminar(false);
                    setPlaylistEditando(null);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg ${themeClasses.buttonSecondary} transition-colors`}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarEliminarPlaylist}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors"
                >
                  Eliminar Playlist
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
