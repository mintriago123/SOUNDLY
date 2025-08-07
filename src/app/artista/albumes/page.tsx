'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
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
import DashboardLayout from '@/components/DashboardLayout';

interface Album {
  id: string;
  titulo: string;
  descripcion?: string;
  fecha_lanzamiento?: string;
  genero?: string;
  imagen_portada_url?: string;
  duracion_total?: number;
  numero_canciones: number;
  usuario_id: string;
  estado: 'borrador' | 'publicado';
  created_at: string;
  updated_at: string;
}

interface Cancion {
  id: string;
  titulo: string;
  duracion: number;
  numero_pista?: number;
  genero?: string;
  año?: number;
  album_id?: string;
}

export default function AlbumesArtista() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [canciones, setCanciones] = useState<Cancion[]>([]);
  const [cancionesDisponibles, setCancionesDisponibles] = useState<Cancion[]>([]);
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
      // Cargar álbumes reales desde la base de datos
      const { data: albumsData, error } = await supabase
        .from('albumes')
        .select('*')
        .eq('usuario_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando álbumes:', error);
        return;
      }

      setAlbums(albumsData || []);

      // Cargar todas las canciones del usuario para poder asociarlas a álbumes
      const { data: cancionesData, error: cancionesError } = await supabase
        .from('canciones')
        .select('*')
        .eq('usuario_subida_id', userId)
        .order('created_at', { ascending: false });

      if (cancionesError) {
        console.error('Error cargando canciones:', cancionesError);
        return;
      }

      setCanciones(cancionesData || []);
      
      // Canciones disponibles son las que no están asignadas a ningún álbum
      setCancionesDisponibles((cancionesData || []).filter(c => !c.album_id));
      
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

  const calcularDuracionTotal = (albumId: string) => {
    const cancionesAlbum = canciones.filter(c => c.album_id === albumId);
    const total = cancionesAlbum.reduce((acc, cancion) => acc + cancion.duracion, 0);
    return formatearDuracion(total);
  };

  const guardarAlbum = async (albumData: Album) => {
    try {
      // Validación básica
      if (!albumData.titulo.trim()) {
        alert('El título del álbum es obligatorio');
        return false;
      }

      if (albumData.id) {
        // Actualizar álbum existente
        const { error } = await supabase
          .from('albumes')
          .update({
            titulo: albumData.titulo,
            descripcion: albumData.descripcion,
            fecha_lanzamiento: albumData.fecha_lanzamiento,
            genero: albumData.genero,
            imagen_portada_url: albumData.imagen_portada_url,
            estado: albumData.estado,
            updated_at: new Date().toISOString()
          })
          .eq('id', albumData.id);

        if (error) {
          console.error('Error actualizando álbum:', error);
          alert('Error al actualizar el álbum');
          return false;
        }
      } else {
        // Crear nuevo álbum
        const { error } = await supabase
          .from('albumes')
          .insert({
            titulo: albumData.titulo,
            descripcion: albumData.descripcion,
            fecha_lanzamiento: albumData.fecha_lanzamiento,
            genero: albumData.genero,
            imagen_portada_url: albumData.imagen_portada_url,
            usuario_id: usuario.id,
            estado: albumData.estado,
            numero_canciones: 0,
            duracion_total: 0
          });

        if (error) {
          console.error('Error creando álbum:', error);
          alert('Error al crear el álbum');
          return false;
        }
      }

      // Recargar álbumes
      await cargarAlbums(usuario.id);
      return true;
    } catch (error) {
      console.error('Error guardando álbum:', error);
      alert('Error al guardar el álbum');
      return false;
    }
  };

  const obtenerCancionesAlbum = (albumId: string) => {
    return canciones.filter(c => c.album_id === albumId);
  };

  const asignarCancionAAlbum = async (cancionId: string, albumId: string) => {
    try {
      const { error } = await supabase
        .from('canciones')
        .update({ album_id: albumId })
        .eq('id', cancionId);

      if (error) {
        console.error('Error asignando canción al álbum:', error);
        alert('Error al asignar la canción al álbum');
        return;
      }

      // Recargar datos
      if (usuario?.id) {
        await cargarAlbums(usuario.id);
        // Actualizar lista de canciones disponibles
        const { data: canciones, error: cancionesError } = await supabase
          .from('canciones')
          .select('*')
          .eq('usuario_subida_id', usuario.id)
          .is('album_id', null);

        if (!cancionesError) {
          setCancionesDisponibles(canciones || []);
        }
      }
    } catch (error) {
      console.error('Error asignando canción al álbum:', error);
      alert('Error al asignar la canción al álbum');
    }
  };

  const removerCancionDeAlbum = async (cancionId: string) => {
    try {
      const { error } = await supabase
        .from('canciones')
        .update({ album_id: null })
        .eq('id', cancionId);

      if (error) {
        console.error('Error removiendo canción del álbum:', error);
        alert('Error al remover la canción del álbum');
        return;
      }

      // Recargar datos
      if (usuario?.id) {
        await cargarAlbums(usuario.id);
        // Actualizar lista de canciones disponibles
        const { data: canciones, error: cancionesError } = await supabase
          .from('canciones')
          .select('*')
          .eq('usuario_subida_id', usuario.id)
          .is('album_id', null);

        if (!cancionesError) {
          setCancionesDisponibles(canciones || []);
        }
      }
    } catch (error) {
      console.error('Error removiendo canción del álbum:', error);
      alert('Error al remover la canción del álbum');
    }
  };

  const crearNuevoAlbum = async () => {
    setAlbumEditando({
      id: '',
      titulo: '',
      descripcion: '',
      fecha_lanzamiento: '',
      genero: '',
      imagen_portada_url: '',
      numero_canciones: 0,
      usuario_id: usuario?.id || '',
      estado: 'borrador',
      created_at: '',
      updated_at: ''
    });
    setMostrarModal(true);
    
    // Cargar canciones disponibles (sin álbum asignado)
    try {
      const { data: canciones, error } = await supabase
        .from('canciones')
        .select('*')
        .eq('usuario_subida_id', usuario?.id)
        .is('album_id', null);

      if (error) {
        console.error('Error al cargar canciones disponibles:', error);
        return;
      }

      setCancionesDisponibles(canciones || []);
    } catch (error) {
      console.error('Error al cargar canciones disponibles:', error);
    }
  };

  const editarAlbum = async (album: Album) => {
    setAlbumEditando(album);
    setMostrarModal(true);
    
    // Cargar canciones disponibles (sin álbum asignado)
    try {
      const { data: canciones, error } = await supabase
        .from('canciones')
        .select('*')
        .eq('usuario_subida_id', usuario?.id)
        .is('album_id', null);

      if (error) {
        console.error('Error al cargar canciones disponibles:', error);
        return;
      }

      setCancionesDisponibles(canciones || []);
    } catch (error) {
      console.error('Error al cargar canciones disponibles:', error);
    }
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
    <DashboardLayout>
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
                    {album.imagen_portada_url ? (
                      <img 
                        src={album.imagen_portada_url} 
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
                        {album.fecha_lanzamiento ? formatearFecha(album.fecha_lanzamiento) : 'Sin fecha'}
                      </div>
                      <div className="flex items-center">
                        <MusicalNoteIcon className="h-4 w-4 mr-2" />
                        {obtenerCancionesAlbum(album.id).length} canciones • {calcularDuracionTotal(album.id)}
                      </div>
                      <div className="flex items-center">
                        <span className="text-purple-600 font-medium">{album.genero || 'Sin género'}</span>
                      </div>
                    </div>
                    
                    {/* Lista de canciones */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Canciones:</h4>
                      <div className="space-y-1">
                        {obtenerCancionesAlbum(album.id).slice(0, 3).map((cancion) => (
                          <div key={cancion.id} className="flex items-center text-sm text-gray-600">
                            <span className="w-4 text-xs">{cancion.numero_pista || '•'}.</span>
                            <span className="flex-1 truncate mx-2">{cancion.titulo}</span>
                            <span className="text-xs">{formatearDuracion(cancion.duracion)}</span>
                          </div>
                        ))}
                        {obtenerCancionesAlbum(album.id).length > 3 && (
                          <div className="text-xs text-gray-400">
                            +{obtenerCancionesAlbum(album.id).length - 3} más...
                          </div>
                        )}
                        {obtenerCancionesAlbum(album.id).length === 0 && (
                          <div className="text-xs text-gray-400 italic">
                            No hay canciones asignadas
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

      {/* Modal de creación/edición de álbum */}
      {mostrarModal && albumEditando && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {albumEditando.id ? 'Editar Álbum' : 'Crear Nuevo Álbum'}
              </h3>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                const success = await guardarAlbum(albumEditando);
                if (success) {
                  cerrarModal();
                }
              }}>
                <div className="space-y-4">
                  {/* Título del álbum */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título del álbum *
                    </label>
                    <input
                      type="text"
                      required
                      value={albumEditando.titulo}
                      onChange={(e) => setAlbumEditando(prev => prev ? {...prev, titulo: e.target.value} : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Ingresa el título del álbum"
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={albumEditando.descripcion || ''}
                      onChange={(e) => setAlbumEditando(prev => prev ? {...prev, descripcion: e.target.value} : null)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Describe tu álbum"
                    />
                  </div>

                  {/* Fecha de lanzamiento y género */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de lanzamiento
                      </label>
                      <input
                        type="date"
                        value={albumEditando.fecha_lanzamiento || ''}
                        onChange={(e) => setAlbumEditando(prev => prev ? {...prev, fecha_lanzamiento: e.target.value} : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Género
                      </label>
                      <select
                        value={albumEditando.genero || ''}
                        onChange={(e) => setAlbumEditando(prev => prev ? {...prev, genero: e.target.value} : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">Seleccionar género</option>
                        <option value="Pop">Pop</option>
                        <option value="Rock">Rock</option>
                        <option value="Hip Hop">Hip Hop</option>
                        <option value="Electronic">Electronic</option>
                        <option value="Jazz">Jazz</option>
                        <option value="Classical">Classical</option>
                        <option value="R&B">R&B</option>
                        <option value="Country">Country</option>
                        <option value="Folk">Folk</option>
                        <option value="Reggae">Reggae</option>
                        <option value="Blues">Blues</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  {/* URL de imagen de portada */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL de imagen de portada
                    </label>
                    <input
                      type="url"
                      value={albumEditando.imagen_portada_url || ''}
                      onChange={(e) => setAlbumEditando(prev => prev ? {...prev, imagen_portada_url: e.target.value} : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      value={albumEditando.estado}
                      onChange={(e) => setAlbumEditando(prev => prev ? {...prev, estado: e.target.value as 'borrador' | 'publicado'} : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="borrador">Borrador</option>
                      <option value="publicado">Publicado</option>
                    </select>
                  </div>

                  {/* Mostrar canciones disponibles para asignar solo si es un álbum existente */}
                  {albumEditando.id && cancionesDisponibles.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Canciones disponibles para agregar al álbum
                      </label>
                      <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                        {cancionesDisponibles.map((cancion) => (
                          <div key={cancion.id} className="flex items-center justify-between py-1 text-sm">
                            <span>{cancion.titulo}</span>
                            <button
                              type="button"
                              onClick={async () => {
                                await asignarCancionAAlbum(cancion.id, albumEditando.id);
                              }}
                              className="text-purple-600 hover:text-purple-800 text-xs"
                            >
                              Agregar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mostrar canciones actuales del álbum si existe */}
                  {albumEditando.id && obtenerCancionesAlbum(albumEditando.id).length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Canciones en este álbum
                      </label>
                      <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50">
                        {obtenerCancionesAlbum(albumEditando.id).map((cancion) => (
                          <div key={cancion.id} className="flex items-center justify-between py-1 text-sm">
                            <span>{cancion.titulo}</span>
                            <button
                              type="button"
                              onClick={async () => {
                                await removerCancionDeAlbum(cancion.id);
                              }}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              Remover
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mensaje para álbumes nuevos */}
                  {!albumEditando.id && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <p className="text-sm text-blue-700">
                        <span className="font-medium">Nota:</span> Primero crea el álbum y luego podrás asignar canciones a este.
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                  >
                    {albumEditando.id ? 'Actualizar' : 'Crear'} Álbum
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
