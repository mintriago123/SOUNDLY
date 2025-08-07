import React, { useState, useRef, useEffect } from 'react';
import { PlayIcon, PauseIcon, SpeakerWaveIcon, SignalSlashIcon } from '@heroicons/react/24/solid';
import { useOfflineMusic } from '@/hooks/useOfflineMusic';

interface OfflinePlayerProps {
  songId: string;
  songTitle: string;
  songArtist: string;
  onlineAudioUrl?: string;
  onPlayStateChange?: (isPlaying: boolean) => void;
  className?: string;
}

export const OfflinePlayer: React.FC<OfflinePlayerProps> = ({
  songId,
  songTitle,
  songArtist,
  onlineAudioUrl,
  onPlayStateChange,
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isUsingOffline, setIsUsingOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const { isOnline, isDownloaded, getOfflineAudioUrl } = useOfflineMusic();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      onPlayStateChange?.(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onPlayStateChange]);

  const loadAudioSource = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    setError(null);

    try {
      // Si no hay conexión o preferimos offline, intentar cargar desde IndexedDB
      if (!isOnline || isDownloaded(songId)) {
        const offlineUrl = await getOfflineAudioUrl(songId);
        if (offlineUrl) {
          audio.src = offlineUrl;
          setIsUsingOffline(true);
          console.log('Cargando audio desde almacenamiento offline');
          return;
        }
      }

      // Si hay conexión y URL online disponible
      if (isOnline && onlineAudioUrl) {
        audio.src = onlineAudioUrl;
        setIsUsingOffline(false);
        console.log('Cargando audio desde servidor');
        return;
      }

      // No se puede reproducir
      setError('No se puede reproducir la canción');
      
    } catch (error) {
      console.error('Error cargando fuente de audio:', error);
      setError('Error cargando el audio');
    }
  };

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
        onPlayStateChange?.(false);
      } else {
        // Si no hay fuente cargada, cargarla primero
        if (!audio.src) {
          await loadAudioSource();
        }

        await audio.play();
        setIsPlaying(true);
        onPlayStateChange?.(true);
      }
    } catch (error) {
      console.error('Error reproduciendo audio:', error);
      setError('Error al reproducir');
      setIsPlaying(false);
      onPlayStateChange?.(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const seekTime = (parseFloat(e.target.value) / 100) * duration;
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value) / 100;
    const audio = audioRef.current;
    
    setVolume(newVolume);
    if (audio) {
      audio.volume = newVolume;
    }
  };

  const formatTime = (time: number): string => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 p-4 ${className}`}>
      <audio
        ref={audioRef}
        preload="metadata"
        onError={() => setError('Error cargando el audio')}
      />
      
      {/* Información de la canción */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{songTitle}</h3>
          <p className="text-sm text-gray-500 truncate">{songArtist}</p>
        </div>
        
        {/* Indicadores de estado */}
        <div className="flex items-center space-x-2">
          {isUsingOffline && (
            <div className="flex items-center space-x-1 text-green-600" title="Reproduciendo offline">
              <SignalSlashIcon className="w-4 h-4" />
              <span className="text-xs">Offline</span>
            </div>
          )}
          
          {!isOnline && !isDownloaded(songId) && (
            <div className="text-red-500 text-xs" title="Sin conexión y no está descargado">
              No disponible
            </div>
          )}
        </div>
      </div>

      {/* Controles de reproducción */}
      <div className="flex items-center space-x-4">
        <button
          onClick={togglePlayPause}
          disabled={!isOnline && !isDownloaded(songId)}
          className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPlaying ? (
            <PauseIcon className="w-5 h-5" />
          ) : (
            <PlayIcon className="w-5 h-5 ml-0.5" />
          )}
        </button>

        {/* Barra de progreso */}
        <div className="flex-1">
          <input
            type="range"
            min="0"
            max="100"
            value={progressPercentage}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            disabled={!duration}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control de volumen */}
        <div className="flex items-center space-x-2">
          <SpeakerWaveIcon className="w-5 h-5 text-gray-500" />
          <input
            type="range"
            min="0"
            max="100"
            value={volume * 100}
            onChange={handleVolumeChange}
            className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Información adicional */}
      {!isOnline && !isDownloaded(songId) && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
          Esta canción no está disponible sin conexión. Descárgala para escucharla offline.
        </div>
      )}
    </div>
  );
};

export default OfflinePlayer;
