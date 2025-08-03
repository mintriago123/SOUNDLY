'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Image from 'next/image';
import { 
  MagnifyingGlassIcon,
  MusicalNoteIcon,
  PlayIcon,
  PauseIcon,
  HeartIcon,
  PlusIcon,
  FunnelIcon,
  SpeakerWaveIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

interface Cancion {
  id: string;
  titulo: string;
  artista: string;
  album: string;
  duracion: string;
  genero: string;
  año: number;
  url_storage: string;
  imagen_url?: string;
  es_favorito: boolean;
  reproducciones: number;
}

interface FiltrosBusqueda {
  genero: string;
  año: string;
  duracion: string;
  artista: string;
}

// Datos simulados para demostración (en producción vendrían del storage)
const cancionesSimuladas: Cancion[] = [
  {
    id: '1',
    titulo: 'Estrellas en el Cielo',
    artista: 'Luna Nova',
    album: 'Noches de Verano',
    duracion: '3:45',
    genero: 'Pop',
    año: 2023,
    url_storage: '/storage/musica/estrellas-cielo.mp3',
    imagen_url: '/storage/imagenes/album-noches-verano.jpg',
    es_favorito: false,
    reproducciones: 12450
  },
  {
    id: '2',
    titulo: 'Ritmo del Corazón',
    artista: 'Carlos Mendez',
    album: 'Latidos',
    duracion: '4:12',
    genero: 'Reggaeton',
    año: 2023,
    url_storage: '/storage/musica/ritmo-corazon.mp3',
    imagen_url: '/storage/imagenes/album-latidos.jpg',
    es_favorito: true,
    reproducciones: 8765
  },
  {
    id: '3',
    titulo: 'Midnight Jazz',
    artista: 'The Blue Notes',
    album: 'City Nights',
    duracion: '5:23',
    genero: 'Jazz',
    año: 2022,
    url_storage: '/storage/musica/midnight-jazz.mp3',
    imagen_url: '/storage/imagenes/album-city-nights.jpg',
    es_favorito: false,
    reproducciones: 5432
  },
  {
    id: '4',
    titulo: 'Fuego Latino',
    artista: 'María Rodriguez',
    album: 'Pasión',
    duracion: '3:28',
    genero: 'Salsa',
    año: 2023,
    url_storage: '/storage/musica/fuego-latino.mp3',
    imagen_url: '/storage/imagenes/album-pasion.jpg',
    es_favorito: true,
    reproducciones: 15678
  },
  {
    id: '5',
    titulo: 'Electric Dreams',
    artista: 'Neon Pulse',
    album: 'Synthwave',
    duracion: '4:56',
    genero: 'Electronic',
    año: 2023,
    url_storage: '/storage/musica/electric-dreams.mp3',
    imagen_url: '/storage/imagenes/album-synthwave.jpg',
    es_favorito: false,
    reproducciones: 9876
  },
  {
    id: '6',
    titulo: 'Caminos de Tierra',
    artista: 'Los Viajeros',
    album: 'Raíces',
    duracion: '4:01',
    genero: 'Folk',
    año: 2022,
    url_storage: '/storage/musica/caminos-tierra.mp3',
    imagen_url: '/storage/imagenes/album-raices.jpg',
    es_favorito: false,
    reproducciones: 6543
  }
];

export default function BuscarMusicaPage() {
  const [termino, setTermino] = useState('');
  const [canciones, setCanciones] = useState<Cancion[]>([]);
  const [cancionesFiltradas, setCancionesFiltradas] = useState<Cancion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [cancionReproduciendo, setCancionReproduciendo] = useState<string | null>(null);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosBusqueda>({
    genero: '',
    año: '',
    duracion: '',
    artista: ''
  });

  const generos = ['Todos', 'Pop', 'Rock', 'Jazz', 'Electronic', 'Reggaeton', 'Salsa', 'Folk', 'Hip Hop', 'Country'];
  const años = ['Todos', '2023', '2022', '2021', '2020'];
  const duraciones = ['Todos', 'Corta (< 3 min)', 'Media (3-5 min)', 'Larga (> 5 min)'];

  const cargarCanciones = useCallback(async () => {
    setCargando(true);
    try {
      // Simular carga desde el storage
      await new Promise(resolve => setTimeout(resolve, 800));
      setCanciones(cancionesSimuladas);
    } catch (error) {
      console.error('Error cargando canciones:', error);
    } finally {
      setCargando(false);
    }
  }, []);

  const aplicarFiltros = useCallback(() => {
    let resultado = [...canciones];

    // Filtro por término de búsqueda
    if (termino.trim()) {
      resultado = resultado.filter(cancion =>
        cancion.titulo.toLowerCase().includes(termino.toLowerCase()) ||
        cancion.artista.toLowerCase().includes(termino.toLowerCase()) ||
        cancion.album.toLowerCase().includes(termino.toLowerCase()) ||
        cancion.genero.toLowerCase().includes(termino.toLowerCase())
      );
    }

    // Filtro por género
    if (filtros.genero && filtros.genero !== 'Todos') {
      resultado = resultado.filter(cancion => cancion.genero === filtros.genero);
    }

    // Filtro por año
    if (filtros.año && filtros.año !== 'Todos') {
      resultado = resultado.filter(cancion => cancion.año.toString() === filtros.año);
    }

    // Filtro por artista
    if (filtros.artista.trim()) {
      resultado = resultado.filter(cancion =>
        cancion.artista.toLowerCase().includes(filtros.artista.toLowerCase())
      );
    }

    // Filtro por duración
    if (filtros.duracion && filtros.duracion !== 'Todos') {
      resultado = resultado.filter(cancion => {
        const [minutos, segundos] = cancion.duracion.split(':').map(Number);
        const duracionTotal = minutos + segundos / 60;
        
        switch (filtros.duracion) {
          case 'Corta (< 3 min)':
            return duracionTotal < 3;
          case 'Media (3-5 min)':
            return duracionTotal >= 3 && duracionTotal <= 5;
          case 'Larga (> 5 min)':
            return duracionTotal > 5;
          default:
            return true;
        }
      });
    }

    setCancionesFiltradas(resultado);
  }, [termino, filtros, canciones]);

  useEffect(() => {
    cargarCanciones();
  }, [cargarCanciones]);

  useEffect(() => {
    aplicarFiltros();
  }, [aplicarFiltros]);

  const toggleReproduccion = (cancionId: string) => {
    if (cancionReproduciendo === cancionId) {
      setCancionReproduciendo(null);
    } else {
      setCancionReproduciendo(cancionId);
    }
  };

  const toggleFavorito = async (cancionId: string) => {
    setCanciones(prev => prev.map(cancion =>
      cancion.id === cancionId
        ? { ...cancion, es_favorito: !cancion.es_favorito }
        : cancion
    ));
  };

  const limpiarFiltros = () => {
    setFiltros({
      genero: '',
      año: '',
      duracion: '',
      artista: ''
    });
    setTermino('');
  };

  const formatearNumero = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
            <MagnifyingGlassIcon className="w-8 h-8 mr-3 text-purple-600" />
            Buscar Música 🎵
          </h2>
          <p className="text-gray-600">
            Explora y descubre nueva música en nuestra biblioteca
          </p>
        </div>

        {/* Buscador y filtros */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            {/* Barra de búsqueda principal */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={termino}
                onChange={(e) => setTermino(e.target.value)}
                placeholder="Buscar por título, artista, álbum o género..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
              />
            </div>

            {/* Controles de filtros */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => setMostrarFiltros(!mostrarFiltros)}
                  className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                    mostrarFiltros
                      ? 'bg-purple-100 border-purple-300 text-purple-700'
                      : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FunnelIcon className="w-4 h-4 mr-2" />
                  Filtros
                </button>
                {(termino || Object.values(filtros).some(f => f)) && (
                  <button
                    onClick={limpiarFiltros}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 underline"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>📊 {formatearNumero(cancionesFiltradas.length)} canciones encontradas</span>
              </div>
            </div>

            {/* Panel de filtros */}
            {mostrarFiltros && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border">
                <div>
                  <label htmlFor="filtro-genero" className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                  <select
                    id="filtro-genero"
                    value={filtros.genero}
                    onChange={(e) => setFiltros(prev => ({ ...prev, genero: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  >
                    {generos.map(genero => (
                      <option key={genero} value={genero === 'Todos' ? '' : genero}>
                        {genero}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="filtro-año" className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                  <select
                    id="filtro-año"
                    value={filtros.año}
                    onChange={(e) => setFiltros(prev => ({ ...prev, año: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  >
                    {años.map(año => (
                      <option key={año} value={año === 'Todos' ? '' : año}>
                        {año}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="filtro-duracion" className="block text-sm font-medium text-gray-700 mb-1">Duración</label>
                  <select
                    id="filtro-duracion"
                    value={filtros.duracion}
                    onChange={(e) => setFiltros(prev => ({ ...prev, duracion: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  >
                    {duraciones.map(duracion => (
                      <option key={duracion} value={duracion === 'Todos' ? '' : duracion}>
                        {duracion}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="filtro-artista" className="block text-sm font-medium text-gray-700 mb-1">Artista</label>
                  <input
                    id="filtro-artista"
                    type="text"
                    value={filtros.artista}
                    onChange={(e) => setFiltros(prev => ({ ...prev, artista: e.target.value }))}
                    placeholder="Buscar artista..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resultados de búsqueda */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <MusicalNoteIcon className="w-5 h-5 mr-2" />
              Resultados de Búsqueda
            </h3>
          </div>

          {cargando ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando música...</p>
            </div>
          ) : (
            <>
              {cancionesFiltradas.length === 0 ? (
                <div className="p-12 text-center">
                  <MagnifyingGlassIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron canciones</h3>
                  <p className="text-gray-600">
                    {termino || Object.values(filtros).some(f => f)
                      ? 'Intenta cambiar los filtros o términos de búsqueda'
                      : 'Comienza a buscar música escribiendo en el campo superior'
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {cancionesFiltradas.map((cancion) => (
                    <div key={cancion.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        {/* Imagen del álbum */}
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                            {cancion.imagen_url ? (
                              <Image 
                                src={cancion.imagen_url} 
                                alt={`Álbum ${cancion.album}`}
                                width={64}
                                height={64}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                            ) : (
                              <MusicalNoteIcon className="w-8 h-8 text-white" />
                            )}
                          </div>
                        </div>

                    {/* Información de la canción */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg font-medium text-gray-900 truncate">
                          {cancion.titulo}
                        </h4>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {cancion.genero}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <UserIcon className="w-4 h-4 mr-1" />
                          {cancion.artista}
                        </div>
                        <div className="flex items-center">
                          <MusicalNoteIcon className="w-4 h-4 mr-1" />
                          {cancion.album}
                        </div>
                        <div className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {cancion.duracion}
                        </div>
                        <div className="flex items-center">
                          <SpeakerWaveIcon className="w-4 h-4 mr-1" />
                          {formatearNumero(cancion.reproducciones)}
                        </div>
                      </div>
                    </div>

                    {/* Controles */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleFavorito(cancion.id)}
                        className={`p-2 rounded-full transition-colors ${
                          cancion.es_favorito
                            ? 'text-red-600 hover:text-red-700'
                            : 'text-gray-400 hover:text-red-600'
                        }`}
                      >
                        {cancion.es_favorito ? (
                          <HeartIconSolid className="w-5 h-5" />
                        ) : (
                          <HeartIcon className="w-5 h-5" />
                        )}
                      </button>

                      <button
                        onClick={() => toggleReproduccion(cancion.id)}
                        className="p-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                      >
                        {cancionReproduciendo === cancion.id ? (
                          <PauseIcon className="w-5 h-5" />
                        ) : (
                          <PlayIcon className="w-5 h-5" />
                        )}
                      </button>

                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
                        title="Agregar a playlist"
                      >
                        <PlusIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
