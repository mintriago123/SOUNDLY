'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';

interface Cancion {
  id: string;
  titulo: string;
  artista: string;
  album?: string;
  genero: string;
  duracion: number;
  url_archivo?: string;
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

export function MusicPlayerProvider({ children }: Readonly<MusicPlayerProviderProps>) {
  const [currentSong, setCurrentSong] = useState<Cancion | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volumeValue, setVolumeValue] = useState(0.8);
  const [playlist, setPlaylist] = useState<Cancion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  const playSong = (song: Cancion, newPlaylist?: Cancion[]) => {
    setCurrentSong(song);
    setIsPlaying(true);
    
    if (newPlaylist) {
      setPlaylist(newPlaylist);
      const index = newPlaylist.findIndex(s => s.id === song.id);
      setCurrentIndex(index >= 0 ? index : 0);
    } else if (playlist.length === 0) {
      setPlaylist([song]);
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
    setVolumeValue(Math.max(0, Math.min(1, newVolume)));
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

  const value: MusicPlayerContextType = useMemo(() => ({
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume: volumeValue,
    playlist,
    currentIndex,
    playSong,
    pauseSong,
    resumeSong,
    nextSong,
    previousSong,
    seekTo,
    setVolume,
    clearPlaylist,
    isMinimized,
    toggleMinimized
  }), [
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volumeValue,
    playlist,
    currentIndex,
    isMinimized
  ]);

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
}
