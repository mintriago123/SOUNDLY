'use client';

import { useState, useRef, useEffect } from 'react';
import { useConfiguracionGlobal, useFeatureAccess } from '@/hooks/useConfiguracionGlobal';

interface MusicPlayerProps {
  cancion?: {
    id: string;
    titulo: string;
    artista: string;
    duracion: number;
    url_archivo?: string;
    bitrate?: number;
  } | null;
  onNext?: () => void;
  onPrevious?: () => void;
  playlist?: any[];
  userIsPremium?: boolean;
}

export default function MusicPlayer({ 
  cancion, 
  onNext, 
  onPrevious, 
  playlist, 
  userIsPremium = false 
}: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [equalizerSettings, setEqualizerSettings] = useState({
    bass: 0,
    mid: 0,
    treble: 0,
    preset: 'default'
  });
  
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Configuración global
  const { config, isFeatureEnabled } = useConfiguracionGlobal();
  const { canAccessFeature } = useFeatureAccess();
  
  // Verificar qué características están disponibles
  const hasHighQualityAudio = canAccessFeature('high_quality_audio', userIsPremium);
  const hasCustomEqualizer = canAccessFeature('custom_equalizer', userIsPremium);
  const hasOfflineDownloads = canAccessFeature('offline_downloads', userIsPremium);
  const hasLyricsDisplay = canAccessFeature('lyrics_display', userIsPremium);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleSongEnd);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleSongEnd);
    };
  }, [cancion]);

  const handleSongEnd = () => {
    if (isRepeating) {
      playPause();
    } else if (onNext) {
      onNext();
    } else {
      setIsPlaying(false);
    }
  };

  const playPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleDownload = async () => {
    if (!hasOfflineDownloads || !cancion?.url_archivo) {
      alert('Función disponible solo para usuarios Premium');
      return;
    }
    
    try {
      const response = await fetch(cancion.url_archivo);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cancion.titulo} - ${cancion.artista}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading song:', error);
      alert('Error al descargar la canción');
    }
  };

  const applyEqualizerPreset = (preset: string) => {
    const presets = {
      default: { bass: 0, mid: 0, treble: 0 },
      rock: { bass: 10, mid: 5, treble: 8 },
      pop: { bass: 5, mid: 8, treble: 5 },
      jazz: { bass: 3, mid: 10, treble: 7 },
      classical: { bass: 2, mid: 6, treble: 9 },
      electronic: { bass: 15, mid: 2, treble: 12 }
    };
    
    const settings = presets[preset as keyof typeof presets] || presets.default;
    setEqualizerSettings({ ...settings, preset });
  };

  const getAudioQualityInfo = () => {
    if (!cancion) return null;
    
    if (hasHighQualityAudio && cancion.bitrate) {
      return `${cancion.bitrate}kbps HD`;
    } else if (hasHighQualityAudio) {
      return `Hasta ${config.max_audio_bitrate}kbps HD`;
    }
    
    return 'Calidad estándar';
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!cancion) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 border-t">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🎵</div>
              <p className="text-gray-400">Selecciona una canción para reproducir</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 dark:bg-gray-800 text-white p-4 border-t shadow-lg">
      <div className="max-w-6xl mx-auto">
        {/* Audio element */}
        <audio
          ref={audioRef}
          src={cancion.url_archivo || '/placeholder-audio.mp3'}
          preload="metadata"
        />

        {/* Main Player */}
        <div className="flex items-center justify-between">
          
          {/* Información de la canción */}
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🎵</span>
            </div>
            <div className="min-w-0">
              <h4 className="font-medium text-white truncate">{cancion.titulo}</h4>
              <p className="text-sm text-gray-400 truncate">{cancion.artista}</p>
            </div>
          </div>

          {/* Controles centrales */}
          <div className="flex flex-col items-center space-y-2 flex-1 max-w-md">
            
            {/* Botones de control */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsShuffling(!isShuffling)}
                className={`p-2 rounded-full hover:bg-gray-800 transition-colors ${
                  isShuffling ? 'text-green-400' : 'text-gray-400'
                }`}
                title="Aleatorio"
              >
                🔀
              </button>

              <button
                onClick={onPrevious}
                className="p-2 rounded-full hover:bg-gray-800 transition-colors text-white"
                disabled={!onPrevious}
                title="Anterior"
              >
                ⏮️
              </button>

              <button
                onClick={playPause}
                className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                title={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying ? '⏸️' : '▶️'}
              </button>

              <button
                onClick={onNext}
                className="p-2 rounded-full hover:bg-gray-800 transition-colors text-white"
                disabled={!onNext}
                title="Siguiente"
              >
                ⏭️
              </button>

              <button
                onClick={() => setIsRepeating(!isRepeating)}
                className={`p-2 rounded-full hover:bg-gray-800 transition-colors ${
                  isRepeating ? 'text-green-400' : 'text-gray-400'
                }`}
                title="Repetir"
              >
                🔁
              </button>
            </div>

            {/* Barra de progreso */}
            <div className="flex items-center space-x-2 w-full">
              <span className="text-xs text-gray-400 min-w-[40px]">
                {formatTime(currentTime)}
              </span>
              <div className="flex-1 h-1 bg-gray-700 rounded-full">
                <div
                  className="h-full bg-white rounded-full relative cursor-pointer"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  onClick={(e) => {
                    const rect = e.currentTarget.parentElement!.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const newTime = (clickX / rect.width) * duration;
                    seekTo(newTime);
                  }}
                >
                  <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 hover:opacity-100 transition-opacity"></div>
                </div>
              </div>
              <span className="text-xs text-gray-400 min-w-[40px]">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Controles de volumen y extras */}
          <div className="flex items-center space-x-4 flex-1 justify-end">
            <div className="flex items-center space-x-2">
              <span className="text-sm">🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-1 bg-gray-700 rounded-full appearance-none slider"
              />
            </div>

            {/* Información de calidad de audio */}
            {hasHighQualityAudio && (
              <div className="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded">
                {getAudioQualityInfo()}
              </div>
            )}

            {/* Botón de descarga (Premium) */}
            {hasOfflineDownloads && (
              <button
                onClick={handleDownload}
                className="text-blue-400 hover:text-blue-300 transition-colors"
                title="Descargar para offline"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            )}

            {/* Botón del ecualizador (Premium) */}
            {hasCustomEqualizer && (
              <button
                onClick={() => setShowEqualizer(!showEqualizer)}
                className={`transition-colors ${showEqualizer ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
                title="Ecualizador"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 14l-4-4 4-4m0 8l4-4-4-4" />
                </svg>
              </button>
            )}

            {/* Botón de letras (si está habilitado) */}
            {hasLyricsDisplay && (
              <button
                className="text-gray-400 hover:text-white transition-colors"
                title="Mostrar letras"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            )}

            {/* Información de la playlist */}
            {playlist && (
              <div className="text-xs text-gray-400">
                Playlist: {playlist.length} canciones
              </div>
            )}
          </div>
        </div>

        {/* Panel del ecualizador (Premium) */}
        {showEqualizer && hasCustomEqualizer && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-white">Ecualizador Premium</h4>
              <div className="flex space-x-2">
                {['default', 'rock', 'pop', 'jazz', 'classical', 'electronic'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => applyEqualizerPreset(preset)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      equalizerSettings.preset === preset
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {preset.charAt(0).toUpperCase() + preset.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <label className="block text-xs text-gray-400 mb-2">Graves</label>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  value={equalizerSettings.bass}
                  onChange={(e) => setEqualizerSettings(prev => ({ ...prev, bass: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-gray-700 rounded-full appearance-none slider"
                />
                <span className="text-xs text-gray-500">{equalizerSettings.bass}dB</span>
              </div>
              
              <div className="text-center">
                <label className="block text-xs text-gray-400 mb-2">Medios</label>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  value={equalizerSettings.mid}
                  onChange={(e) => setEqualizerSettings(prev => ({ ...prev, mid: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-gray-700 rounded-full appearance-none slider"
                />
                <span className="text-xs text-gray-500">{equalizerSettings.mid}dB</span>
              </div>
              
              <div className="text-center">
                <label className="block text-xs text-gray-400 mb-2">Agudos</label>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  value={equalizerSettings.treble}
                  onChange={(e) => setEqualizerSettings(prev => ({ ...prev, treble: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-gray-700 rounded-full appearance-none slider"
                />
                <span className="text-xs text-gray-500">{equalizerSettings.treble}dB</span>
              </div>
            </div>
          </div>
        )}

        {/* Aviso para usuarios gratuitos */}
        {!userIsPremium && (hasCustomEqualizer || hasOfflineDownloads || hasHighQualityAudio) && (
          <div className="mt-3 p-3 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg border border-purple-700/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-yellow-400">⭐</span>
                <span className="text-sm text-gray-300">
                  Desbloquea características premium como ecualizador, descargas y audio HD
                </span>
              </div>
              <button className="text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full hover:from-purple-700 hover:to-pink-700 transition-all">
                Actualizar a Premium
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
