/**
 * Tipos relacionados con la música y canciones
 */

/**
 * Interface para definir la estructura de una canción
 */
export interface Song {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  duration?: number;
  genre?: string;
  release_date?: string;
  file_url?: string;
  cover_url?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface para playlists
 */
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  songs: Song[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Interface para álbumes
 */
export interface Album {
  id: string;
  title: string;
  artist: string;
  release_date?: string;
  cover_url?: string;
  songs: Song[];
  created_at: string;
  updated_at: string;
}

/**
 * Estados de reproducción del reproductor de música
 */
export type PlaybackState = 'playing' | 'paused' | 'stopped' | 'loading';

/**
 * Interface para el contexto del reproductor de música
 */
export interface MusicPlayerState {
  currentSong: Song | null;
  playlist: Song[];
  currentIndex: number;
  isPlaying: boolean;
  volume: number;
  playbackState: PlaybackState;
  repeat: boolean;
  shuffle: boolean;
}
