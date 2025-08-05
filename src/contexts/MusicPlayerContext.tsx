'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Cancion {
  id: string;
  titulo: string;
  artista: string;
  album?: string;
  genero: string;
  duracion: number;
  url_archivo?: string;
  archivo_audio_url?: string; // Campo adicional para compatibilidad
  usuario_id: string;
  bitrate?: number;
}

interface MusicPlayerContextType {
  // Estado actual
  currentSong: Cancion | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playlist: Cancion[];
  currentIndex: number;
  
  // Acciones
  playSong: (song: Cancion, playlist?: Cancion[]) => void;
  pauseSong: () => void;
  resumeSong: () => void;
  nextSong: () => void;
  previousSong: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  updateDuration: (duration: number) => void; // Nueva función para establecer duración
  clearPlaylist: () => void;
  
  // Estado de la UI
  isMinimized: boolean;
  toggleMinimized: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
}

interface MusicPlayerProviderProps {
  children: ReactNode;
}

export function MusicPlayerProvider({ children }: MusicPlayerProviderProps) {
  const [currentSong, setCurrentSong] = useState<Cancion | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [playlist, setPlaylist] = useState<Cancion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  const playSong = (song: Cancion, newPlaylist?: Cancion[]) => {
    console.log('🎵 Reproduciendo canción:', song.titulo, 'URL:', song.url_archivo || song.archivo_audio_url);
    
    // Asegurar que la canción tenga una URL válida
    const audioUrl = song.url_archivo || song.archivo_audio_url;
    if (!audioUrl) {
      console.error('❌ No se encontró URL de audio para la canción:', song.titulo);
      return;
    }

    // Normalizar la canción para asegurar que tenga url_archivo
    const normalizedSong = {
      ...song,
      url_archivo: audioUrl
    };

    setCurrentSong(normalizedSong);
    setIsPlaying(true);
    setCurrentTime(0);
    
    // Establecer duración si está disponible
    if (song.duracion) {
      setDuration(song.duracion);
    }
    
    if (newPlaylist) {
      setPlaylist(newPlaylist);
      const index = newPlaylist.findIndex(s => s.id === song.id);
      setCurrentIndex(index >= 0 ? index : 0);
    } else if (playlist.length === 0) {
      setPlaylist([normalizedSong]);
      setCurrentIndex(0);
    }
  };

  const pauseSong = () => {
    setIsPlaying(false);
  };

  const resumeSong = () => {
    if (currentSong) {
      setIsPlaying(true);
    }
  };

  const nextSong = () => {
    if (playlist.length > 0) {
      const nextIndex = (currentIndex + 1) % playlist.length;
      setCurrentIndex(nextIndex);
      setCurrentSong(playlist[nextIndex]);
      setIsPlaying(true);
    }
  };

  const previousSong = () => {
    if (playlist.length > 0) {
      const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
      setCurrentIndex(prevIndex);
      setCurrentSong(playlist[prevIndex]);
      setIsPlaying(true);
    }
  };

  const seekTo = (time: number) => {
    setCurrentTime(time);
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(Math.max(0, Math.min(1, newVolume)));
  };

  const updateDuration = (newDuration: number) => {
    setDuration(newDuration);
  };

  const clearPlaylist = () => {
    setCurrentSong(null);
    setIsPlaying(false);
    setPlaylist([]);
    setCurrentIndex(0);
    setCurrentTime(0);
    setDuration(0);
  };

  const toggleMinimized = () => {
    setIsMinimized(!isMinimized);
  };

  const value: MusicPlayerContextType = {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    playlist,
    currentIndex,
    playSong,
    pauseSong,
    resumeSong,
    nextSong,
    previousSong,
    seekTo,
    setVolume,
    updateDuration,
    clearPlaylist,
    isMinimized,
    toggleMinimized
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
}
