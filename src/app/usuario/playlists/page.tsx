'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useSupabase } from '@/components/SupabaseProvider';
import { ClipboardDocumentListIcon, PlusIcon, MagnifyingGlassIcon, MusicalNoteIcon, EllipsisVerticalIcon, PlayIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Playlist {
  id: string;
  nombre: string;
  descripcion?: string;
  usuario_id: string;
  es_publica: boolean;
  imagen_url?: string;
  created_at: string;
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

      // Cargar playlists desde Supabase con información adicional
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

      console.log('Playlists cargadas desde BD:', playlistsData);
      setPlaylists(playlistsData || []);
      
    } catch (error) {
      console.error('Error general cargando playlists:', error);
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
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
                        className={`${themeClasses.textMuted} hover:${themeClasses.text} p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity`}
                      >
                        <EllipsisVerticalIcon className="h-5 w-5" />
                      </button>
                      {showPlaylistMenu === playlist.id && (
                        <div className={`absolute right-0 mt-2 w-48 ${themeClasses.bgCard} rounded-md shadow-lg border ${themeClasses.border} z-10`}>
                          <div className="py-1">
                            <button className={`flex items-center space-x-2 w-full text-left px-4 py-2 text-sm ${themeClasses.text} ${themeClasses.bgHover}`}>
                              <PlayIcon className="h-4 w-4" />
                              <span>Reproducir</span>
                            </button>
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
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Imagen de playlist */}
                    <div className="w-full h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-4 flex items-center justify-center">
                      {playlist.imagen_url ? (
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
                        <p>0 canciones</p>
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
      </div>
    </DashboardLayout>
  );
}
