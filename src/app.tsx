/**
 * HomePage Component - Página principal de prueba
 * 
 * Este componente es temporal y sirve para demostrar la conexión con Supabase.
 * En un entorno de producción, sería reemplazado por el componente principal
 * de la aplicación que se encuentra en src/app/page.tsx
 */

// Marcamos como 'use client' porque este componente necesita ejecutarse en el navegador
// para usar hooks como useState y useEffect
'use client'

// Imports necesarios para React y Supabase
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseCLient'; // Cliente de Supabase configurado
import { Song } from '@/types/music'; // Tipos específicos para música

/**
 * HomePage - Componente principal de prueba
 * 
 * Funcionalidades:
 * - Conecta con la tabla 'songs' en Supabase
 * - Muestra una lista de canciones
 * - Maneja estados de loading y errores
 */
export default function HomePage() {
  // Estado para almacenar las canciones obtenidas de la base de datos
  const [songs, setSongs] = useState<Song[]>([]);
  
  // Estado para manejar loading (opcional, para mejorar UX)
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado para manejar errores de conexión
  const [error, setError] = useState<string | null>(null);

  /**
   * Effect que se ejecuta al montar el componente
   * Obtiene las canciones desde Supabase
   */
  useEffect(() => {
    // Función async para obtener datos de Supabase
    const fetchSongs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Consulta a Supabase - tabla 'songs'
        const { data, error } = await supabase
          .from('songs') // Nombre de la tabla en Supabase
          .select('*'); // Seleccionar todos los campos
        
        // Manejo de errores de Supabase
        if (error) {
          console.error('Error al obtener canciones:', error);
          setError(`Error de conexión: ${error.message}`);
          return;
        }
        
        // Almacenar los datos obtenidos de Supabase en el estado del componente
        setSongs(data || []);
        
      } catch (err) {
        // Manejo de errores generales (red, etc.)
        console.error('Error inesperado:', err);
        setError('Error inesperado al cargar las canciones');
      } finally {
        setIsLoading(false);
      }
    };

    // Ejecutar la función async
    fetchSongs();
  }, []); // Array vacío significa que solo se ejecuta una vez al montar

  /**
   * Render condicional basado en estados
   */
  
  // Mostrar loading mientras se cargan los datos
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando canciones...</p>
        </div>
      </div>
    );
  }

  // Mostrar error si hay algún problema
  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="text-red-600 text-xl mb-2">⚠️ Error</div>
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  /**
   * Render principal del componente
   */
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header de la página */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎶 Biblioteca Musical
        </h1>
        <p className="text-gray-600">
          Conexión exitosa con Supabase. Total de canciones: {songs.length}
        </p>
      </div>

      {/* Lista de canciones o mensaje si está vacía */}
      {songs.length === 0 ? (
        // Mensaje cuando no hay canciones
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">🎵</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No hay canciones disponibles
          </h3>
          <p className="text-gray-600">
            La tabla 'songs' está vacía o no existe en tu base de datos de Supabase.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Verifica la configuración de tu base de datos.
          </p>
        </div>
      ) : (
        // Lista de canciones cuando hay datos
        <div className="space-y-3">
          {songs.map((song, index) => (
            <div 
              key={song.id || index} // Usar id único o index como fallback
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Icono de música */}
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600">🎵</span>
                  </div>
                  
                  {/* Información de la canción */}
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {song.title || 'Título desconocido'}
                    </h3>
                    {song.artist && (
                      <p className="text-sm text-gray-600">{song.artist}</p>
                    )}
                  </div>
                </div>
                
                {/* Duración si está disponible */}
                {song.duration && (
                  <div className="text-sm text-gray-500">
                    {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Footer con información técnica */}
      <div className="mt-8 pt-6 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-500">
          Conectado a Supabase • Última actualización: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
