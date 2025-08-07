// Servicio para gestionar la sincronización en segundo plano
class OfflineSyncService {
  private static instance: OfflineSyncService;
  private syncInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): OfflineSyncService {
    if (!OfflineSyncService.instance) {
      OfflineSyncService.instance = new OfflineSyncService();
    }
    return OfflineSyncService.instance;
  }

  initialize() {
    if (this.isInitialized) return;

    this.isInitialized = true;
    this.setupEventListeners();
    this.startPeriodicSync();
    
    console.log('Servicio de sincronización offline inicializado');
  }

  private setupEventListeners() {
    // Escuchar cambios de conectividad
    window.addEventListener('online', () => {
      console.log('Conectividad restaurada - Iniciando sincronización');
      this.performSync();
    });

    window.addEventListener('offline', () => {
      console.log('Conectividad perdida - Modo offline activado');
    });

    // Sincronizar antes de cerrar la página
    window.addEventListener('beforeunload', () => {
      if (navigator.onLine) {
        this.performSync();
      }
    });

    // Sincronizar cuando la página se vuelve visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && navigator.onLine) {
        this.performSync();
      }
    });
  }

  private startPeriodicSync() {
    // Sincronizar cada 5 minutos si está online
    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.performSync();
      }
    }, 5 * 60 * 1000); // 5 minutos
  }

  private async performSync() {
    try {
      console.log('Iniciando sincronización...');
      
      // Verificar integridad de archivos descargados
      await this.verifyDownloadedFiles();
      
      // Limpiar archivos huérfanos
      await this.cleanupOrphanedFiles();
      
      // Actualizar metadatos si es necesario
      await this.updateMetadataIfNeeded();
      
      console.log('Sincronización completada');
    } catch (error) {
      console.error('Error durante la sincronización:', error);
    }
  }

  private async verifyDownloadedFiles(): Promise<void> {
    try {
      const dbRequest = indexedDB.open('SoundlyOfflineDB', 1);
      
      return new Promise((resolve, reject) => {
        dbRequest.onsuccess = async (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['downloaded_songs', 'audio_files'], 'readonly');
          
          const songsStore = transaction.objectStore('downloaded_songs');
          const audioStore = transaction.objectStore('audio_files');
          
          const songsRequest = songsStore.getAll();
          
          songsRequest.onsuccess = async () => {
            const songs = songsRequest.result;
            
            for (const song of songs) {
              // Verificar que el archivo de audio existe
              const audioRequest = audioStore.get(song.id);
              
              audioRequest.onsuccess = () => {
                if (!audioRequest.result) {
                  console.warn(`Archivo de audio faltante para: ${song.titulo}`);
                  // Aquí podrías marcar la canción para re-descarga
                }
              };
            }
            
            resolve();
          };
          
          songsRequest.onerror = () => reject(songsRequest.error);
        };
        
        dbRequest.onerror = () => reject(dbRequest.error);
      });
    } catch (error) {
      console.error('Error verificando archivos:', error);
    }
  }

  private async cleanupOrphanedFiles(): Promise<void> {
    try {
      const dbRequest = indexedDB.open('SoundlyOfflineDB', 1);
      
      return new Promise((resolve, reject) => {
        dbRequest.onsuccess = async (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['downloaded_songs', 'audio_files', 'image_files'], 'readwrite');
          
          const songsStore = transaction.objectStore('downloaded_songs');
          const audioStore = transaction.objectStore('audio_files');
          const imageStore = transaction.objectStore('image_files');
          
          // Obtener todas las canciones y archivos
          const [songs, audioFiles, imageFiles] = await Promise.all([
            this.getAllFromStore(songsStore),
            this.getAllFromStore(audioStore),
            this.getAllFromStore(imageStore)
          ]);
          
          const songIds = new Set(songs.map(song => song.id));
          
          // Limpiar archivos de audio huérfanos
          for (const audioFile of audioFiles) {
            if (!songIds.has(audioFile.id)) {
              audioStore.delete(audioFile.id);
              console.log(`Eliminado archivo de audio huérfano: ${audioFile.id}`);
            }
          }
          
          // Limpiar archivos de imagen huérfanos
          for (const imageFile of imageFiles) {
            if (!songIds.has(imageFile.id)) {
              imageStore.delete(imageFile.id);
              console.log(`Eliminado archivo de imagen huérfano: ${imageFile.id}`);
            }
          }
          
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        };
        
        dbRequest.onerror = () => reject(dbRequest.error);
      });
    } catch (error) {
      console.error('Error limpiando archivos huérfanos:', error);
    }
  }

  private async updateMetadataIfNeeded(): Promise<void> {
    // Aquí podrías implementar lógica para actualizar metadatos
    // de canciones descargadas si han cambiado en el servidor
    console.log('Verificando actualizaciones de metadatos...');
  }

  private getAllFromStore(store: IDBObjectStore): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Obtener estadísticas de almacenamiento
  async getStorageStats(): Promise<{
    totalSongs: number;
    totalSize: number;
    oldestDownload: string | null;
    newestDownload: string | null;
  }> {
    try {
      const dbRequest = indexedDB.open('SoundlyOfflineDB', 1);
      
      return new Promise((resolve, reject) => {
        dbRequest.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['downloaded_songs'], 'readonly');
          const store = transaction.objectStore('downloaded_songs');
          const request = store.getAll();
          
          request.onsuccess = () => {
            const songs = request.result;
            
            if (songs.length === 0) {
              resolve({
                totalSongs: 0,
                totalSize: 0,
                oldestDownload: null,
                newestDownload: null
              });
              return;
            }
            
            const totalSize = songs.reduce((sum, song) => sum + song.file_size, 0);
            const dates = songs.map(song => new Date(song.downloaded_at));
            const oldestDate = new Date(Math.min(...dates.map(d => d.getTime())));
            const newestDate = new Date(Math.max(...dates.map(d => d.getTime())));
            
            resolve({
              totalSongs: songs.length,
              totalSize,
              oldestDownload: oldestDate.toISOString(),
              newestDownload: newestDate.toISOString()
            });
          };
          
          request.onerror = () => reject(request.error);
        };
        
        dbRequest.onerror = () => reject(dbRequest.error);
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        totalSongs: 0,
        totalSize: 0,
        oldestDownload: null,
        newestDownload: null
      };
    }
  }

  // Limpiar almacenamiento completo
  async clearAllStorage(): Promise<boolean> {
    try {
      const dbRequest = indexedDB.open('SoundlyOfflineDB', 1);
      
      return new Promise((resolve, reject) => {
        dbRequest.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['downloaded_songs', 'audio_files', 'image_files'], 'readwrite');
          
          const stores = ['downloaded_songs', 'audio_files', 'image_files'];
          let completed = 0;
          
          stores.forEach(storeName => {
            const store = transaction.objectStore(storeName);
            const clearRequest = store.clear();
            
            clearRequest.onsuccess = () => {
              completed++;
              if (completed === stores.length) {
                console.log('Almacenamiento offline limpiado completamente');
                resolve(true);
              }
            };
          });
          
          transaction.onerror = () => reject(transaction.error);
        };
        
        dbRequest.onerror = () => reject(dbRequest.error);
      });
    } catch (error) {
      console.error('Error limpiando almacenamiento:', error);
      return false;
    }
  }

  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isInitialized = false;
    console.log('Servicio de sincronización destruido');
  }
}

// Instancia singleton
export const offlineSyncService = OfflineSyncService.getInstance();

// Auto-inicializar cuando se importa (solo en el navegador)
if (typeof window !== 'undefined') {
  offlineSyncService.initialize();
}
