'use client';

import { useState, useRef, useEffect } from 'react';

interface MusicPlayerProps {
  cancion?: {
    id: string;
    titulo: string;
    artista: string;
    duracion: number;
    url_archivo?: string;
  } | null;
  onNext?: () => void;
  onPrevious?: () => void;
  playlist?: any[];
}

export default function MusicPlayer({ cancion, onNext, onPrevious, playlist }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

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
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 border-t shadow-lg">
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

            {playlist && (
              <div className="text-xs text-gray-400">
                Playlist: {playlist.length} canciones
              </div>
            )}
          </div>
        </div>
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
