'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { useSupabase } from '@/components/SupabaseProvider';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { CloudArrowDownIcon, DevicePhoneMobileIcon, ServerStackIcon, CloudIcon, LightBulbIcon, PlayIcon, PauseIcon, TrashIcon, ArrowPathIcon, WifiIcon, SignalSlashIcon, MagnifyingGlassIcon, PlusIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

// Interfaz para canciones disponibles para descargar
interface AvailableSong {
  id: string;
  titulo: string;
  artista: string;
  album?: string;
  duracion: string;
  archivo_audio: string;
  imagen_url?: string;
  usuario_id: string;
  created_at: string;
}

// Interfaz para las canciones descargadas
interface DownloadedSong {
  id: string;
  titulo: string;
  artista: string;
  album?: string;
  duracion: string;
  archivo_url: string;
  imagen_url?: string;
  downloaded_at: string;
  file_size: number;
  usuario_id: string;
}

// Interfaz para estadísticas de descarga
interface DownloadStats {
  total_songs: number;
  total_size: number;
  available_space: number;
}

export default function DownloadsPage() {
  const [downloadedSongs, setDownloadedSongs] = useState<DownloadedSong[]>([]);
  const [availableSongs, setAvailableSongs] = useState<AvailableSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'downloaded' | 'search'>('downloaded');
  const [downloadStats, setDownloadStats] = useState<DownloadStats>({
    total_songs: 0,
    total_size: 0,
    available_space: 0
  });
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [showConnectionBanner, setShowConnectionBanner] = useState(false);
  
  const { supabase } = useSupabase();
  const { currentSong, isPlaying, playSong, pauseSong } = useMusicPlayer();

  // Configuración de clases CSS
  const themeClasses = {
    bg: 'bg-white',
    bgCard: 'bg-white',
    bgHover: 'hover:bg-gray-50',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    textMuted: 'text-gray-500',
    border: 'border-gray-200',
  };

  useEffect(() => {
    // Obtener usuario actual
    const getCurrentUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.warn('Error obteniendo usuario:', error);
          // No establecer user como null inmediatamente si hay error de red
          if (error.message !== 'Failed to fetch' && !error.message.includes('network')) {
            setUser(null);
          }
        } else {
          setUser(user);
        }
      } catch (error) {
        console.warn('Error general obteniendo usuario:', error);
        // Solo limpiar usuario si no es un error de conectividad
        const errorMsg = error instanceof Error ? error.message : '';
        if (!errorMsg.includes('fetch') && !errorMsg.includes('network')) {
          setUser(null);
        }
      }
    };
    
    getCurrentUser();
    
    // Detectar estado de conectividad mejorado
    const checkOnlineStatus = async () => {
      const previousStatus = isOnline;
      setConnectionStatus('checking');
      
      // Verificación inicial con navigator.onLine
      let online = navigator.onLine;
      
      if (online) {
        // Verificación adicional haciendo una request real
        try {
          const response = await fetch('https://www.google.com/favicon.ico', { 
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-cache',
            signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
          });
          online = true;
        } catch (error) {
          console.log('Verificación de conectividad falló, asumiendo offline');
          online = false;
        }
      }
      
      setIsOnline(online);
      setConnectionStatus(online ? 'online' : 'offline');
      
      // Mostrar banner solo si cambió el estado
      if (previousStatus !== null && previousStatus !== online) {
        setShowConnectionBanner(true);
        setTimeout(() => setShowConnectionBanner(false), 4000);
      }
      
      console.log(`🌐 Estado de conexión: ${online ? 'EN LÍNEA' : 'SIN CONEXIÓN'}`);
    };
    
    // Verificar estado inicial
    checkOnlineStatus();
    
    const handleOnline = () => {
      console.log('🟢 Evento: Conexión restaurada');
      checkOnlineStatus();
      // Revalidar usuario cuando vuelva la conexión
      setTimeout(getCurrentUser, 1000);
      setTimeout(syncWithServer, 2000);
    };
    
    const handleOffline = () => {
      console.log('🔴 Evento: Conexión perdida');
      setIsOnline(false);
    };
    
    // Verificación periódica cada 30 segundos
    const connectivityInterval = setInterval(checkOnlineStatus, 30000);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Verificar conectividad al hacer focus en la ventana
    const handleFocus = () => {
      setTimeout(checkOnlineStatus, 500);
    };
    window.addEventListener('focus', handleFocus);
    
    // Inicializar IndexedDB y cargar datos
    initializeStorage();
    
    return () => {
      clearInterval(connectivityInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadDownloadedSongs();
    }
  }, [user]);

  // Inicializar IndexedDB
  const initializeStorage = async () => {
    try {
      const dbRequest = indexedDB.open('SoundlyOfflineDB', 1);
      
      dbRequest.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Store para metadatos de canciones
        if (!db.objectStoreNames.contains('downloaded_songs')) {
          const songsStore = db.createObjectStore('downloaded_songs', { keyPath: 'id' });
          songsStore.createIndex('usuario_id', 'usuario_id', { unique: false });
          songsStore.createIndex('downloaded_at', 'downloaded_at', { unique: false });
        }
        
        // Store para archivos de audio
        if (!db.objectStoreNames.contains('audio_files')) {
          db.createObjectStore('audio_files', { keyPath: 'id' });
        }
        
        // Store para imágenes
        if (!db.objectStoreNames.contains('image_files')) {
          db.createObjectStore('image_files', { keyPath: 'id' });
        }
      };
      
      dbRequest.onsuccess = () => {
        console.log('IndexedDB inicializada correctamente');
      };
      
      dbRequest.onerror = (error) => {
        console.error('Error inicializando IndexedDB:', error);
      };
    } catch (error) {
      console.error('Error general inicializando almacenamiento:', error);
    }
  };

  // Cargar canciones descargadas desde IndexedDB
  const loadDownloadedSongs = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        setDownloadedSongs([]);
        return;
      }

      const dbRequest = indexedDB.open('SoundlyOfflineDB', 1);
      
      dbRequest.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['downloaded_songs'], 'readonly');
        const store = transaction.objectStore('downloaded_songs');
        const index = store.index('usuario_id');
        const request = index.getAll(user.id);
        
        request.onsuccess = () => {
          const songs = request.result;
          setDownloadedSongs(songs);
          
          // Calcular estadísticas
          const stats = {
            total_songs: songs.length,
            total_size: songs.reduce((sum, song) => sum + song.file_size, 0),
            available_space: Infinity // Para premium es ilimitado
          };
          setDownloadStats(stats);
          
          console.log('Canciones descargadas cargadas:', songs.length);
        };
        
        request.onerror = (error) => {
          console.error('Error cargando canciones descargadas:', error);
          setDownloadedSongs([]);
        };
      };
      
      dbRequest.onerror = (error) => {
        console.error('Error accediendo a IndexedDB:', error);
        setDownloadedSongs([]);
      };
      
    } catch (error) {
      console.error('Error general cargando canciones:', error);
      setDownloadedSongs([]);
    } finally {
      setLoading(false);
    }
  };

  // Buscar canciones disponibles para descargar
  const searchAvailableSongs = async (query: string = '') => {
    try {
      if (!user || !isOnline) {
        setAvailableSongs([]);
        return;
      }

      setSearchLoading(true);
      
      // Construir la consulta base con los nombres correctos de campos
      let supabaseQuery = supabase
        .from('canciones')
        .select('id, titulo, genero, duracion, archivo_audio_url, imagen_url, usuario_subida_id, created_at, es_publica')
        .eq('es_publica', true) // Solo canciones públicas
        .eq('estado', 'activa') // Solo canciones activas
        .order('created_at', { ascending: false })
        .limit(50);

      // Aplicar filtro de búsqueda si existe
      if (query.trim()) {
        supabaseQuery = supabaseQuery.or(`titulo.ilike.%${query}%,genero.ilike.%${query}%`);
      }

      console.log('Ejecutando consulta de canciones...');
      const { data: songs, error } = await supabaseQuery;

      if (error) {
        console.error('Error en consulta Supabase:', error);
        setAvailableSongs([]);
        return;
      }

      console.log('Canciones obtenidas:', songs?.length || 0);

      if (!songs || songs.length === 0) {
        console.log('No hay canciones disponibles');
        setAvailableSongs([]);
        return;
      }

      // Obtener información de artistas para cada canción
      console.log('Obteniendo información de artistas...');
      const songsWithArtists = await Promise.all(
        songs.map(async (song) => {
          let artista = 'Artista desconocido';
          
          if (song.usuario_subida_id) {
            try {
              const { data: userData, error: userError } = await supabase
                .from('usuarios')
                .select('nombre, email')
                .eq('id', song.usuario_subida_id)
                .single();
              
              if (userError) {
                console.warn('Error obteniendo usuario:', userError.message);
              } else if (userData?.nombre) {
                artista = userData.nombre;
              } else if (userData?.email) {
                // Si no hay nombre, usar la parte antes del @ del email
                artista = userData.email.split('@')[0];
              }
            } catch (error) {
              console.warn('Error obteniendo artista para canción:', song.id, error);
            }
          }

          return {
            id: song.id,
            titulo: song.titulo || 'Título desconocido',
            artista: artista,
            album: song.genero || 'Sin género', // Usar género como "álbum" temporalmente
            duracion: song.duracion ? `${Math.floor(song.duracion / 60)}:${(song.duracion % 60).toString().padStart(2, '0')}` : '0:00',
            archivo_audio: song.archivo_audio_url || '',
            imagen_url: song.imagen_url,
            usuario_id: song.usuario_subida_id,
            created_at: song.created_at
          } as AvailableSong;
        })
      );

      console.log('Canciones procesadas:', songsWithArtists.length);
      setAvailableSongs(songsWithArtists);
      
    } catch (error) {
      console.error('Error general buscando canciones:', error);
      // Mostrar más detalles del error
      if (error instanceof Error) {
        console.error('Mensaje del error:', error.message);
        console.error('Stack trace:', error.stack);
      }
      setAvailableSongs([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Verificar si una canción ya está descargada
  const isSongDownloaded = (songId: string): boolean => {
    return downloadedSongs.some(song => song.id === songId);
  };

  // Manejar búsqueda con debounce
  useEffect(() => {
    if (activeTab === 'search' && user && isOnline) {
      const timeoutId = setTimeout(() => {
        searchAvailableSongs(searchTerm);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, activeTab, user, isOnline]);

  // Descargar una canción (actualizada para funcionar con ambas fuentes)
  const downloadSong = async (songData: AvailableSong | { id: string }) => {
    try {
      if (!user || !isOnline) {
        alert('Necesitas estar conectado a internet para descargar música');
        return;
      }

      const songId = songData.id;
      
      // Verificar si ya está descargada ANTES de iniciar
      if (isSongDownloaded(songId)) {
        alert('Esta canción ya está descargada');
        return;
      }
      
      // Verificar si ya se está descargando
      if (downloadingIds.has(songId)) {
        console.log('La canción ya se está descargando');
        return;
      }
      
      setDownloadingIds(prev => new Set([...prev, songId]));
      
      // Si songData solo tiene id, obtener datos completos desde Supabase
      let fullSongData: AvailableSong;
      
      if ('titulo' in songData) {
        fullSongData = songData as AvailableSong;
      } else {
        const { data: fetchedSong, error: songError } = await supabase
          .from('canciones')
          .select('*')
          .eq('id', songId)
          .single();

        if (songError || !fetchedSong) {
          console.error('Error obteniendo datos de canción:', songError);
          alert('Error al obtener información de la canción');
          return;
        }

        // Obtener información del artista
        let artista = 'Artista desconocido';
        if (fetchedSong.usuario_subida_id) {
          try {
            const { data: userData } = await supabase
              .from('usuarios')
              .select('nombre, email')
              .eq('id', fetchedSong.usuario_subida_id)
              .single();
            
            if (userData?.nombre) {
              artista = userData.nombre;
            } else if (userData?.email) {
              artista = userData.email.split('@')[0];
            }
          } catch (error) {
            console.warn('Error obteniendo artista:', error);
          }
        }

        fullSongData = {
          id: fetchedSong.id,
          titulo: fetchedSong.titulo,
          artista: artista,
          album: fetchedSong.genero,
          duracion: fetchedSong.duracion ? `${Math.floor(fetchedSong.duracion / 60)}:${(fetchedSong.duracion % 60).toString().padStart(2, '0')}` : '0:00',
          archivo_audio: fetchedSong.archivo_audio_url,
          imagen_url: fetchedSong.imagen_url,
          usuario_id: fetchedSong.usuario_subida_id,
          created_at: fetchedSong.created_at
        } as AvailableSong;
      }

      // Verificar una vez más si ya está descargada después de obtener los datos
      if (isSongDownloaded(songId)) {
        alert('Esta canción ya está descargada');
        return;
      }

      // Descargar archivo de audio
      let audioBlob: Blob | null = null;
      let imageBlob: Blob | null = null;
      let fileSize = 0;

      if (fullSongData.archivo_audio) {
        try {
          const audioResponse = await fetch(fullSongData.archivo_audio);
          if (audioResponse.ok) {
            audioBlob = await audioResponse.blob();
            fileSize += audioBlob.size;
          }
        } catch (error) {
          console.error('Error descargando audio:', error);
        }
      }

      // Descargar imagen si existe
      if (fullSongData.imagen_url) {
        try {
          const imageResponse = await fetch(fullSongData.imagen_url);
          if (imageResponse.ok) {
            imageBlob = await imageResponse.blob();
            fileSize += imageBlob.size;
          }
        } catch (error) {
          console.warn('Error descargando imagen:', error);
        }
      }

      if (!audioBlob) {
        alert('No se pudo descargar el archivo de audio');
        return;
      }

      // Guardar en IndexedDB
      const dbRequest = indexedDB.open('SoundlyOfflineDB', 1);
      
      dbRequest.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['downloaded_songs', 'audio_files', 'image_files'], 'readwrite');
        
        // Guardar metadatos
        const songsStore = transaction.objectStore('downloaded_songs');
        const downloadedSong: DownloadedSong = {
          id: fullSongData.id,
          titulo: fullSongData.titulo,
          artista: fullSongData.artista,
          album: fullSongData.album,
          duracion: fullSongData.duracion || '0:00',
          archivo_url: fullSongData.archivo_audio,
          imagen_url: fullSongData.imagen_url,
          downloaded_at: new Date().toISOString(),
          file_size: fileSize,
          usuario_id: user.id
        };
        
        songsStore.put(downloadedSong);
        
        // Guardar archivo de audio
        const audioStore = transaction.objectStore('audio_files');
        audioStore.put({
          id: songId,
          blob: audioBlob
        });
        
        // Guardar imagen si existe
        if (imageBlob) {
          const imageStore = transaction.objectStore('image_files');
          imageStore.put({
            id: songId,
            blob: imageBlob
          });
        }
        
        transaction.oncomplete = () => {
          console.log('Canción descargada exitosamente:', fullSongData.titulo);
          loadDownloadedSongs(); // Recargar la lista
          
          // Actualizar la lista de canciones disponibles para reflejar el estado de descarga
          if (activeTab === 'search') {
            searchAvailableSongs(searchTerm);
          }
        };
        
        transaction.onerror = (error) => {
          console.error('Error guardando en IndexedDB:', error);
          alert('Error al guardar la canción descargada');
        };
      };
      
    } catch (error) {
      console.error('Error general descargando canción:', error);
      alert('Error al descargar la canción');
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(songData.id);
        return newSet;
      });
    }
  };

  // Eliminar una canción descargada
  const deleteSong = async (songId: string) => {
    try {
      if (!confirm('¿Estás seguro de que quieres eliminar esta canción descargada?')) {
        return;
      }

      const dbRequest = indexedDB.open('SoundlyOfflineDB', 1);
      
      dbRequest.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['downloaded_songs', 'audio_files', 'image_files'], 'readwrite');
        
        // Eliminar metadatos
        const songsStore = transaction.objectStore('downloaded_songs');
        songsStore.delete(songId);
        
        // Eliminar archivo de audio
        const audioStore = transaction.objectStore('audio_files');
        audioStore.delete(songId);
        
        // Eliminar imagen
        const imageStore = transaction.objectStore('image_files');
        imageStore.delete(songId);
        
        transaction.oncomplete = () => {
          console.log('Canción eliminada exitosamente');
          loadDownloadedSongs(); // Recargar la lista
        };
        
        transaction.onerror = (error) => {
          console.error('Error eliminando canción:', error);
          alert('Error al eliminar la canción');
        };
      };
      
    } catch (error) {
      console.error('Error general eliminando canción:', error);
      alert('Error al eliminar la canción');
    }
  };

  // Sincronizar con el servidor
  const syncWithServer = async () => {
    try {
      if (!isOnline || !user) {
        console.log('No se puede sincronizar: sin conexión o sin usuario');
        return;
      }
      
      setIsSyncing(true);
      console.log('Sincronizando con el servidor...');
      
      // Solo recargar descargas locales, no hacer llamadas a Supabase innecesarias
      await loadDownloadedSongs();
      
      console.log('Sincronización completada');
    } catch (error) {
      console.error('Error durante la sincronización:', error);
      // No mostrar errores al usuario por problemas de sincronización
    } finally {
      setIsSyncing(false);
    }
  };

  // Reproducir canción offline usando el reproductor global
  const playOfflineSong = async (songId: string) => {
    try {
      // Encontrar la canción en la lista de descargadas
      const song = downloadedSongs.find(s => s.id === songId);
      if (!song) {
        alert('Canción no encontrada');
        return;
      }

      const dbRequest = indexedDB.open('SoundlyOfflineDB', 1);
      
      dbRequest.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['audio_files'], 'readonly');
        const store = transaction.objectStore('audio_files');
        const request = store.get(songId);
        
        request.onsuccess = () => {
          const result = request.result;
          if (result && result.blob) {
            // Crear URL del blob
            const audioUrl = URL.createObjectURL(result.blob);
            
            // Crear objeto de canción para el reproductor global
            const songForPlayer = {
              id: song.id,
              titulo: song.titulo,
              artista: song.artista,
              album: song.album || '',
              genero: 'Offline', // Valor por defecto para canciones offline
              duracion: parseFloat(song.duracion) || 0, // Convertir a número
              url_archivo: audioUrl,
              archivo_audio_url: audioUrl, // Para compatibilidad
              imagen_url: song.imagen_url || '',
              usuario_id: song.usuario_id,
              created_at: song.downloaded_at
            };

            console.log('🎵 Reproduciendo canción offline con reproductor global:', song.titulo);
            
            // Si ya está reproduciendo esta canción, pausar/reanudar
            if (currentSong?.id === songId) {
              if (isPlaying) {
                pauseSong();
              } else {
                // Para reanudar, necesitamos volver a reproducir porque el blob URL puede haber cambiado
                playSong(songForPlayer, [songForPlayer]);
              }
            } else {
              // Reproducir nueva canción (esto automáticamente detiene la anterior)
              playSong(songForPlayer, [songForPlayer]);
            }
            
            // Limpiar URL anterior si existe y crear nueva referencia
            setTimeout(() => {
              // Solo revocar si no es la canción actual
              if (currentSong?.id !== songId) {
                URL.revokeObjectURL(audioUrl);
              }
            }, 60000);
          } else {
            alert('Archivo de audio no encontrado localmente');
          }
        };
        
        request.onerror = (error) => {
          console.error('Error obteniendo archivo de audio:', error);
          alert('Error al acceder al archivo de audio');
        };
      };
      
      dbRequest.onerror = (error) => {
        console.error('Error abriendo base de datos:', error);
        alert('Error al acceder a la base de datos local');
      };
      
    } catch (error) {
      console.error('Error reproduciendo canción offline:', error);
      alert('Error al reproducir la canción');
    }
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Banner de estado de conectividad */}
        {showConnectionBanner && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-500 transform ${
            isOnline 
              ? 'bg-green-500 text-white translate-y-0' 
              : 'bg-red-500 text-white translate-y-0'
          }`}>
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <>
                  <WifiIcon className="w-5 h-5" />
                  <span className="font-medium">¡Conexión restaurada!</span>
                </>
              ) : (
                <>
                  <SignalSlashIcon className="w-5 h-5" />
                  <span className="font-medium">Conexión perdida</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CloudArrowDownIcon className="w-8 h-8 text-white drop-shadow" />
              <div>
                <h1 className="text-2xl font-bold">Mis Descargas</h1>
                <p className="text-pink-100">Música disponible sin conexión</p>
              </div>
            </div>
            
            {/* Indicador de conectividad mejorado */}
            <div className="flex items-center space-x-3">
              {/* Estado de sincronización */}
              {isSyncing && (
                <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-100">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-300 border-t-transparent"></div>
                  <span className="text-sm">Sincronizando...</span>
                </div>
              )}
              
              {/* Indicador de conectividad */}
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full transition-all duration-300 ${
                connectionStatus === 'checking'
                  ? 'bg-yellow-500/20 text-yellow-100 shadow-sm'
                  : isOnline 
                    ? 'bg-green-500/20 text-green-100 shadow-sm' 
                    : 'bg-red-500/20 text-red-100 shadow-sm animate-pulse'
              }`}>
                {connectionStatus === 'checking' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-300 border-t-transparent"></div>
                    <span className="font-medium">Verificando...</span>
                  </>
                ) : isOnline ? (
                  <>
                    <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                    <WifiIcon className="w-5 h-5" />
                    <span className="font-medium">Conectado</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-red-300 rounded-full"></div>
                    <SignalSlashIcon className="w-5 h-5" />
                    <span className="font-medium">Sin conexión</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas de descarga */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 border border-pink-100">
            <div className="flex items-center">
              <DevicePhoneMobileIcon className="w-8 h-8 text-purple-500 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600">Canciones Descargadas</p>
                <p className="text-2xl font-bold text-purple-700">{downloadStats.total_songs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-pink-100">
            <div className="flex items-center">
              <ServerStackIcon className="w-8 h-8 text-pink-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600">Espacio Usado</p>
                <p className="text-2xl font-bold text-pink-700">{formatFileSize(downloadStats.total_size)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-pink-100">
            <div className="flex items-center">
              <CloudIcon className="w-8 h-8 text-purple-400 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600">Espacio Disponible</p>
                <p className="text-2xl font-bold text-pink-600">∞ GB</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navegación por pestañas */}
        <div className="bg-white rounded-lg shadow border border-pink-100">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('downloaded')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'downloaded'
                  ? 'border-purple-600 text-purple-600 bg-purple-50'
                  : 'border-transparent text-gray-600 hover:text-purple-600'
              }`}
            >
              <div className="flex items-center space-x-2">
                <CloudArrowDownIcon className="w-5 h-5" />
                <span>Mis Descargas ({downloadedSongs.length})</span>
              </div>
            </button>
            
            <button
              onClick={() => {
                console.log('Cambiando a pestaña de búsqueda...');
                setActiveTab('search');
                // Cargar canciones inmediatamente si la lista está vacía
                if (availableSongs.length === 0) {
                  console.log('Lista vacía, cargando canciones...');
                  searchAvailableSongs('');
                }
              }}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'search'
                  ? 'border-purple-600 text-purple-600 bg-purple-50'
                  : 'border-transparent text-gray-600 hover:text-purple-600'
              }`}
              disabled={!isOnline}
            >
              <div className="flex items-center space-x-2">
                <MagnifyingGlassIcon className="w-5 h-5" />
                <span>Buscar para Descargar</span>
                {!isOnline && <span className="text-xs text-red-500">(Sin conexión)</span>}
              </div>
            </button>
          </div>

          {/* Barra de búsqueda (solo visible en la pestaña de búsqueda) */}
          {activeTab === 'search' && (
            <div className="p-6 border-b border-gray-200">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar canciones para descargar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={!isOnline}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                  </div>
                )}
              </div>
              {!isOnline && (
                <p className="text-sm text-red-600 mt-2">
                  Necesitas conexión a internet para buscar nueva música
                </p>
              )}
            </div>
          )}
        </div>

        {/* Contenido de las pestañas */}
        {activeTab === 'downloaded' ? (
          /* Lista de descargas */
          <div className="bg-white rounded-lg shadow border border-pink-100">
          <div className="p-6 border-b border-pink-100">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-purple-900">
                Música Descargada ({downloadedSongs.length})
              </h3>
              <button 
                onClick={syncWithServer}
                disabled={!isOnline || isSyncing}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <ArrowPathIcon className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Cargando descargas...</p>
              </div>
            )}

            {!loading && downloadedSongs.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <CloudArrowDownIcon className="w-12 h-12 mx-auto mb-4 text-pink-400 opacity-40" />
                <p className="text-lg font-medium text-purple-900">¡No hay descargas aún!</p>
                <p className="text-sm mt-2">Ve a tu biblioteca y descarga música para escuchar sin conexión</p>
                <button className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors">
                  Explorar Música
                </button>
              </div>
            )}

            {!loading && downloadedSongs.length > 0 && (
              <div className="space-y-2">
                {downloadedSongs.map((song, index) => (
                  <div 
                    key={song.id} 
                    className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                      currentSong?.id === song.id 
                        ? 'border-purple-300 bg-purple-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-6">
                        {currentSong?.id === song.id && isPlaying ? (
                          <div className="flex space-x-1">
                            <div className="w-1 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                            <div className="w-1 h-3 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                            <div className="w-1 h-3 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">{index + 1}</span>
                        )}
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                        {song.imagen_url ? (
                          <img 
                            src={song.imagen_url} 
                            alt={song.titulo} 
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              // Si falla cargar la imagen online, intentar cargar desde IndexedDB
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <MusicalNoteIcon className="w-6 h-6 text-white" />
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900">{song.titulo}</h4>
                        <p className="text-sm text-gray-600">{song.artista}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{song.duracion}</span>
                          <span>•</span>
                          <span>{formatFileSize(song.file_size)}</span>
                          {!isOnline && (
                            <>
                              <span>•</span>
                              <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full">
                                Disponible offline
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => playOfflineSong(song.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          currentSong?.id === song.id && isPlaying
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-purple-600 hover:bg-purple-50'
                        }`}
                        title={currentSong?.id === song.id && isPlaying ? 'Pausar' : 'Reproducir'}
                      >
                        {currentSong?.id === song.id && isPlaying ? (
                          <PauseIcon className="w-5 h-5" />
                        ) : (
                          <PlayIcon className="w-5 h-5" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => deleteSong(song.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar descarga"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        ) : (
          /* Pestaña de búsqueda */
          <div className="bg-white rounded-lg shadow border border-pink-100">
            <div className="p-6">
              {!isOnline && (
                <div className="text-center text-gray-500 py-8">
                  <WifiIcon className="w-12 h-12 mx-auto mb-4 text-red-400 opacity-40" />
                  <p className="text-lg font-medium text-red-900">Sin conexión a internet</p>
                  <p className="text-sm mt-2">Necesitas estar conectado para buscar nueva música</p>
                </div>
              )}

              {isOnline && searchLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Buscando música...</p>
                </div>
              )}

              {isOnline && !searchLoading && availableSongs.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <MusicalNoteIcon className="w-12 h-12 mx-auto mb-4 text-purple-400 opacity-40" />
                  <p className="text-lg font-medium text-purple-900">
                    {searchTerm ? 'No se encontraron resultados' : '¡Explora la música disponible!'}
                  </p>
                  <p className="text-sm mt-2">
                    {searchTerm 
                      ? `No hay canciones que coincidan con "${searchTerm}"`
                      : 'Usa la barra de búsqueda o explora las canciones más recientes'
                    }
                  </p>
                </div>
              )}

              {isOnline && !searchLoading && availableSongs.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-4">
                    Mostrando {availableSongs.length} canción{availableSongs.length !== 1 ? 'es' : ''} 
                    {searchTerm && ` para "${searchTerm}"`}
                  </p>
                  
                  {availableSongs.map((song, index) => {
                    const isDownloaded = isSongDownloaded(song.id);
                    const isDownloading = downloadingIds.has(song.id);
                    
                    return (
                      <div key={song.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-500 w-6">{index + 1}</span>
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            {song.imagen_url ? (
                              <img 
                                src={song.imagen_url} 
                                alt={song.titulo} 
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <MusicalNoteIcon className="w-6 h-6 text-white" />
                            )}
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-900">{song.titulo}</h4>
                            <p className="text-sm text-gray-600">{song.artista}</p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>{song.duracion}</span>
                              {song.album && (
                                <>
                                  <span>•</span>
                                  <span>{song.album}</span>
                                </>
                              )}
                              {isDownloaded && (
                                <>
                                  <span>•</span>
                                  <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full">
                                    Ya descargada
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <button
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Reproducir"
                          >
                            <PlayIcon className="w-5 h-5" />
                          </button>
                          
                          {isDownloaded ? (
                            <div className="p-2 text-green-600" title="Ya descargada">
                              <CheckCircleIcon className="w-5 h-5" />
                            </div>
                          ) : (
                            <button
                              onClick={() => downloadSong(song)}
                              disabled={isDownloading || !isOnline}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title={isDownloading ? "Descargando..." : "Descargar"}
                            >
                              {isDownloading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                              ) : (
                                <CloudArrowDownIcon className="w-5 h-5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Consejos */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6">
          <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
            <LightBulbIcon className="w-6 h-6 text-yellow-400" /> Consejos para Descargas
          </h3>
          <ul className="text-purple-800 space-y-2">
            <li>• Las descargas se almacenan localmente en tu dispositivo para reproducción offline</li>
            <li>• Puedes descargar en calidad HD con tu cuenta Premium</li>
            <li>• Las descargas se sincronizan automáticamente cuando hay conexión</li>
            <li>• No hay límite de almacenamiento para usuarios Premium</li>
            <li className={`font-medium ${isOnline ? 'text-green-700' : 'text-red-700'}`}>
              • Estado actual: {
                connectionStatus === 'checking' 
                  ? '🔍 Verificando conectividad...'
                  : isOnline 
                    ? '🟢 Conectado - Puedes descargar nuevas canciones' 
                    : '🔴 Sin conexión - Solo puedes reproducir música descargada'
              }
            </li>
            {!isOnline && (
              <li className="text-orange-700 font-medium">
                • 💡 Tip: La música offline seguirá funcionando perfectamente
              </li>
            )}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
