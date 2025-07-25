'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/app/components/SupabaseProvider';
import { useRouter } from 'next/navigation';
import { 
  ClipboardDocumentListIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MusicalNoteIcon,
  CalendarIcon,
  PlayIcon 
} from '@heroicons/react/24/outline';

interface Album {
  id: string;
  titulo: string;
  descripcion: string;
  fecha_lanzamiento: string;
  genero: string;
  portada?: string;
  canciones: Cancion[];
  estado: 'borrador' | 'publicado';
}

interface Cancion {
  id: string;
  titulo: string;
  duracion: number;
  numero_pista: number;
}

export default function AlbumesArtista() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [cargando, setCargando] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [albumEditando, setAlbumEditando] = useState<Album | null>(null);

  useEffect(() => {
    verificarUsuarioYCargarAlbums();
  }, []);

  const verificarUsuarioYCargarAlbums = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Obtener datos del usuario
      const { data: userData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!userData || userData.rol !== 'artista') {
        router.push('/dashboard');
        return;
      }

      setUsuario(userData);
      await cargarAlbums(user.id);
    } catch (error) {
      console.error('Error verificando usuario:', error);
    } finally {
      setCargando(false);
    }
  };

  const cargarAlbums = async (userId: string) => {
    try {
      // Simulamos datos de álbumes
      const albumsSimulados: Album[] = [
        {
          id: '1',
          titulo: 'Debut Album',
          descripcion: 'Mi primer álbum de estudio con 10 canciones originales',
          fecha_lanzamiento: '2024-03-15',
          genero: 'Pop',
          estado: 'publicado',
          canciones: [
            { id: '1', titulo: 'Mi Primera Canción', duracion: 180, numero_pista: 1 },
            { id: '2', titulo: 'Melodía Nocturna', duracion: 240, numero_pista: 2 },
            { id: '3', titulo: 'Sueños de Verano', duracion: 210, numero_pista: 3 }
          ]
        },
        {
          id: '2',
          titulo: 'Trabajo en Progreso',
          descripcion: 'Nuevo álbum en proceso de creación',
          fecha_lanzamiento: '2024-12-01',
          genero: 'Rock',
          estado: 'borrador',
          canciones: [
            { id: '4', titulo: 'Nueva Canción', duracion: 195, numero_pista: 1 }
          ]
        }
      ];
      
      setAlbums(albumsSimulados);
    } catch (error) {
      console.error('Error cargando álbumes:', error);
    }
  };

  const formatearDuracion = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calcularDuracionTotal = (canciones: Cancion[]) => {
    const total = canciones.reduce((acc, cancion) => acc + cancion.duracion, 0);
    return formatearDuracion(total);
  };

  const crearNuevoAlbum = () => {
    setAlbumEditando({
      id: '',
      titulo: '',
      descripcion: '',
      fecha_lanzamiento: '',
      genero: 'Pop',
      canciones: [],
      estado: 'borrador'
    });
    setMostrarModal(true);
  };

  const editarAlbum = (album: Album) => {
    setAlbumEditando(album);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setAlbumEditando(null);
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando álbumes...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <ClipboardDocumentListIcon className="h-8 w-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">Mis Álbumes</h1>
            </div>
            
            <button 
              onClick={crearNuevoAlbum}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Crear Álbum
            </button>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Estadísticas Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">💿</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Álbumes</p>
                  <p className="text-2xl font-bold text-gray-900">{albums.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">✅</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Publicados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {albums.filter(album => album.estado === 'publicado').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">📝</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">En Borrador</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {albums.filter(album => album.estado === 'borrador').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Álbumes */}
          {albums.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map((album) => (
                <div key={album.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Portada del álbum */}
                  <div className="h-48 bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                    {album.portada ? (
                      <img 
                        src={album.portada} 
                        alt={album.titulo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ClipboardDocumentListIcon className="w-16 h-16 text-white opacity-80" />
                    )}
                  </div>
                  
                  {/* Información del álbum */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{album.titulo}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        album.estado === 'publicado' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {album.estado === 'publicado' ? 'Publicado' : 'Borrador'}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{album.descripcion}</p>
                    
                    <div className="space-y-2 text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {formatearFecha(album.fecha_lanzamiento)}
                      </div>
                      <div className="flex items-center">
                        <MusicalNoteIcon className="h-4 w-4 mr-2" />
                        {album.canciones.length} canciones • {calcularDuracionTotal(album.canciones)}
                      </div>
                      <div className="flex items-center">
                        <span className="text-purple-600 font-medium">{album.genero}</span>
                      </div>
                    </div>
                    
                    {/* Lista de canciones */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Canciones:</h4>
                      <div className="space-y-1">
                        {album.canciones.slice(0, 3).map((cancion) => (
                          <div key={cancion.id} className="flex items-center text-sm text-gray-600">
                            <span className="w-4 text-xs">{cancion.numero_pista}.</span>
                            <span className="flex-1 truncate mx-2">{cancion.titulo}</span>
                            <span className="text-xs">{formatearDuracion(cancion.duracion)}</span>
                          </div>
                        ))}
                        {album.canciones.length > 3 && (
                          <div className="text-xs text-gray-400">
                            +{album.canciones.length - 3} más...
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Acciones */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => editarAlbum(album)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Editar
                      </button>
                      {album.estado === 'publicado' && (
                        <button className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
                          <PlayIcon className="h-4 w-4 mr-1" />
                          Reproducir
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tienes álbumes</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comienza creando tu primer álbum musical.
              </p>
              <div className="mt-6">
                <button 
                  onClick={crearNuevoAlbum}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Crear Álbum
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Modal de edición (placeholder) */}
      {mostrarModal && albumEditando && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {albumEditando.id ? 'Editar Álbum' : 'Crear Nuevo Álbum'}
              </h3>
              
              <div className="text-center py-8 text-gray-500">
                <ClipboardDocumentListIcon className="mx-auto h-12 w-12 mb-4" />
                <p>Formulario de edición del álbum</p>
                <p className="text-sm mt-2">Esta funcionalidad se implementaría aquí</p>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={cerrarModal}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={cerrarModal}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
