'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRouter } from 'next/navigation';
import { 
  MusicalNoteIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  PlayIcon,
  PauseIcon,
  ChartBarIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';

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
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export default function MiMusica() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [canciones, setCanciones] = useState<Cancion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);
  const [mostrarModalSubida, setMostrarModalSubida] = useState(false);
  const [archivosSubiendo, setArchivosSubiendo] = useState<UploadProgress[]>([]);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    verificarUsuarioYCargarMusica();
  }, []);

  const verificarUsuarioYCargarMusica = async () => {
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
      await cargarCanciones(user.id);
    } catch (error) {
      console.error('Error verificando usuario:', error);
    } finally {
      setCargando(false);
    }
  };

  const cargarCanciones = async (userId: string) => {
    try {
      // Cargar canciones reales desde la base de datos
      const { data: cancionesData, error } = await supabase
        .from('canciones')
        .select('*')
        .eq('usuario_subida_id', userId) // Cambiar artista_id por usuario_subida_id
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando canciones:', error);
        return;
      }

      // Verificar y corregir duraciones sospechosas (exactamente 180 segundos)
      const cancionesCorregidas = await Promise.all(
        (cancionesData || []).map(async (cancion) => {
          // Si la duración es exactamente 180 segundos (3:00), intentar obtener la real
          if (cancion.duracion === 180 && cancion.archivo_audio_url) {
            try {
              const duracionReal = await obtenerDuracionDesdeURL(cancion.archivo_audio_url);
              if (duracionReal && duracionReal !== 180) {
                // Actualizar en la base de datos
                await supabase
                  .from('canciones')
                  .update({ duracion: duracionReal })
                  .eq('id', cancion.id);
                
                console.log(`Duración corregida para "${cancion.titulo}": ${duracionReal}s`);
                return { ...cancion, duracion: duracionReal };
              }
            } catch (error) {
              console.log(`No se pudo corregir duración para "${cancion.titulo}"`);
            }
          }
          return cancion;
        })
      );

      setCanciones(cancionesCorregidas);
    } catch (error) {
      console.error('Error cargando canciones:', error);
    }
  };

  // Función para obtener duración real desde URL del archivo
  const obtenerDuracionDesdeURL = (url: string): Promise<number | null> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      
      audio.addEventListener('loadedmetadata', () => {
        const duracion = Math.floor(audio.duration);
        if (!isNaN(duracion) && duracion > 0) {
          resolve(duracion);
        } else {
          resolve(null);
        }
      });

      audio.addEventListener('error', () => {
        resolve(null);
      });

      // Timeout para evitar que se cuelgue
      setTimeout(() => {
        resolve(null);
      }, 10000); // 10 segundos

      audio.src = url;
    });
  };

  const formatearDuracion = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  // Función para obtener metadatos completos del archivo
  const obtenerMetadatosArchivo = (archivo: File): Promise<{
    duracion: number;
    titulo?: string;
    artista?: string;
    album?: string;
    año?: number;
    genero?: string;
  }> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const url = URL.createObjectURL(archivo);
      
      // Obtener nombre del archivo sin extensión como título por defecto
      const tituloDefault = archivo.name.replace(/\.[^/.]+$/, "");
      
      audio.addEventListener('loadedmetadata', () => {
        const duracion = Math.floor(audio.duration);
        URL.revokeObjectURL(url);
        
        // Si no se puede obtener la duración o es muy corta/larga, usar valores por defecto
        if (isNaN(duracion) || duracion < 1 || duracion > 3600) {
          resolve({
            duracion: 180, // 3 minutos por defecto
            titulo: tituloDefault
          });
        } else {
          resolve({
            duracion,
            titulo: tituloDefault
          });
        }
      });

      audio.addEventListener('error', () => {
        URL.revokeObjectURL(url);
        
        // Para archivos que no se pueden leer (como OPUS), intentar obtener duración aproximada del tamaño
        let duracionAproximada;
        
        if (archivo.name.toLowerCase().includes('.opus')) {
          // OPUS de WhatsApp suele tener bitrate de 32-48 kbps
          const bitrateBytesPerSeg = 6000; // ~48kbps
          duracionAproximada = Math.floor(archivo.size / bitrateBytesPerSeg);
        } else {
          // Para otros formatos, usar estimación general
          const tamañoKB = archivo.size / 1024;
          duracionAproximada = Math.floor(tamañoKB / 16); // 16KB por segundo para audio comprimido
        }
        
        resolve({
          duracion: Math.min(Math.max(duracionAproximada, 5), 3600), // Entre 5 segundos y 1 hora
          titulo: tituloDefault
        });
      });

      // Timeout para archivos que no cargan
      setTimeout(() => {
        URL.revokeObjectURL(url);
        
        let duracionAproximada;
        if (archivo.name.toLowerCase().includes('.opus')) {
          const bitrateBytesPerSeg = 6000; // ~48kbps para OPUS
          duracionAproximada = Math.floor(archivo.size / bitrateBytesPerSeg);
        } else {
          const tamañoKB = archivo.size / 1024;
          duracionAproximada = Math.floor(tamañoKB / 16);
        }
        
        resolve({
          duracion: Math.min(Math.max(duracionAproximada, 5), 3600),
          titulo: tituloDefault
        });
      }, 5000); // 5 segundos de timeout

      audio.src = url;
    });
  };

  // Validación de archivos de música
  const validarArchivo = (archivo: File): Promise<{ valido: boolean; error?: string; metadatos?: any }> => {
    return new Promise(async (resolve) => {
      // Validar tipo de archivo - incluir más formatos
      const tiposPermitidos = [
        'audio/mpeg', 
        'audio/mp3', 
        'audio/wav', 
        'audio/ogg', 
        'audio/aac',
        'audio/webm',
        'audio/mp4',
        'audio/x-m4a',
        'audio/opus'
      ];
      
      // Para archivos OPUS de WhatsApp, verificar extensión
      const esOpus = archivo.name.toLowerCase().includes('.opus') || archivo.type.includes('opus');
      
      if (!tiposPermitidos.includes(archivo.type) && !esOpus) {
        resolve({ valido: false, error: 'Formato de archivo no soportado. Use MP3, WAV, OGG, AAC, OPUS o M4A.' });
        return;
      }

      // Validar tamaño (máximo 100MB)
      const tamañoMaximo = 100 * 1024 * 1024; // 100MB
      if (archivo.size > tamañoMaximo) {
        resolve({ valido: false, error: 'El archivo es demasiado grande. Tamaño máximo: 100MB.' });
        return;
      }

      try {
        // Obtener metadatos completos
        const metadatos = await obtenerMetadatosArchivo(archivo);
        
        if (metadatos.duracion > 3600) { // 1 hora máximo
          resolve({ valido: false, error: 'La canción es demasiado larga. Duración máxima: 1 hora.' });
        } else {
          resolve({ valido: true, metadatos });
        }
      } catch (error) {
        resolve({ valido: false, error: 'No se pudo procesar el archivo de audio.' });
      }
    });
  };

  // Manejar selección de archivos
  const handleFileSelect = async (archivos: FileList) => {
    for (let i = 0; i < archivos.length; i++) {
      const archivo = archivos[i];
      
      // Añadir archivo a la lista de subidas
      const nuevoUpload: UploadProgress = {
        fileName: archivo.name,
        progress: 0,
        status: 'uploading'
      };
      
      setArchivosSubiendo(prev => [...prev, nuevoUpload]);

      try {
        // Validar archivo
        const validacion = await validarArchivo(archivo);
        if (!validacion.valido) {
          setArchivosSubiendo(prev => 
            prev.map(upload => 
              upload.fileName === archivo.name 
                ? { ...upload, status: 'error', error: validacion.error }
                : upload
            )
          );
          continue;
        }

        const metadatos = validacion.metadatos;
        
        // Log para depuración
        console.log('Metadatos del archivo:', {
          nombre: archivo.name,
          tamaño: archivo.size,
          tipo: archivo.type,
          metadatos: metadatos
        });

        // Subir archivo a Supabase Storage
        const nombreArchivo = `${Date.now()}-${archivo.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        // Actualizar progreso
        setArchivosSubiendo(prev => 
          prev.map(upload => 
            upload.fileName === archivo.name 
              ? { ...upload, progress: 50, status: 'uploading' }
              : upload
          )
        );

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('music')
          .upload(nombreArchivo, archivo, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Error de subida:', uploadError);
          let errorMessage = 'Error subiendo archivo';
          
          if (uploadError.message.includes('Bucket not found')) {
            errorMessage = 'El bucket "music" no existe. Configura Supabase Storage primero.';
          } else if (uploadError.message.includes('Policy')) {
            errorMessage = 'Sin permisos. Configura las políticas RLS del bucket.';
          } else if (uploadError.message.includes('413')) {
            errorMessage = 'Archivo demasiado grande';
          } else if (uploadError.message.includes('401')) {
            errorMessage = 'No autorizado. Verifica tu sesión.';
          }
          
          setArchivosSubiendo(prev => 
            prev.map(upload => 
              upload.fileName === archivo.name 
                ? { ...upload, status: 'error', error: errorMessage }
                : upload
            )
          );
          continue;
        }

        // Actualizar progreso
        setArchivosSubiendo(prev => 
          prev.map(upload => 
            upload.fileName === archivo.name 
              ? { ...upload, progress: 90 }
              : upload
          )
        );

        // Obtener URL pública del archivo
        const { data: urlData } = supabase.storage
          .from('music')
          .getPublicUrl(nombreArchivo);

        // Guardar información en la base de datos
        const { data: cancionData, error: dbError } = await supabase
          .from('canciones')
          .insert({
            titulo: metadatos.titulo || archivo.name.replace(/\.[^/.]+$/, ""),
            usuario_subida_id: usuario.id,
            duracion: metadatos.duracion,
            genero: metadatos.genero || 'Sin clasificar',
            año: metadatos.año || new Date().getFullYear(),
            archivo_audio_url: urlData.publicUrl,
            reproducciones: 0,
            es_publica: true,
            estado: 'activa',
            favoritos: 0,
            descargas: 0
          })
          .select()
          .single();

        if (dbError) {
          setArchivosSubiendo(prev => 
            prev.map(upload => 
              upload.fileName === archivo.name 
                ? { ...upload, status: 'error', error: 'Error guardando en base de datos' }
                : upload
            )
          );
          continue;
        }

        // Marcar como completado
        setArchivosSubiendo(prev => 
          prev.map(upload => 
            upload.fileName === archivo.name 
              ? { ...upload, status: 'complete', progress: 100 }
              : upload
          )
        );

        // Recargar lista de canciones
        await cargarCanciones(usuario.id);

      } catch (error) {
        console.error('Error procesando archivo:', error);
        setArchivosSubiendo(prev => 
          prev.map(upload => 
            upload.fileName === archivo.name 
              ? { ...upload, status: 'error', error: 'Error procesando archivo' }
              : upload
          )
        );
      }
    }
  };

  // Manejar drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Función para corregir todas las duraciones
  const corregirTodasLasDuraciones = async () => {
    if (!usuario) return;
    
    console.log('Iniciando corrección de duraciones...');
    
    const cancionesActualizadas = await Promise.all(
      canciones.map(async (cancion) => {
        if (cancion.duracion === 180 && cancion.archivo_audio_url) {
          try {
            const duracionReal = await obtenerDuracionDesdeURL(cancion.archivo_audio_url);
            if (duracionReal && duracionReal !== 180) {
              await supabase
                .from('canciones')
                .update({ duracion: duracionReal })
                .eq('id', cancion.id);
              
              console.log(`✅ Corregida "${cancion.titulo}": ${duracionReal}s`);
              return { ...cancion, duracion: duracionReal };
            }
          } catch (error) {
            console.log(`❌ Error corrigiendo "${cancion.titulo}"`);
          }
        }
        return cancion;
      })
    );
    
    setCanciones(cancionesActualizadas);
    console.log('Corrección completada');
  };

  // Limpiar archivos completados
  const limpiarArchivosCompletados = () => {
    setArchivosSubiendo(prev => 
      prev.filter(upload => upload.status !== 'complete')
    );
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
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
              <MusicalNoteIcon className="h-8 w-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">Mi Música</h1>
            </div>
            
            <button 
              onClick={() => setMostrarModalSubida(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Subir Nueva Canción
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
                <div className="text-3xl mr-4">🎵</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Canciones</p>
                  <p className="text-2xl font-bold text-gray-900">{canciones.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">▶️</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reproducciones</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {canciones.reduce((acc, cancion) => acc + cancion.reproducciones, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">📊</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Promedio por Canción</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {canciones.length > 0 
                      ? Math.round(canciones.reduce((acc, cancion) => acc + cancion.reproducciones, 0) / canciones.length).toLocaleString()
                      : 0
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Canciones */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Mis Canciones</h3>
                {canciones.some(c => c.duracion === 180) && (
                  <button
                    onClick={corregirTodasLasDuraciones}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
                  >
                    🔧 Corregir duraciones
                  </button>
                )}
              </div>
            </div>
            
            {canciones.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Canción
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duración
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Género
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Año
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {canciones.map((cancion) => (
                      <tr key={cancion.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded bg-purple-100 flex items-center justify-center">
                                <MusicalNoteIcon className="h-5 w-5 text-purple-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {cancion.titulo}
                              </div>
                              <div className="text-sm text-gray-500">
                                {cancion.reproducciones.toLocaleString()} reproducciones
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatearDuracion(cancion.duracion)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cancion.genero}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            cancion.estado === 'activa' ? 'bg-green-100 text-green-800' :
                            cancion.estado === 'inactiva' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {cancion.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cancion.año}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-purple-600 hover:text-purple-900">
                              <ChartBarIcon className="h-4 w-4" />
                            </button>
                            <button className="text-blue-600 hover:text-blue-900">
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <MusicalNoteIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No tienes canciones</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Comienza subiendo tu primera canción.
                </p>
                <div className="mt-6">
                  <button 
                    onClick={() => setMostrarModalSubida(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Subir Canción
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Modal de Subida de Música */}
      {mostrarModalSubida && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Subir Nueva Canción</h3>
              <button
                onClick={() => setMostrarModalSubida(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Zona de Drag & Drop */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? 'border-purple-400 bg-purple-50' : 'border-gray-300'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Arrastra tus archivos de música aquí o
              </p>
              <label className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-purple-600 bg-purple-100 hover:bg-purple-200 cursor-pointer">
                Seleccionar archivos
                <input
                  type="file"
                  multiple
                  accept="audio/*"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                  className="hidden"
                />
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Formatos soportados: MP3, WAV, OGG, AAC, OPUS, M4A (máx. 100MB)
              </p>
            </div>

            {/* Lista de archivos subiendo */}
            {archivosSubiendo.length > 0 && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-gray-900">Subiendo archivos</h4>
                  <button
                    onClick={limpiarArchivosCompletados}
                    className="text-xs text-purple-600 hover:text-purple-800"
                  >
                    Limpiar completados
                  </button>
                </div>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {archivosSubiendo.map((upload, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {upload.fileName}
                        </span>
                        <div className="flex items-center">
                          {upload.status === 'complete' && (
                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                          )}
                          {upload.status === 'error' && (
                            <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      </div>
                      
                      {upload.status === 'uploading' && (
                        <>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${upload.progress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500">
                            {upload.progress < 50 ? 'Validando archivo...' : 
                             upload.progress < 90 ? 'Subiendo a storage...' : 'Guardando en base de datos...'}
                          </p>
                        </>
                      )}
                      
                      {upload.status === 'complete' && (
                        <p className="text-xs text-green-600 mt-1">
                          ✅ Archivo subido correctamente
                        </p>
                      )}
                      
                      {upload.status === 'error' && upload.error && (
                        <p className="text-xs text-red-600 mt-1">{upload.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Información sobre Supabase Storage */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">⚠️ Configuración requerida para Supabase Storage:</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>1. Crear bucket:</strong> Ve a tu dashboard de Supabase → Storage → Create bucket → nombre: "music"</p>
                <p><strong>2. Configurar políticas RLS:</strong></p>
                <div className="ml-4 bg-blue-100 p-2 rounded text-xs font-mono">
                  <p>-- Política para subir archivos (artistas)</p>
                  <p>CREATE POLICY "Artistas pueden subir música" ON storage.objects</p>
                  <p>FOR INSERT WITH CHECK (bucket_id = 'music' AND auth.uid() = owner);</p>
                </div>
                <p><strong>3. Hacer bucket público:</strong> Settings → Make bucket public</p>
                <p className="text-red-600">⚠️ Sin esta configuración, las subidas fallarán con error 400</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
