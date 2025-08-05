'use client';

import { useState, useEffect } from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { 
  PlayIcon,
  PauseIcon,
  MusicalNoteIcon,
  MagnifyingGlassIcon,
  FunnelIcon 
} from '@heroicons/react/24/outline';

interface Cancion {
  id: string;
  titulo: string;
  artista: string;
  album?: string;
  genero: string;
  duracion: number;
  fecha_subida: string;
  estado: string;
  reproducciones: number;
  url_archivo?: string;
  usuario_id: string;
  usuarios?: {
    nombre: string;
    email: string;
  };
}

export default function TestAdminPage() {
  const { 
    currentSong, 
    isPlaying, 
    playSong, 
    pauseSong, 
    resumeSong 
  } = useMusicPlayer();

  const [canciones, setCanciones] = useState<Cancion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🎵 Test: Iniciando página de prueba');
    loadTestSongs();
  }, []);

  const loadTestSongs = () => {
    console.log('🎵 Test: Cargando canciones de prueba...');
    const testSongs: Cancion[] = [
      {
        id: '1',
        titulo: 'Canción de Prueba 1',
        artista: 'Artista Demo',
        album: 'Album Demo',
        genero: 'Rock',
        duracion: 210,
        fecha_subida: '2024-07-15',
        estado: 'activa',
        reproducciones: 1250,
        url_archivo: '/demo.mp3',
        usuario_id: '2',
        usuarios: {
          nombre: 'María García',
          email: 'artista@soundly.com'
        }
      },
      {
        id: '2',
        titulo: 'Melodía Electrónica',
        artista: 'DJ Soundly',
        genero: 'Electrónica',
        duracion: 180,
        fecha_subida: '2024-07-20',
        estado: 'activa',
        reproducciones: 890,
        url_archivo: '/demo.mp3',
        usuario_id: '2',
        usuarios: {
          nombre: 'DJ Soundly',
          email: 'dj@soundly.com'
        }
      },
      {
        id: '3',
        titulo: 'Balada Romántica',
        artista: 'Cantante Romántico',
        genero: 'Pop',
        duracion: 195,
        fecha_subida: '2024-07-25',
        estado: 'activa',
        reproducciones: 567,
        url_archivo: '/demo.mp3',
        usuario_id: '3',
        usuarios: {
          nombre: 'Cantante Romántico',
          email: 'romantico@soundly.com'
        }
      }
    ];
    
    setCanciones(testSongs);
    setLoading(false);
    console.log('🎵 Test: Canciones cargadas:', testSongs.length);
  };

  const togglePlayPause = (cancion: Cancion) => {
    console.log('🎵 Test: Toggle play/pause para canción:', cancion.titulo);
    
    try {
      if (currentSong?.id === cancion.id && isPlaying) {
        console.log('🎵 Test: Pausando canción actual');
        pauseSong();
      } else if (currentSong?.id === cancion.id && !isPlaying) {
        console.log('🎵 Test: Reanudando canción actual');
        resumeSong();
      } else {
        console.log('🎵 Test: Reproduciendo nueva canción:', cancion.titulo);
        
        const songToPlay = {
          id: cancion.id,
          titulo: cancion.titulo,
          artista: cancion.artista,
          album: cancion.album,
          genero: cancion.genero,
          duracion: cancion.duracion,
          url_archivo: cancion.url_archivo || '/demo.mp3',
          usuario_id: cancion.usuario_id,
          bitrate: 320
        };
        
        console.log('🎵 Test: Datos de la canción a reproducir:', songToPlay);
        playSong(songToPlay, [songToPlay]);
      }
    } catch (error) {
      console.error('🎵 Test: Error en togglePlayPause:', error);
    }
  };

  const formatearDuracion = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando canciones de prueba...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Prueba de Reproductor</h1>
          <p className="text-gray-600">Página de prueba para verificar la funcionalidad del reproductor</p>
        </div>

        {/* Debug info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">🐛 Debug Info</h4>
          <div className="text-xs text-yellow-700 space-y-1">
            <p><strong>Canciones cargadas:</strong> {canciones.length}</p>
            <p><strong>Canción actual:</strong> {currentSong ? `${currentSong.titulo} (${currentSong.id})` : 'Ninguna'}</p>
            <p><strong>Estado reproductor:</strong> {isPlaying ? '▶️ Reproduciendo' : '⏸️ Pausado'}</p>
          </div>
        </div>

        {/* Lista de canciones */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900">Canciones de Prueba</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {canciones.map((cancion) => (
              <div key={cancion.id} className="p-6">
                <div className="flex items-center space-x-4">
                  
                  {/* Botón de reproducción */}
                  <button
                    onClick={() => togglePlayPause(cancion)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      currentSong?.id === cancion.id && isPlaying
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-600'
                    }`}
                  >
                    {currentSong?.id === cancion.id && isPlaying ? (
                      <PauseIcon className="w-6 h-6" />
                    ) : (
                      <PlayIcon className="w-6 h-6 ml-0.5" />
                    )}
                  </button>

                  {/* Información de la canción */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {cancion.titulo}
                    </h3>
                    <p className="text-sm text-gray-500">{cancion.artista}</p>
                    <div className="flex items-center mt-1 space-x-4 text-xs text-gray-400">
                      <span>{cancion.genero}</span>
                      <span>{formatearDuracion(cancion.duracion)}</span>
                      <span>{cancion.reproducciones} reproducciones</span>
                    </div>
                  </div>

                  {/* Indicador de estado actual */}
                  {currentSong?.id === cancion.id && (
                    <div className="flex items-center text-purple-600">
                      <MusicalNoteIcon className="w-5 h-5 mr-1" />
                      <span className="text-sm font-medium">
                        {isPlaying ? 'Reproduciendo' : 'En pausa'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
