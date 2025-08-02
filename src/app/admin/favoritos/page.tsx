'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useSupabase } from '@/components/SupabaseProvider';
import { HeartIcon, MagnifyingGlassIcon, MusicalNoteIcon, ClipboardDocumentListIcon, PlayIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface CancionFavorita {
  id: string;
  titulo: string;
  artista: string;
  album: string;
  duracion: string;
  genero: string;
  fecha_agregada: string;
  imagen_url?: string;
  es_favorita: boolean;
}

interface PlaylistFavorita {
  id: string;
  nombre: string;
  descripcion?: string;
  creador: string;
  canciones_count: number;
  duracion_total: string;
  fecha_agregada: string;
  imagen_url?: string;
  es_publica: boolean;
}

type TabType = 'canciones' | 'playlists';

// Datos mock para desarrollo
const mockCancionesFavoritas: CancionFavorita[] = [
  {
    id: '1',
    titulo: 'Bohemian Rhapsody',
    artista: 'Queen',
    album: 'A Night at the Opera',
    duracion: '5:55',
    genero: 'Rock',
    fecha_agregada: '2025-01-20T10:30:00Z',
    es_favorita: true,
  },
  {
    id: '2',
    titulo: 'Hotel California',
    artista: 'Eagles',
    album: 'Hotel California',
    duracion: '6:30',
    genero: 'Rock',
    fecha_agregada: '2025-01-18T14:15:00Z',
    es_favorita: true,
  },
  {
    id: '3',
    titulo: 'Imagine',
    artista: 'John Lennon',
    album: 'Imagine',
    duracion: '3:01',
    genero: 'Pop',
    fecha_agregada: '2025-01-16T09:20:00Z',
    es_favorita: true,
  },
  {
    id: '4',
    titulo: 'Billie Jean',
    artista: 'Michael Jackson',
    album: 'Thriller',
    duracion: '4:54',
    genero: 'Pop',
    fecha_agregada: '2025-01-15T16:45:00Z',
    es_favorita: true,
  },
  {
    id: '5',
    titulo: 'Yesterday',
    artista: 'The Beatles',
    album: 'Help!',
    duracion: '2:05',
    genero: 'Rock',
    fecha_agregada: '2025-01-12T11:30:00Z',
    es_favorita: true,
  }
];

const mockPlaylistsFavoritas: PlaylistFavorita[] = [
  {
    id: '1',
    nombre: 'Classic Rock Essentials',
    descripcion: 'Los clásicos del rock que nunca pasan de moda',
    creador: 'RockMaster',
    canciones_count: 50,
    duracion_total: '03:15:45',
    fecha_agregada: '2025-01-19T12:00:00Z',
    es_publica: true,
  },
  {
    id: '2',
    nombre: 'Chill Vibes',
    descripcion: 'Música relajante para momentos de calma',
    creador: 'ChillExpert',
    canciones_count: 30,
    duracion_total: '02:05:20',
    fecha_agregada: '2025-01-17T08:30:00Z',
    es_publica: true,
  },
  {
    id: '3',
    nombre: 'Workout Energy',
    descripcion: 'Alta energía para tus entrenamientos',
    creador: 'FitnessBeats',
    canciones_count: 40,
    duracion_total: '02:45:10',
    fecha_agregada: '2025-01-14T07:15:00Z',
    es_publica: true,
  }
];

export default function FavoritosPage() {
  const [activeTab, setActiveTab] = useState<TabType>('canciones');
  const [cancionesFavoritas, setCancionesFavoritas] = useState<CancionFavorita[]>(mockCancionesFavoritas);
  const [playlistsFavoritas, setPlaylistsFavoritas] = useState<PlaylistFavorita[]>(mockPlaylistsFavoritas);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
    cargarFavoritos();
  }, []);

  useEffect(() => {
    cargarFavoritos();
  }, [user]);

  const cargarFavoritos = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        console.log('Usuario no encontrado, usando datos mock');
        setCancionesFavoritas(mockCancionesFavoritas);
        setPlaylistsFavoritas(mockPlaylistsFavoritas);
        return;
      }

      // Intentar cargar desde Supabase
      try {
        const [cancionesRes, playlistsRes] = await Promise.all([
          supabase
            .from('favoritos')
            .select(`
              *,
              cancion:canciones(*)
            `)
            .eq('usuario_id', user.id)
            .eq('tipo', 'cancion'),
          supabase
            .from('favoritos')
            .select(`
              *,
              playlist:playlists(*)
            `)
            .eq('usuario_id', user.id)
            .eq('tipo', 'playlist')
        ]);

        if (cancionesRes.error || playlistsRes.error) {
          console.warn('Error de Supabase, usando datos mock');
          setCancionesFavoritas(mockCancionesFavoritas);
          setPlaylistsFavoritas(mockPlaylistsFavoritas);
        } else {
          console.log('Datos cargados desde Supabase');
          // Procesar datos de Supabase aquí si es necesario
          setCancionesFavoritas(mockCancionesFavoritas); // Por ahora usar mock
          setPlaylistsFavoritas(mockPlaylistsFavoritas);
        }
      } catch (supabaseError) {
        console.warn('Error con Supabase, usando mock:', supabaseError);
        setCancionesFavoritas(mockCancionesFavoritas);
        setPlaylistsFavoritas(mockPlaylistsFavoritas);
      }
    } catch (error) {
      console.warn('Error general, usando datos mock:', error);
      setCancionesFavoritas(mockCancionesFavoritas);
      setPlaylistsFavoritas(mockPlaylistsFavoritas);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorito = async (id: string, tipo: 'cancion' | 'playlist') => {
    try {
      if (tipo === 'cancion') {
        setCancionesFavoritas(prev => 
          prev.map(cancion => 
            cancion.id === id 
              ? { ...cancion, es_favorita: !cancion.es_favorita }
              : cancion
          ).filter(cancion => cancion.es_favorita) // Remover si ya no es favorita
        );
      } else {
        // Para playlists, solo remover de favoritos
        setPlaylistsFavoritas(prev => prev.filter(playlist => playlist.id !== id));
      }
      
      console.log(`${tipo} ${id} ${tipo === 'cancion' ? 'toggled' : 'removed'} from favorites`);
    } catch (error) {
      console.error('Error toggling favorito:', error);
    }
  };

  // Filtros
  const filteredCanciones = cancionesFavoritas.filter(cancion =>
    cancion.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cancion.artista.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cancion.album.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPlaylists = playlistsFavoritas.filter(playlist =>
    playlist.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    playlist.creador.toLowerCase().includes(searchTerm.toLowerCase()) ||
    playlist.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className={`${themeClasses.bgCard} rounded-lg shadow p-6`}>
          <div className="flex items-center space-x-3 mb-4">
            <HeartIcon className={`h-8 w-8 text-red-500`} />
            <h2 className={`text-2xl font-bold ${themeClasses.text}`}>
              Mis Favoritos ❤️
            </h2>
          </div>
          <p className={themeClasses.textSecondary}>
            Tu colección de canciones y playlists favoritas
          </p>
        </div>

        {/* Controles y Pestañas */}
        <div className={`${themeClasses.bgCard} rounded-lg shadow`}>
          {/* Pestañas */}
          <div className={`border-b ${themeClasses.border}`}>
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('canciones')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'canciones'
                    ? 'border-red-500 text-red-600'
                    : `border-transparent ${themeClasses.textMuted} hover:text-gray-700 hover:border-gray-300`
                }`}
              >
                <div className="flex items-center space-x-2">
                  <MusicalNoteIcon className="h-5 w-5" />
                  <span>Canciones ({filteredCanciones.length})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('playlists')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'playlists'
                    ? 'border-red-500 text-red-600'
                    : `border-transparent ${themeClasses.textMuted} hover:text-gray-700 hover:border-gray-300`
                }`}
              >
                <div className="flex items-center space-x-2">
                  <ClipboardDocumentListIcon className="h-5 w-5" />
                  <span>Playlists ({filteredPlaylists.length})</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Controles */}
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex gap-4">
                <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2">
                  <PlayIcon className="h-5 w-5" />
                  <span>Reproducir Todo</span>
                </button>
                <button className={`border ${themeClasses.border} ${themeClasses.text} px-4 py-2 rounded-lg ${themeClasses.bgHover} transition-colors`}>
                  📤 Exportar
                </button>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={`Buscar ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`${themeClasses.inputBg} border ${themeClasses.inputBorder} rounded-lg px-3 py-2 pl-10 w-64 focus:ring-2 focus:ring-red-400 outline-none ${themeClasses.text}`}
                  />
                  <MagnifyingGlassIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${themeClasses.textMuted}`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className={`${themeClasses.bgCard} rounded-lg shadow`}>
          <div className="p-6">
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className={themeClasses.textMuted}>Cargando favoritos...</p>
              </div>
            )}

            {!loading && activeTab === 'canciones' && (
              <>
                {filteredCanciones.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">💔</div>
                    <h4 className={`text-xl font-medium mb-2 ${themeClasses.text}`}>
                      {searchTerm ? 'No se encontraron canciones' : 'No tienes canciones favoritas'}
                    </h4>
                    <p className={`${themeClasses.textMuted} mb-6`}>
                      {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Explora música y marca tus canciones favoritas'}
                    </p>
                    {!searchTerm && (
                      <button className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors">
                        🎵 Explorar Música
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredCanciones.map((cancion, index) => (
                      <div key={cancion.id} className={`playlist-card ${themeClasses.bgHover} border ${themeClasses.border} rounded-lg p-4 transition-colors group relative`}>
                        <div className="flex items-center space-x-4">
                          {/* Número */}
                          <div className={`w-8 text-center ${themeClasses.textMuted} text-sm`}>
                            {index + 1}
                          </div>

                          {/* Imagen/Icono */}
                          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                            {cancion.imagen_url ? (
                              <img src={cancion.imagen_url} alt={cancion.titulo} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <MusicalNoteIcon className="h-6 w-6 text-white" />
                            )}
                          </div>

                          {/* Información */}
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-medium ${themeClasses.text} truncate`}>{cancion.titulo}</h4>
                            <p className={`text-sm ${themeClasses.textMuted} truncate`}>
                              {cancion.artista} • {cancion.album}
                            </p>
                          </div>

                          {/* Género */}
                          <div className="hidden md:block">
                            <span className={`text-xs px-2 py-1 bg-gray-100 ${themeClasses.textMuted} rounded-full`}>
                              {cancion.genero}
                            </span>
                          </div>

                          {/* Duración */}
                          <div className={`text-sm ${themeClasses.textMuted} w-16 text-right`}>
                            {cancion.duracion}
                          </div>

                          {/* Acciones */}
                          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => toggleFavorito(cancion.id, 'cancion')}
                              className="text-red-500 hover:text-red-700 p-1 rounded"
                              title="Quitar de favoritos"
                            >
                              <HeartSolidIcon className="h-5 w-5" />
                            </button>
                            <button className={`${themeClasses.textMuted} hover:${themeClasses.text} p-1 rounded`}>
                              <PlayIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {!loading && activeTab === 'playlists' && (
              <>
                {filteredPlaylists.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📋</div>
                    <h4 className={`text-xl font-medium mb-2 ${themeClasses.text}`}>
                      {searchTerm ? 'No se encontraron playlists' : 'No tienes playlists favoritas'}
                    </h4>
                    <p className={`${themeClasses.textMuted} mb-6`}>
                      {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Explora playlists y marca tus favoritas'}
                    </p>
                    {!searchTerm && (
                      <button className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors">
                        🔍 Explorar Playlists
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredPlaylists.map((playlist) => (
                      <div key={playlist.id} className={`playlist-card ${themeClasses.bgHover} border ${themeClasses.border} rounded-lg p-4 transition-colors group relative`}>
                        {/* Botón de favorito */}
                        <div className="absolute top-3 right-3 z-10">
                          <button
                            onClick={() => toggleFavorito(playlist.id, 'playlist')}
                            className="text-red-500 hover:text-red-700 p-1 rounded bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Quitar de favoritos"
                          >
                            <HeartSolidIcon className="h-5 w-5" />
                          </button>
                        </div>

                        {/* Imagen de playlist */}
                        <div className="w-full h-32 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg mb-4 flex items-center justify-center">
                          {playlist.imagen_url ? (
                            <img src={playlist.imagen_url} alt={playlist.nombre} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <ClipboardDocumentListIcon className="h-12 w-12 text-white" />
                          )}
                        </div>

                        {/* Información de playlist */}
                        <div>
                          <h4 className={`font-medium ${themeClasses.text} mb-1`}>{playlist.nombre}</h4>
                          {playlist.descripcion && (
                            <p className={`text-sm ${themeClasses.textMuted} mb-2 line-clamp-2`}>{playlist.descripcion}</p>
                          )}
                          <div className={`text-xs ${themeClasses.textMuted} space-y-1`}>
                            <p>Por {playlist.creador}</p>
                            <p>{playlist.canciones_count} canciones • {playlist.duracion_total}</p>
                            <p>
                              {playlist.es_publica ? '🌍 Pública' : '🔒 Privada'} • 
                              {new Date(playlist.fecha_agregada).toLocaleDateString('es-ES')}
                            </p>
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
      </div>
    </DashboardLayout>
  );
}
