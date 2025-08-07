import React from 'react';
import { CloudArrowDownIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useOfflineMusic } from '@/hooks/useOfflineMusic';

interface DownloadButtonProps {
  songId: string;
  songTitle: string;
  className?: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({ 
  songId, 
  songTitle, 
  className = '' 
}) => {
  const { 
    downloadSong, 
    deleteSong, 
    isDownloaded, 
    isDownloading, 
    isOnline 
  } = useOfflineMusic();

  const handleDownloadClick = async () => {
    if (isDownloaded(songId)) {
      // Si ya está descargada, preguntar si quiere eliminar
      if (confirm(`¿Eliminar "${songTitle}" de las descargas?`)) {
        const success = await deleteSong(songId);
        if (!success) {
          alert('Error al eliminar la descarga');
        }
      }
    } else {
      // Descargar la canción
      if (!isOnline) {
        alert('Necesitas conexión a internet para descargar música');
        return;
      }
      
      const success = await downloadSong(songId);
      if (!success) {
        alert('Error al descargar la canción');
      }
    }
  };

  // Si se está descargando
  if (isDownloading(songId)) {
    return (
      <button
        disabled
        className={`flex items-center space-x-1 px-3 py-1 rounded-lg bg-blue-100 text-blue-600 ${className}`}
        title="Descargando..."
      >
        <ArrowPathIcon className="w-4 h-4 animate-spin" />
        <span className="text-sm">Descargando...</span>
      </button>
    );
  }

  // Si ya está descargada
  if (isDownloaded(songId)) {
    return (
      <button
        onClick={handleDownloadClick}
        className={`flex items-center space-x-1 px-3 py-1 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors ${className}`}
        title="Descargado - Clic para eliminar"
      >
        <CheckCircleIcon className="w-4 h-4" />
        <span className="text-sm">Descargado</span>
      </button>
    );
  }

  // Si no está descargada
  return (
    <button
      onClick={handleDownloadClick}
      disabled={!isOnline}
      className={`flex items-center space-x-1 px-3 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      title={isOnline ? "Descargar para escuchar offline" : "Sin conexión - No se puede descargar"}
    >
      <CloudArrowDownIcon className="w-4 h-4" />
      <span className="text-sm">Descargar</span>
    </button>
  );
};

// Componente para mostrar el estado de conectividad
export const ConnectivityIndicator: React.FC = () => {
  const { isOnline } = useOfflineMusic();

  return (
    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
      isOnline 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      <div className={`w-2 h-2 rounded-full ${
        isOnline ? 'bg-green-500' : 'bg-red-500'
      }`} />
      <span>{isOnline ? 'En línea' : 'Sin conexión'}</span>
    </div>
  );
};

// Componente para mostrar estadísticas de descarga
export const DownloadStats: React.FC = () => {
  const { downloadedSongs, getTotalSize } = useOfflineMusic();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex items-center space-x-4 text-sm text-gray-600">
      <span>{downloadedSongs.length} canciones descargadas</span>
      <span>{formatFileSize(getTotalSize())} de espacio usado</span>
    </div>
  );
};
