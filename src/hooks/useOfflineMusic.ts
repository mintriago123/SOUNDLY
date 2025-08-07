import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';

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

interface UseOfflineMusicReturn {
  downloadedSongs: DownloadedSong[];
  isOnline: boolean;
  downloadSong: (songId: string) => Promise<boolean>;
  deleteSong: (songId: string) => Promise<boolean>;
  playOfflineSong: (songId: string) => Promise<string | null>;
  isDownloaded: (songId: string) => boolean;
  isDownloading: (songId: string) => boolean;
  getOfflineAudioUrl: (songId: string) => Promise<string | null>;
  syncWithServer: () => Promise<void>;
  getTotalSize: () => number;
  loading: boolean;
}

export const useOfflineMusic = (): UseOfflineMusicReturn => {
  const [downloadedSongs, setDownloadedSongs] = useState<DownloadedSong[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const { supabase } = useSupabase();

  // Inicializar
  useEffect(() => {
    // Obtener usuario
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.warn('Error obteniendo usuario:', error);
        setUser(null);
      }
    };
    
    getCurrentUser();
    
    // Detectar conectividad
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Inicializar IndexedDB
    initializeStorage();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
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
        
        if (!db.objectStoreNames.contains('downloaded_songs')) {
          const songsStore = db.createObjectStore('downloaded_songs', { keyPath: 'id' });
          songsStore.createIndex('usuario_id', 'usuario_id', { unique: false });
          songsStore.createIndex('downloaded_at', 'downloaded_at', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('audio_files')) {
          db.createObjectStore('audio_files', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('image_files')) {
          db.createObjectStore('image_files', { keyPath: 'id' });
        }
      };
      
      dbRequest.onsuccess = () => {
        console.log('IndexedDB inicializada correctamente');
      };
      
    } catch (error) {
      console.error('Error inicializando IndexedDB:', error);
    }
  };

  // Cargar canciones descargadas
  const loadDownloadedSongs = useCallback(async () => {
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
        };
      };
    } catch (error) {
      console.error('Error cargando canciones descargadas:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Descargar canción
  const downloadSong = useCallback(async (songId: string): Promise<boolean> => {
    try {
      if (!user || !isOnline) return false;

      setDownloadingIds(prev => new Set([...prev, songId]));
      
      // Obtener datos de la canción
      const { data: songData, error: songError } = await supabase
        .from('canciones')
        .select('*')
        .eq('id', songId)
        .single();

      if (songError || !songData) return false;

      // Obtener artista
      let artista = 'Artista desconocido';
      if (songData.usuario_id) {
        try {
          const { data: userData } = await supabase
            .from('usuarios')
            .select('nombre_usuario')
            .eq('id', songData.usuario_id)
            .single();
          
          if (userData?.nombre_usuario) {
            artista = userData.nombre_usuario;
          }
        } catch (error) {
          console.warn('Error obteniendo artista:', error);
        }
      }

      // Descargar archivos
      let audioBlob: Blob | null = null;
      let imageBlob: Blob | null = null;
      let fileSize = 0;

      if (songData.archivo_audio) {
        const audioResponse = await fetch(songData.archivo_audio);
        if (audioResponse.ok) {
          audioBlob = await audioResponse.blob();
          fileSize += audioBlob.size;
        }
      }

      if (songData.imagen_url) {
        try {
          const imageResponse = await fetch(songData.imagen_url);
          if (imageResponse.ok) {
            imageBlob = await imageResponse.blob();
            fileSize += imageBlob.size;
          }
        } catch (error) {
          console.warn('Error descargando imagen:', error);
        }
      }

      if (!audioBlob) return false;

      // Guardar en IndexedDB
      return new Promise((resolve) => {
        const dbRequest = indexedDB.open('SoundlyOfflineDB', 1);
        
        dbRequest.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['downloaded_songs', 'audio_files', 'image_files'], 'readwrite');
          
          // Guardar metadatos
          const songsStore = transaction.objectStore('downloaded_songs');
          const downloadedSong: DownloadedSong = {
            id: songData.id,
            titulo: songData.titulo,
            artista: artista,
            album: songData.album,
            duracion: songData.duracion || '0:00',
            archivo_url: songData.archivo_audio,
            imagen_url: songData.imagen_url,
            downloaded_at: new Date().toISOString(),
            file_size: fileSize,
            usuario_id: user.id
          };
          
          songsStore.put(downloadedSong);
          
          // Guardar audio
          const audioStore = transaction.objectStore('audio_files');
          audioStore.put({ id: songId, blob: audioBlob });
          
          // Guardar imagen
          if (imageBlob) {
            const imageStore = transaction.objectStore('image_files');
            imageStore.put({ id: songId, blob: imageBlob });
          }
          
          transaction.oncomplete = () => {
            loadDownloadedSongs();
            resolve(true);
          };
          
          transaction.onerror = () => resolve(false);
        };
        
        dbRequest.onerror = () => resolve(false);
      });
      
    } catch (error) {
      console.error('Error descargando canción:', error);
      return false;
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(songId);
        return newSet;
      });
    }
  }, [user, isOnline, supabase, loadDownloadedSongs]);

  // Eliminar canción
  const deleteSong = useCallback(async (songId: string): Promise<boolean> => {
    try {
      return new Promise((resolve) => {
        const dbRequest = indexedDB.open('SoundlyOfflineDB', 1);
        
        dbRequest.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['downloaded_songs', 'audio_files', 'image_files'], 'readwrite');
          
          transaction.objectStore('downloaded_songs').delete(songId);
          transaction.objectStore('audio_files').delete(songId);
          transaction.objectStore('image_files').delete(songId);
          
          transaction.oncomplete = () => {
            loadDownloadedSongs();
            resolve(true);
          };
          
          transaction.onerror = () => resolve(false);
        };
        
        dbRequest.onerror = () => resolve(false);
      });
    } catch (error) {
      console.error('Error eliminando canción:', error);
      return false;
    }
  }, [loadDownloadedSongs]);

  // Obtener URL de audio offline
  const getOfflineAudioUrl = useCallback(async (songId: string): Promise<string | null> => {
    try {
      return new Promise((resolve) => {
        const dbRequest = indexedDB.open('SoundlyOfflineDB', 1);
        
        dbRequest.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['audio_files'], 'readonly');
          const store = transaction.objectStore('audio_files');
          const request = store.get(songId);
          
          request.onsuccess = () => {
            const result = request.result;
            if (result && result.blob) {
              const url = URL.createObjectURL(result.blob);
              resolve(url);
            } else {
              resolve(null);
            }
          };
          
          request.onerror = () => resolve(null);
        };
        
        dbRequest.onerror = () => resolve(null);
      });
    } catch (error) {
      console.error('Error obteniendo URL offline:', error);
      return null;
    }
  }, []);

  // Reproducir canción offline
  const playOfflineSong = useCallback(async (songId: string): Promise<string | null> => {
    const audioUrl = await getOfflineAudioUrl(songId);
    
    if (audioUrl) {
      // Limpiar URL después de un tiempo para liberar memoria
      setTimeout(() => URL.revokeObjectURL(audioUrl), 300000); // 5 minutos
    }
    
    return audioUrl;
  }, [getOfflineAudioUrl]);

  // Verificar si una canción está descargada
  const isDownloaded = useCallback((songId: string): boolean => {
    return downloadedSongs.some(song => song.id === songId);
  }, [downloadedSongs]);

  // Verificar si una canción se está descargando
  const isDownloading = useCallback((songId: string): boolean => {
    return downloadingIds.has(songId);
  }, [downloadingIds]);

  // Sincronizar con servidor
  const syncWithServer = useCallback(async (): Promise<void> => {
    if (!isOnline || !user) return;
    
    try {
      console.log('Sincronizando con servidor...');
      await loadDownloadedSongs();
    } catch (error) {
      console.error('Error sincronizando:', error);
    }
  }, [isOnline, user, loadDownloadedSongs]);

  // Obtener tamaño total
  const getTotalSize = useCallback((): number => {
    return downloadedSongs.reduce((total, song) => total + song.file_size, 0);
  }, [downloadedSongs]);

  return {
    downloadedSongs,
    isOnline,
    downloadSong,
    deleteSong,
    playOfflineSong,
    isDownloaded,
    isDownloading,
    getOfflineAudioUrl,
    syncWithServer,
    getTotalSize,
    loading
  };
};
