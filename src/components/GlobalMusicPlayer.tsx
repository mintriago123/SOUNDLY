'use client';

import { useState, useRef, useEffect } from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useConfiguracionGlobal, useFeatureAccess } from '@/hooks/useConfiguracionGlobal';
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface GlobalMusicPlayerProps {
  userIsPremium?: boolean;
}

export default function GlobalMusicPlayer({ userIsPremium = false }: GlobalMusicPlayerProps) {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    playlist,
    pauseSong,
    resumeSong,
    nextSong,
    previousSong,
    seekTo,
    setVolume,
    clearPlaylist,
    isMinimized,
    toggleMinimized
  } = useMusicPlayer();

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [tempTime, setTempTime] = useState(0);

  // Configuración global
  const { config, isFeatureEnabled } = useConfiguracionGlobal();
  const { canAccessFeature } = useFeatureAccess();

  // Verificar características disponibles
  const hasHighQualityAudio = canAccessFeature('high_quality_audio', userIsPremium);
  const hasOfflineDownloads = canAccessFeature('offline_downloads', userIsPremium);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    const updateTime = () => {
      if (!isDragging) {
        setTempTime(audio.currentTime);
        seekTo(audio.currentTime);
      }
    };

    const updateDuration = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        // El duration se maneja en el contexto
      }
    };

    const handleEnded = () => {
      if (playlist.length > 1) {
        nextSong();
      } else {
        pauseSong();
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentSong, isDragging, playlist.length, nextSong, pauseSong, seekTo]);

  useEffect(() => {
    if (audioRef.current && currentSong) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong]);

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseSong();
    } else {
      resumeSong();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setTempTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      seekTo(time);
    }
  };

  const handleSeekStart = () => {
    setIsDragging(true);
  };

  const handleSeekEnd = () => {
    setIsDragging(false);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getAudioQualityBadge = () => {
    if (!hasHighQualityAudio) return null;
    
    if (currentSong?.bitrate) {
      return `${currentSong.bitrate}kbps`;
    }
    return 'HD';
  };

  // Siempre mostrar la barra de reproducción, incluso sin canción
  return (
    <>
      {/* Audio element - solo si hay canción */}
      {currentSong && (
        <audio
          ref={audioRef}
          src={currentSong.url_archivo || '/placeholder-audio.mp3'}
          preload="metadata"
        />
      )}

      {/* Fixed music player */}
      <div className={`fixed bottom-0 left-0 right-0 md:left-64 bg-gray-900 text-white border-t border-gray-700 shadow-lg z-50 transition-all duration-300 ${
        isMinimized ? 'h-16' : 'h-24'
      }`}>
        <div className="h-full px-4 py-2">
          {/* Progress bar */}
          <div className="w-full mb-2">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={isDragging ? tempTime : currentTime}
              onChange={handleSeek}
              onMouseDown={handleSeekStart}
              onMouseUp={handleSeekEnd}
              onTouchStart={handleSeekStart}
              onTouchEnd={handleSeekEnd}
              className="w-full h-1 bg-gray-700 rounded-full appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((isDragging ? tempTime : currentTime) / (duration || 100)) * 100}%, #374151 ${((isDragging ? tempTime : currentTime) / (duration || 100)) * 100}%, #374151 100%)`
              }}
              disabled={!currentSong}
            />
          </div>

          {/* Main player controls */}
          <div className="flex items-center justify-between">
            {/* Song info */}
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🎵</span>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-white truncate text-sm">
                  {currentSong ? currentSong.titulo : 'No hay música seleccionada'}
                </h4>
                <p className="text-xs text-gray-400 truncate">
                  {currentSong ? (
                    <>
                      {currentSong.artista}
                      {getAudioQualityBadge() && (
                        <span className="ml-2 px-1 py-0.5 bg-green-600 text-white rounded text-xs">
                          {getAudioQualityBadge()}
                        </span>
                      )}
                    </>
                  ) : (
                    'Selecciona una canción para reproducir'
                  )}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-3">
              {/* Previous */}
              <button
                onClick={previousSong}
                disabled={!currentSong || playlist.length <= 1}
                className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BackwardIcon className="w-5 h-5" />
              </button>

              {/* Play/Pause */}
              <button
                onClick={handlePlayPause}
                disabled={!currentSong}
                className="bg-blue-600 hover:bg-blue-700 rounded-full p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlaying ? (
                  <PauseIcon className="w-5 h-5" />
                ) : (
                  <PlayIcon className="w-5 h-5" />
                )}
              </button>

              {/* Next */}
              <button
                onClick={nextSong}
                disabled={!currentSong || playlist.length <= 1}
                className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ForwardIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Right controls */}
            <div className="flex items-center space-x-3 min-w-0 flex-1 justify-end">
              {/* Time display */}
              <div className="text-xs text-gray-400 whitespace-nowrap">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>

              {/* Volume */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
                  className="text-gray-400 hover:text-white"
                >
                  {volume > 0 ? (
                    <SpeakerWaveIcon className="w-4 h-4" />
                  ) : (
                    <SpeakerXMarkIcon className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-16 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer slider"
                />
              </div>

              {/* Playlist info */}
              {playlist.length > 1 && currentSong && (
                <div className="text-xs text-gray-400 whitespace-nowrap">
                  {playlist.findIndex(s => s.id === currentSong.id) + 1}/{playlist.length}
                </div>
              )}

              {/* Minimize/Expand */}
              <button
                onClick={toggleMinimized}
                className="text-gray-400 hover:text-white"
              >
                {isMinimized ? (
                  <ChevronUpIcon className="w-4 h-4" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4" />
                )}
              </button>

              {/* Close */}
              <button
                onClick={clearPlaylist}
                className="text-gray-400 hover:text-red-400"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
