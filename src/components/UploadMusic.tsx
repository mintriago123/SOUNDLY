'use client';

import { useState } from 'react';
import { useSupabase } from './SupabaseProvider';

interface UploadMusicProps {
  onUploadComplete?: (cancion: any) => void;
  onClose?: () => void;
}

export default function UploadMusic({ onUploadComplete, onClose }: Readonly<UploadMusicProps>) {
  const { supabase } = useSupabase();
  const [formData, setFormData] = useState({
    titulo: '',
    artista: '',
    album: '',
    genero: '',
    duracion: '',
    descripcion: ''
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith('audio/')) {
      setAudioFile(file);
      setError('');
      
      // Auto-rellenar duración si es posible
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.onloadedmetadata = () => {
        setFormData(prev => ({
          ...prev,
          duracion: Math.round(audio.duration).toString()
        }));
        URL.revokeObjectURL(audio.src);
      };
    } else {
      setError('Por favor selecciona un archivo de audio válido');
    }
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith('image/')) {
      setCoverFile(file);
      setError('');
    } else {
      setError('Por favor selecciona una imagen válida para la portada');
    }
  };

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!audioFile) {
      setError('Por favor selecciona un archivo de audio');
      return;
    }

    if (!formData.titulo || !formData.artista) {
      setError('El título y artista son obligatorios');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Generar nombres únicos para los archivos
      const timestamp = Date.now();
      const audioFileName = `${timestamp}-${audioFile.name}`;
      const coverFileName = coverFile ? `${timestamp}-${coverFile.name}` : null;

      setUploadProgress(25);

      // Subir archivo de audio
      await uploadFile(audioFile, 'canciones', audioFileName);
      
      setUploadProgress(50);

      // Subir portada si existe
      let coverUpload = null;
      if (coverFile) {
        coverUpload = await uploadFile(coverFile, 'portadas', coverFileName!);
      }

      setUploadProgress(75);

      // Obtener URLs públicas
      const { data: audioUrl } = supabase.storage
        .from('canciones')
        .getPublicUrl(audioFileName);

      const { data: coverUrl } = coverFile && coverUpload ? 
        supabase.storage.from('portadas').getPublicUrl(coverFileName!) : 
        { data: null };

      // Crear registro en la base de datos
      const { data: cancion, error: dbError } = await supabase
        .from('canciones')
        .insert({
          titulo: formData.titulo,
          artista: formData.artista,
          album: formData.album || null,
          genero: formData.genero || null,
          duracion: parseInt(formData.duracion) || 0,
          descripcion: formData.descripcion || null,
          url_archivo: audioUrl.publicUrl,
          url_portada: coverUrl?.publicUrl || null,
          usuario_id: user.id,
          tamaño_archivo: audioFile.size,
          formato_archivo: audioFile.type,
          fecha_subida: new Date().toISOString()
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setUploadProgress(100);

      // Notificar éxito
      if (onUploadComplete) {
        onUploadComplete(cancion);
      }

      // Limpiar formulario
      setFormData({
        titulo: '',
        artista: '',
        album: '',
        genero: '',
        duracion: '',
        descripcion: ''
      });
      setAudioFile(null);
      setCoverFile(null);

      if (onClose) {
        onClose();
      }

    } catch (error: any) {
      console.error('Error subiendo música:', error);
      setError(error.message || 'Error al subir la canción');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Subir Nueva Canción</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
                disabled={isUploading}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Progreso de subida */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subiendo...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Archivo de audio */}
          <div>
            <label htmlFor="audio-file" className="block text-sm font-medium text-gray-700 mb-2">
              Archivo de Audio *
            </label>
            <input
              id="audio-file"
              type="file"
              accept="audio/*"
              onChange={handleAudioFileChange}
              disabled={isUploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {audioFile && (
              <p className="mt-1 text-sm text-gray-500">
                Seleccionado: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Portada */}
          <div>
            <label htmlFor="cover-file" className="block text-sm font-medium text-gray-700 mb-2">
              Portada del Álbum (Opcional)
            </label>
            <input
              id="cover-file"
              type="file"
              accept="image/*"
              onChange={handleCoverFileChange}
              disabled={isUploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
            {coverFile && (
              <p className="mt-1 text-sm text-gray-500">
                Seleccionado: {coverFile.name}
              </p>
            )}
          </div>

          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                id="titulo"
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleInputChange}
                disabled={isUploading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre de la canción"
              />
            </div>

            <div>
              <label htmlFor="artista" className="block text-sm font-medium text-gray-700 mb-2">
                Artista *
              </label>
              <input
                id="artista"
                type="text"
                name="artista"
                value={formData.artista}
                onChange={handleInputChange}
                disabled={isUploading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre del artista"
              />
            </div>
          </div>

          {/* Información adicional */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="album" className="block text-sm font-medium text-gray-700 mb-2">
                Álbum
              </label>
              <input
                id="album"
                type="text"
                name="album"
                value={formData.album}
                onChange={handleInputChange}
                disabled={isUploading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre del álbum"
              />
            </div>

            <div>
              <label htmlFor="genero" className="block text-sm font-medium text-gray-700 mb-2">
                Género
              </label>
              <select
                id="genero"
                name="genero"
                value={formData.genero}
                onChange={handleInputChange}
                disabled={isUploading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar género</option>
                <option value="Rock">Rock</option>
                <option value="Pop">Pop</option>
                <option value="Hip Hop">Hip Hop</option>
                <option value="Electronic">Electronic</option>
                <option value="Jazz">Jazz</option>
                <option value="Classical">Classical</option>
                <option value="Country">Country</option>
                <option value="R&B">R&B</option>
                <option value="Latin">Latin</option>
                <option value="Alternative">Alternative</option>
                <option value="Indie">Indie</option>
                <option value="Folk">Folk</option>
                <option value="Reggae">Reggae</option>
                <option value="Blues">Blues</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label htmlFor="duracion" className="block text-sm font-medium text-gray-700 mb-2">
                Duración (segundos)
              </label>
              <input
                id="duracion"
                type="number"
                name="duracion"
                value={formData.duracion}
                onChange={handleInputChange}
                disabled={isUploading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="240"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              disabled={isUploading}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción opcional de la canción..."
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-4">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Cancelar
              </button>
            )}
            
            <button
              type="submit"
              disabled={isUploading || !audioFile || !formData.titulo || !formData.artista}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Subiendo...' : 'Subir Canción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
