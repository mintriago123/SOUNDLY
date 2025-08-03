/**
 * Configuración del Perfil de Artista con Upload de Música
 * 
 * NOTA IMPORTANTE: Para que funcione la subida de archivos, es necesario:
 * 1. Crear un bucket llamado 'music' en Supabase Storage
 * 2. Configurar las políticas RLS apropiadas:
 *    - INSERT: Solo artistas autenticados pueden subir a su carpeta
 *    - SELECT: Archivos públicos son accesibles por todos
 * 3. Configurar CORS en Supabase para permitir uploads desde tu dominio
 * 
 * Ejemplo de políticas RLS para el bucket 'music':
 * 
 * INSERT Policy:
 * CREATE POLICY "Artists can upload their music" ON storage.objects 
 * FOR INSERT WITH CHECK (
 *   bucket_id = 'music' AND 
 *   auth.uid()::text = (storage.foldername(name))[1] AND
 *   EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'artista')
 * );
 * 
 * SELECT Policy:
 * CREATE POLICY "Public music access" ON storage.objects 
 * FOR SELECT USING (bucket_id = 'music');
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/SupabaseProvider';
import DashboardLayout from '@/components/DashboardLayout';
import ThemeSelectorClean from '@/components/ThemeSelectorClean';
import {
  UserIcon,
  AtSymbolIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  MusicalNoteIcon,
  SparklesIcon,
  ArrowLeftIcon,
  CameraIcon,
  GlobeAltIcon,
  MapPinIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  PlayIcon,
  PauseIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface UserProfile {
  id: string;
  email?: string;
  nombre: string;
  rol: string;
  estado?: string;
  fecha_registro?: string;
}

interface ArtistaProfile {
  id?: string;
  usuario_id: string;
  nombre_artistico: string;
  biografia?: string;
  generos?: string[];
  pais?: string;
  ciudad?: string;
  website?: string;
  instagram?: string;
  twitter?: string;
  spotify?: string;
  foto_perfil_url?: string;
  portada_url?: string;
  verificado?: boolean;
}

interface CancionSubida {
  id?: string;
  titulo: string;
  album_id?: string;
  duracion: number;
  numero_pista?: number;
  genero: string;
  año: number;
  archivo_audio_url: string;
  imagen_url?: string;
  letra?: string;
  es_publica: boolean;
  estado: 'activa' | 'inactiva' | 'borrador';
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export default function PerfilPage() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [artistaProfile, setArtistaProfile] = useState<ArtistaProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    nombre_artistico: '',
    biografia: '',
    pais: '',
    ciudad: '',
    website: '',
    instagram: '',
    twitter: '',
    spotify: '',
    generos: [] as string[]
  });
  const [stats, setStats] = useState({
    totalCanciones: 0,
    totalAlbumes: 0,
    totalSeguidores: 0,
    tiempoEscucha: '0h 0m'
  });

  // Estados para manejo de archivos de música
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [cancionForm, setCancionForm] = useState({
    titulo: '',
    genero: '',
    año: new Date().getFullYear(),
    letra: '',
    es_publica: true,
    file: null as File | null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [misCanciones, setMisCanciones] = useState<any[]>([]);
  const [showMisCanciones, setShowMisCanciones] = useState(false);

  // Géneros musicales disponibles
  const generosDisponibles = [
    'Pop', 'Rock', 'Hip Hop', 'Reggaeton', 'Salsa', 'Bachata', 'Merengue',
    'Jazz', 'Blues', 'Country', 'Folk', 'Electrónica', 'House', 'Techno',
    'Reggae', 'Cumbia', 'Vallenato', 'Mariachi', 'Tango', 'Balada',
    'Funk', 'Soul', 'R&B', 'Gospel', 'Metal', 'Punk', 'Indie', 'Alternative'
  ];

  // Países disponibles (algunos principales)
  const paisesDisponibles = [
    'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica',
    'Cuba', 'Ecuador', 'El Salvador', 'España', 'Guatemala', 'Honduras',
    'México', 'Nicaragua', 'Panamá', 'Paraguay', 'Perú', 'Puerto Rico',
    'República Dominicana', 'Uruguay', 'Venezuela', 'Estados Unidos',
    'Canadá', 'Francia', 'Italia', 'Alemania', 'Reino Unido'
  ];

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        
        // Obtener usuario autenticado
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          setMessage({ type: 'error', text: 'Usuario no autenticado' });
          setIsLoading(false);
          return;
        }
        
        // Obtener datos del perfil desde la tabla usuarios
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', user.id)
          .single();

        if (userError) {
          console.error('Error de consulta de usuario:', userError);
          throw new Error('No se pudieron cargar los datos del perfil');
        }

        if (!userData) {
          throw new Error('No se encontró el perfil del usuario');
        }

        // Verificar que el usuario sea artista
        if (userData.rol !== 'artista') {
          setMessage({ type: 'error', text: 'Acceso denegado: Solo los artistas pueden acceder a esta página' });
          router.push('/dashboard');
          return;
        }

        // Combinar datos de auth y profile
        const combinedProfile: UserProfile = {
          ...userData,
          email: user.email || userData.email || ''
        };

        setProfile(combinedProfile);

        // Obtener o crear perfil de artista
        let { data: artistaData, error: artistaError } = await supabase
          .from('perfiles_artista')
          .select('*')
          .eq('usuario_id', user.id)
          .single();

        if (artistaError && artistaError.code === 'PGRST116') {
          // No existe perfil de artista, crear uno básico
          const { data: newArtista, error: createError } = await supabase
            .from('perfiles_artista')
            .insert({
              usuario_id: user.id,
              nombre_artistico: userData.nombre || 'Artista',
              biografia: '',
              generos: [],
              pais: '',
              ciudad: '',
              website: '',
              instagram: '',
              twitter: '',
              spotify: ''
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creando perfil de artista:', createError);
            throw new Error('Error al crear el perfil de artista');
          }
          artistaData = newArtista;
        } else if (artistaError) {
          console.error('Error cargando perfil artista:', artistaError);
          throw new Error('Error al cargar el perfil de artista');
        }

        setArtistaProfile(artistaData);
        setFormData({
          nombre: userData.nombre || '',
          nombre_artistico: artistaData?.nombre_artistico || '',
          biografia: artistaData?.biografia || '',
          pais: artistaData?.pais || '',
          ciudad: artistaData?.ciudad || '',
          website: artistaData?.website || '',
          instagram: artistaData?.instagram || '',
          twitter: artistaData?.twitter || '',
          spotify: artistaData?.spotify || '',
          generos: artistaData?.generos || []
        });

        // Obtener estadísticas del artista
        await loadUserStats(user.id);
        
        setMessage(null);
      } catch (error: any) {
        console.error('Error al cargar perfil:', error);
        setMessage({ 
          type: 'error', 
          text: error.message || 'Error al cargar los datos del perfil' 
        });
      } finally {
        setIsLoading(false);
      }
    };

    const loadUserStats = async (userId: string) => {
      try {
        // Primero obtener las canciones del artista
        const { data: cancionesData } = await supabase
          .from('canciones')
          .select('id')
          .eq('usuario_subida_id', userId);

        const cancionIds = cancionesData?.map(c => c.id) || [];

        const [albumesRes, seguidoresRes, historialRes] = await Promise.all([
          supabase.from('albumes').select('id').eq('usuario_id', userId),
          supabase.from('seguimientos').select('id').eq('artista_id', userId),
          cancionIds.length > 0 
            ? supabase.from('historial_reproduccion')
                .select('duracion_escuchada')
                .in('cancion_id', cancionIds)
            : Promise.resolve({ data: [] })
        ]);

        const totalMinutos = historialRes.data?.reduce((acc, item) => acc + (item.duracion_escuchada || 0), 0) || 0;
        const horas = Math.floor(totalMinutos / 3600);
        const minutos = Math.floor((totalMinutos % 3600) / 60);

        setStats({
          totalCanciones: cancionesData?.length || 0,
          totalAlbumes: albumesRes.data?.length || 0,
          totalSeguidores: seguidoresRes.data?.length || 0,
          tiempoEscucha: `${horas}h ${minutos}m`
        });
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
      }
    };

    loadProfile();
  }, [supabase, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Limpiar mensaje de error cuando el usuario empiece a escribir
    if (message?.type === 'error') {
      setMessage(null);
    }
  };

  const handleGeneroToggle = (genero: string) => {
    setFormData(prev => ({
      ...prev,
      generos: prev.generos.includes(genero)
        ? prev.generos.filter((g: string) => g !== genero)
        : [...prev.generos, genero].slice(0, 5) // Máximo 5 géneros
    }));

    if (message?.type === 'error') {
      setMessage(null);
    }
  };

  const validateForm = (): string | null => {
    if (!formData.nombre.trim()) {
      return 'El nombre es obligatorio';
    }
    
    if (!formData.nombre_artistico.trim()) {
      return 'El nombre artístico es obligatorio';
    }

    if (formData.biografia && formData.biografia.length > 500) {
      return 'La biografía no puede exceder 500 caracteres';
    }

    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
      return 'El sitio web debe comenzar con http:// o https://';
    }

    if (formData.generos.length > 5) {
      return 'Puedes seleccionar máximo 5 géneros';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }
    
    setIsSaving(true);
    setMessage(null);

    try {
      // Obtener usuario actual
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user?.id) {
        throw new Error('Usuario no autenticado');
      }

      // Actualizar tabla usuarios
      const { error: userError } = await supabase
        .from('usuarios')
        .update({
          nombre: formData.nombre.trim()
        })
        .eq('id', user.id);

      if (userError) {
        console.error('Error de actualización de usuario:', userError);
        throw new Error('Error al actualizar el perfil: ' + userError.message);
      }

      // Actualizar tabla perfiles_artista
      const { error: artistaError } = await supabase
        .from('perfiles_artista')
        .update({
          nombre_artistico: formData.nombre_artistico.trim(),
          biografia: formData.biografia.trim(),
          pais: formData.pais,
          ciudad: formData.ciudad.trim(),
          website: formData.website.trim(),
          instagram: formData.instagram.trim(),
          twitter: formData.twitter.trim(),
          spotify: formData.spotify.trim(),
          generos: formData.generos
        })
        .eq('usuario_id', user.id);

      if (artistaError) {
        console.error('Error de actualización de artista:', artistaError);
        throw new Error('Error al actualizar el perfil de artista: ' + artistaError.message);
      }

      // Recargar los datos actualizados
      const { data: updatedUserData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data: updatedArtistaData } = await supabase
        .from('perfiles_artista')
        .select('*')
        .eq('usuario_id', user.id)
        .single();

      if (updatedUserData) {
        setProfile({
          ...updatedUserData,
          email: user.email || updatedUserData.email || ''
        });
      }

      if (updatedArtistaData) {
        setArtistaProfile(updatedArtistaData);
      }

      setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
      
    } catch (error: any) {
      console.error('Error al actualizar perfil:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Error al actualizar el perfil' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Funciones para manejo de archivos de música
  const handleFileSelect = (files: FileList) => {
    const file = files[0];
    if (!file) return;

    // Validar tipo de archivo por extensión y MIME type
    const fileName = file.name.toLowerCase();
    const allowedExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'];
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg', 'audio/mp4'];
    
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    const hasValidMimeType = allowedTypes.includes(file.type);
    
    if (!hasValidExtension || !hasValidMimeType) {
      setMessage({ 
        type: 'error', 
        text: 'Formato de archivo no soportado. Use MP3, WAV, FLAC, AAC, OGG o M4A.' 
      });
      return;
    }

    // Validar tamaño (máximo 50MB según configuración del sistema)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setMessage({ 
        type: 'error', 
        text: `El archivo es demasiado grande (${(file.size / (1024 * 1024)).toFixed(1)}MB). Máximo permitido: 50MB.` 
      });
      return;
    }

    // Crear objeto de progreso
    const progressItem: UploadProgress = {
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    };
    setUploadProgress([progressItem]);

    // Obtener duración del audio
    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    
    audio.addEventListener('loadedmetadata', () => {
      const duration = Math.floor(audio.duration);
      
      // Validar duración (mínimo 30 segundos, máximo 10 minutos según configuración)
      if (duration < 30) {
        setMessage({ type: 'error', text: 'La canción debe durar al menos 30 segundos.' });
        URL.revokeObjectURL(audio.src);
        setUploadProgress([]);
        return;
      }
      if (duration > 600) {
        setMessage({ type: 'error', text: 'La canción no puede durar más de 10 minutos.' });
        URL.revokeObjectURL(audio.src);
        setUploadProgress([]);
        return;
      }

      // Actualizar progreso y establecer datos del formulario
      setUploadProgress([{ ...progressItem, progress: 100, status: 'processing' }]);
      
      setCancionForm(prev => ({
        ...prev,
        file: file,
        titulo: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") // Limpiar nombre
      }));
      
      setShowUploadModal(true);
      URL.revokeObjectURL(audio.src);
      
      // Limpiar progreso después de un momento
      setTimeout(() => setUploadProgress([]), 1000);
    });

    audio.addEventListener('error', () => {
      setMessage({ type: 'error', text: 'No se pudo procesar el archivo de audio. Verifique que sea un archivo válido.' });
      URL.revokeObjectURL(audio.src);
      setUploadProgress([]);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const uploadCancion = async () => {
    if (!cancionForm.file || !profile) return;

    setIsUploading(true);
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Usuario no autenticado');
      }

      // Validar límites diarios (esto se podría implementar consultando la configuración del sistema)
      const today = new Date().toISOString().split('T')[0];
      const { data: uploadsToday } = await supabase
        .from('canciones')
        .select('id')
        .eq('usuario_subida_id', user.id)
        .gte('created_at', today + 'T00:00:00.000Z')
        .lt('created_at', today + 'T23:59:59.999Z');

      if ((uploadsToday?.length || 0) >= 10) { // Límite de 10 por día según configuración
        throw new Error('Has alcanzado el límite diario de 10 canciones. Intenta mañana.');
      }

      // Generar nombre único para el archivo
      const fileExt = cancionForm.file.name.split('.').pop();
      const sanitizedTitle = cancionForm.titulo.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${user.id}/${Date.now()}-${sanitizedTitle}.${fileExt}`;

      // Crear progreso de upload
      const progressItem: UploadProgress = {
        fileName: cancionForm.file.name,
        progress: 0,
        status: 'uploading'
      };
      setUploadProgress([progressItem]);

      // Subir archivo a Supabase Storage con progreso
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('music')
        .upload(fileName, cancionForm.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error('Error al subir el archivo: ' + uploadError.message);
      }

      // Actualizar progreso
      setUploadProgress([{ ...progressItem, progress: 50, status: 'processing' }]);

      // Obtener URL pública del archivo
      const { data: urlData } = supabase.storage
        .from('music')
        .getPublicUrl(fileName);

      // Obtener duración del archivo
      const audio = new Audio();
      audio.src = URL.createObjectURL(cancionForm.file);
      
      audio.addEventListener('loadedmetadata', async () => {
        const duracion = Math.floor(audio.duration);
        URL.revokeObjectURL(audio.src);

        try {
          // Actualizar progreso
          setUploadProgress([{ ...progressItem, progress: 75, status: 'processing' }]);

          // Guardar metadatos en la base de datos
          const { error: dbError } = await supabase
            .from('canciones')
            .insert({
              titulo: cancionForm.titulo.trim(),
              duracion: duracion,
              genero: cancionForm.genero,
              año: cancionForm.año,
              archivo_audio_url: urlData.publicUrl,
              letra: cancionForm.letra.trim(),
              es_publica: cancionForm.es_publica,
              usuario_subida_id: user.id,
              estado: 'borrador', // Requiere aprobación según configuración
              reproducciones: 0,
              favoritos: 0,
              descargas: 0
            });

          if (dbError) {
            // Si falla la DB, eliminar archivo subido
            await supabase.storage.from('music').remove([fileName]);
            throw new Error('Error al guardar los metadatos: ' + dbError.message);
          }

          // Completar progreso
          setUploadProgress([{ ...progressItem, progress: 100, status: 'complete' }]);

          setMessage({ 
            type: 'success', 
            text: 'Canción subida exitosamente. Está pendiente de aprobación y será visible una vez aprobada.' 
          });
          
          setShowUploadModal(false);
          setCancionForm({
            titulo: '',
            genero: '',
            año: new Date().getFullYear(),
            letra: '',
            es_publica: true,
            file: null
          });
          
          // Recargar estadísticas
          await loadUserStatsRefresh(user.id);
          
          // Recargar lista de canciones si está visible
          if (showMisCanciones) {
            await loadMisCanciones(user.id);
          }

          // Limpiar progreso después de mostrar éxito
          setTimeout(() => setUploadProgress([]), 3000);
          
        } catch (dbError: any) {
          setUploadProgress([{ ...progressItem, progress: 0, status: 'error', error: dbError.message }]);
          throw dbError;
        }
      });

      audio.addEventListener('error', () => {
        throw new Error('Error procesando el archivo de audio');
      });
      
    } catch (error: any) {
      console.error('Error subiendo canción:', error);
      setMessage({ type: 'error', text: error.message || 'Error al subir la canción' });
      
      // Actualizar progreso con error
      setUploadProgress(prev => 
        prev.map(item => ({ ...item, status: 'error', error: error.message }))
      );
    } finally {
      setIsUploading(false);
    }
  };

  const loadMisCanciones = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('canciones')
        .select('id, titulo, genero, año, duracion, estado, reproducciones, created_at')
        .eq('usuario_subida_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando canciones:', error);
        return;
      }

      setMisCanciones(data || []);
    } catch (error) {
      console.error('Error cargando canciones:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activa':
        return 'bg-green-100 text-green-800';
      case 'borrador':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactiva':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'activa':
        return 'Publicada';
      case 'borrador':
        return 'Pendiente';
      case 'inactiva':
        return 'Rechazada';
      default:
        return estado;
    }
  };

  const loadUserStatsRefresh = async (userId: string) => {
    try {
      // Primero obtener las canciones del artista
      const { data: cancionesData } = await supabase
        .from('canciones')
        .select('id')
        .eq('usuario_subida_id', userId);

      const cancionIds = cancionesData?.map(c => c.id) || [];

      const [albumesRes, seguidoresRes, historialRes] = await Promise.all([
        supabase.from('albumes').select('id').eq('usuario_id', userId),
        supabase.from('seguimientos').select('id').eq('artista_id', userId),
        cancionIds.length > 0 
          ? supabase.from('historial_reproduccion')
              .select('duracion_escuchada')
              .in('cancion_id', cancionIds)
          : Promise.resolve({ data: [] })
      ]);

      const totalMinutos = historialRes.data?.reduce((acc, item) => acc + (item.duracion_escuchada || 0), 0) || 0;
      const horas = Math.floor(totalMinutos / 3600);
      const minutos = Math.floor((totalMinutos % 3600) / 60);

      setStats({
        totalCanciones: cancionesData?.length || 0,
        totalAlbumes: albumesRes.data?.length || 0,
        totalSeguidores: seguidoresRes.data?.length || 0,
        tiempoEscucha: `${horas}h ${minutos}m`
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'admin':
        return { color: 'bg-blue-500', label: 'Administrador', icon: '👑' };
      case 'premium':
        return { color: 'bg-gradient-to-r from-purple-500 to-pink-500', label: 'Premium', icon: '💎' };
      default:
        return { color: 'bg-gray-500', label: 'Usuario Gratuito', icon: '🎵' };
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando perfil...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <ExclamationCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar el perfil</h2>
            <p className="text-gray-600 mb-6">No se pudieron cargar los datos del perfil.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header con navegación */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Volver
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">Perfil de Artista</h1>
          <p className="text-gray-600 mt-2">
            Configura tu información como artista en Soundly
          </p>
        </div>

        {/* Mensaje de estado */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
            ) : (
              <ExclamationCircleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información del perfil */}
          <div className="lg:col-span-1 space-y-6">
            {/* Avatar y datos básicos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                {/* Avatar */}
                <div className="relative inline-block">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg ${getRoleInfo(profile.rol).color}`}>
                    {getUserInitials(artistaProfile?.nombre_artistico || profile.nombre)}
                  </div>
                  <button 
                    className="absolute bottom-0 right-0 bg-gray-600 text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
                    title="Cambiar foto (Próximamente)"
                  >
                    <CameraIcon className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  {artistaProfile?.nombre_artistico || profile.nombre || 'Artista'}
                </h3>
                <div className="flex items-center justify-center mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getRoleInfo(profile.rol).color}`}>
                    {getRoleInfo(profile.rol).icon} {getRoleInfo(profile.rol).label}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-2">
                  {profile.email}
                </p>
              </div>

              {/* Información adicional */}
              <div className="mt-6 space-y-3 border-t border-gray-100 pt-4">
                <div className="flex items-center text-sm text-gray-600">
                  <MusicalNoteIcon className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Miembro desde: </span>
                  <span className="font-medium ml-1">
                    {formatDate(profile.fecha_registro)}
                  </span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircleIcon className="w-4 h-4 mr-2 text-green-500" />
                  <span>Estado: </span>
                  <span className="font-medium ml-1 text-green-600">
                    {profile.estado || 'Activo'}
                  </span>
                </div>

                {/* {profile.artista_favorito && (
                  <div className="flex items-center text-sm text-gray-600">
                    <HeartIcon className="w-4 h-4 mr-2 text-red-500" />
                    <span>Artista favorito: </span>
                    <span className="font-medium ml-1">{profile.artista_favorito}</span>
                  </div>
                )} */}

                {artistaProfile?.pais && (
                  <div className="flex items-center text-sm text-gray-600">
                    <GlobeAltIcon className="w-4 h-4 mr-2 text-blue-500" />
                    <span>País: </span>
                    <span className="font-medium ml-1">
                      {artistaProfile.pais}
                      {artistaProfile.ciudad && `, ${artistaProfile.ciudad}`}
                    </span>
                  </div>
                )}

                {artistaProfile?.generos && artistaProfile.generos.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <div className="flex items-start">
                      <MusicalNoteIcon className="w-4 h-4 mr-2 text-purple-500 mt-0.5" />
                      <div>
                        <span>Géneros: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {artistaProfile.generos.slice(0, 3).map((genero: string) => (
                            <span key={genero} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                              {genero}
                            </span>
                          ))}
                          {artistaProfile.generos.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{artistaProfile.generos.length - 3} más
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Estadísticas musicales */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                <SparklesIcon className="w-5 h-5 mr-2" />
                Tus Estadísticas
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-700">{stats.totalCanciones}</div>
                  <div className="text-xs text-purple-600">Canciones</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-700">{stats.totalAlbumes}</div>
                  <div className="text-xs text-purple-600">Álbumes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-700">{stats.totalSeguidores}</div>
                  <div className="text-xs text-purple-600">Seguidores</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-700">{stats.tiempoEscucha}</div>
                  <div className="text-xs text-purple-600">Reproducciones</div>
                </div>
              </div>
            </div>



            {/* Upgrade a Premium (solo para usuarios gratuitos) */}
            {(!profile.rol || profile.rol === 'usuario') && (
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
                <div className="text-center">
                  <SparklesIcon className="w-8 h-8 mx-auto mb-3" />
                  <h3 className="font-bold text-lg mb-2">¡Actualiza a Premium!</h3>
                  <p className="text-purple-100 text-sm mb-4">
                    Desbloquea música HD, descargas ilimitadas y más
                  </p>
                  <button
                    onClick={() => router.push('/dashboard/upgrade')}
                    className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors"
                  >
                    Ver Planes
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Formulario de edición */}
          <div className="lg:col-span-2">
            <div className="rounded-xl shadow-sm border p-6" style={{
              backgroundColor: 'var(--card)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)'
            }}>
              <h2 className="text-xl font-semibold mb-6 flex items-center" style={{ color: 'var(--foreground)' }}>
                <UserIcon className="w-6 h-6 mr-2" style={{ color: 'var(--foreground)' }} />
                Información del Artista
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nombre de usuario */}
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre de Usuario *
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Tu nombre de usuario"
                      required
                    />
                  </div>
                </div>

                {/* Nombre artístico */}
                <div>
                  <label htmlFor="nombre_artistico" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre Artístico *
                  </label>
                  <div className="relative">
                    <MusicalNoteIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      id="nombre_artistico"
                      name="nombre_artistico"
                      value={formData.nombre_artistico}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Tu nombre como artista"
                      required
                    />
                  </div>
                </div>

                {/* Email (solo lectura) */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email (Solo lectura)
                  </label>
                  <div className="relative">
                    <AtSymbolIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      value={profile?.email || ''}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-lg bg-gray-50 text-gray-500"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    El email está vinculado a tu cuenta de autenticación
                  </p>
                </div>

                {/* Biografía */}
                <div>
                  <label htmlFor="biografia" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Biografía Musical
                  </label>
                  <div className="relative">
                    <DocumentTextIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      id="biografia"
                      name="biografia"
                      value={formData.biografia}
                      onChange={handleInputChange}
                      rows={4}
                      maxLength={500}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      placeholder="Cuéntanos sobre tu música y tu carrera artística..."
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formData.biografia.length}/500 caracteres
                  </p>
                </div>

                {/* Ubicación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* País */}
                  <div>
                    <label htmlFor="pais" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      País
                    </label>
                    <div className="relative">
                      <GlobeAltIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        id="pais"
                        name="pais"
                        value={formData.pais}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Selecciona tu país</option>
                        {paisesDisponibles.map((pais) => (
                          <option key={pais} value={pais}>{pais}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Ciudad */}
                  <div>
                    <label htmlFor="ciudad" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ciudad
                    </label>
                    <div className="relative">
                      <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        id="ciudad"
                        name="ciudad"
                        value={formData.ciudad}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Tu ciudad"
                      />
                    </div>
                  </div>
                </div>

                {/* Redes sociales y web */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sitio web */}
                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sitio Web
                    </label>
                    <div className="relative">
                      <GlobeAltIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="url"
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="https://tu-sitio-web.com"
                      />
                    </div>
                  </div>

                  {/* Instagram */}
                  <div>
                    <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Instagram
                    </label>
                    <div className="relative">
                      <AtSymbolIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        id="instagram"
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="tu_usuario_instagram"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Twitter */}
                  <div>
                    <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Twitter
                    </label>
                    <div className="relative">
                      <AtSymbolIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        id="twitter"
                        name="twitter"
                        value={formData.twitter}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="tu_usuario_twitter"
                      />
                    </div>
                  </div>

                  {/* Spotify */}
                  <div>
                    <label htmlFor="spotify" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Spotify
                    </label>
                    <div className="relative">
                      <MusicalNoteIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        id="spotify"
                        name="spotify"
                        value={formData.spotify}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Tu perfil de Spotify"
                      />
                    </div>
                  </div>
                </div>

                {/* Géneros musicales */}
                <div>
                  <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Géneros Musicales (máximo 5)
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {generosDisponibles.map((genero) => (
                      <label key={genero} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.generos.includes(genero)}
                          onChange={() => handleGeneroToggle(genero)}
                          disabled={!formData.generos.includes(genero) && formData.generos.length >= 5}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{genero}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {formData.generos.length}/5 géneros seleccionados
                  </p>
                </div>

                {/* Botón de guardar */}
                <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Selector de Tema */}
            <div className="mt-6">
              <ThemeSelectorClean />
            </div>
          </div>
        </div>

        {/* Modal para metadatos de la canción */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Información de la Canción
                  </h3>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Título */}
                  <div>
                    <label htmlFor="cancion-titulo" className="block text-sm font-medium text-gray-700 mb-2">
                      Título de la Canción *
                    </label>
                    <input
                      type="text"
                      id="cancion-titulo"
                      value={cancionForm.titulo}
                      onChange={(e) => setCancionForm(prev => ({ ...prev, titulo: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nombre de tu canción"
                      required
                    />
                  </div>

                  {/* Género */}
                  <div>
                    <label htmlFor="cancion-genero" className="block text-sm font-medium text-gray-700 mb-2">
                      Género Musical *
                    </label>
                    <select
                      id="cancion-genero"
                      value={cancionForm.genero}
                      onChange={(e) => setCancionForm(prev => ({ ...prev, genero: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Selecciona un género</option>
                      {generosDisponibles.map((genero) => (
                        <option key={genero} value={genero}>{genero}</option>
                      ))}
                    </select>
                  </div>

                  {/* Año */}
                  <div>
                    <label htmlFor="cancion-año" className="block text-sm font-medium text-gray-700 mb-2">
                      Año de Lanzamiento
                    </label>
                    <input
                      type="number"
                      id="cancion-año"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={cancionForm.año}
                      onChange={(e) => setCancionForm(prev => ({ ...prev, año: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Letra */}
                  <div>
                    <label htmlFor="cancion-letra" className="block text-sm font-medium text-gray-700 mb-2">
                      Letra (Opcional)
                    </label>
                    <textarea
                      id="cancion-letra"
                      rows={6}
                      value={cancionForm.letra}
                      onChange={(e) => setCancionForm(prev => ({ ...prev, letra: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Letra de la canción..."
                    />
                  </div>

                  {/* Opciones de privacidad */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="cancion-publica"
                      checked={cancionForm.es_publica}
                      onChange={(e) => setCancionForm(prev => ({ ...prev, es_publica: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="cancion-publica" className="ml-2 text-sm text-gray-700">
                      Hacer pública (visible para todos los usuarios)
                    </label>
                  </div>

                  {/* Información del archivo */}
                  {cancionForm.file && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Información del Archivo:</h4>
                      <div className="text-xs text-gray-600 space-y-1">
                        <p><strong>Nombre:</strong> {cancionForm.file.name}</p>
                        <p><strong>Tamaño:</strong> {(cancionForm.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                        <p><strong>Tipo:</strong> {cancionForm.file.type}</p>
                      </div>
                    </div>
                  )}

                  {/* Nota sobre aprobación */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <ExclamationCircleIcon className="w-5 h-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                      <div className="text-sm text-yellow-700">
                        <p className="font-medium mb-1">Proceso de Aprobación</p>
                        <p>Tu canción será revisada por nuestro equipo antes de ser publicada. Este proceso puede tomar hasta 24 horas.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    disabled={isUploading}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={uploadCancion}
                    disabled={isUploading || !cancionForm.titulo.trim() || !cancionForm.genero}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                        Subir Canción
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}