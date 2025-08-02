'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRouter } from 'next/navigation';
import { 
  UserIcon, 
  CameraIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  MusicalNoteIcon,
  GlobeAltIcon,
  EnvelopeIcon 
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/DashboardLayout';

interface PerfilArtista {
  id: string;
  nombre_artistico: string;
  biografia: string;
  generos: string[];
  pais: string;
  ciudad: string;
  website?: string;
  instagram?: string;
  twitter?: string;
  spotify?: string;
  foto_perfil?: string;
  portada?: string;
}

export default function PerfilArtista() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [perfil, setPerfil] = useState<PerfilArtista>({
    id: '',
    nombre_artistico: '',
    biografia: '',
    generos: [],
    pais: '',
    ciudad: '',
    website: '',
    instagram: '',
    twitter: '',
    spotify: ''
  });
  const [editando, setEditando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [usuario, setUsuario] = useState<any>(null);

  const generosDisponibles = [
    'Pop', 'Rock', 'Hip Hop', 'R&B', 'Country', 'Folk', 'Jazz', 'Blues',
    'Electronic', 'Reggaeton', 'Salsa', 'Bachata', 'Merengue', 'Cumbia',
    'Alternative', 'Indie', 'Punk', 'Metal', 'Classical', 'Reggae'
  ];

  useEffect(() => {
    verificarUsuarioYCargarPerfil();
  }, []);

  const verificarUsuarioYCargarPerfil = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Obtener datos del usuario
      const { data: userData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!userData || userData.rol !== 'artista') {
        router.push('/dashboard');
        return;
      }

      setUsuario(userData);
      await cargarPerfilArtista(user.id);
    } catch (error) {
      console.error('Error verificando usuario:', error);
    } finally {
      setCargando(false);
    }
  };

  const cargarPerfilArtista = async (userId: string) => {
    try {
      // Simulamos datos del perfil del artista
      const perfilSimulado: PerfilArtista = {
        id: userId,
        nombre_artistico: usuario?.nombre || 'Mi Nombre Artístico',
        biografia: 'Soy un artista apasionado por la música que busca conectar con las emociones de mi audiencia a través de mis canciones.',
        generos: ['Pop', 'Rock'],
        pais: 'España',
        ciudad: 'Madrid',
        website: 'https://miwebsite.com',
        instagram: '@miartista',
        twitter: '@miartista',
        spotify: 'Mi Artista'
      };
      
      setPerfil(perfilSimulado);
    } catch (error) {
      console.error('Error cargando perfil:', error);
    }
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setPerfil(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleGenero = (genero: string) => {
    setPerfil(prev => ({
      ...prev,
      generos: prev.generos.includes(genero)
        ? prev.generos.filter(g => g !== genero)
        : [...prev.generos, genero]
    }));
  };

  const guardarCambios = async () => {
    setGuardando(true);
    try {
      // Aquí implementarías la lógica para guardar en la base de datos
      console.log('Guardando perfil:', perfil);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
      setEditando(false);
    } catch (error) {
      console.error('Error guardando perfil:', error);
    } finally {
      setGuardando(false);
    }
  };

  const cancelarEdicion = () => {
    setEditando(false);
    // Recargar datos originales si es necesario
    cargarPerfilArtista(usuario.id);
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando perfil...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <UserIcon className="h-8 w-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">Perfil de Artista</h1>
            </div>
            
            <div className="flex space-x-2">
              {editando ? (
                <>
                  <button
                    onClick={cancelarEdicion}
                    disabled={guardando}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    Cancelar
                  </button>
                  <button
                    onClick={guardarCambios}
                    disabled={guardando}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    {guardando ? 'Guardando...' : 'Guardar'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditando(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Editar Perfil
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Portada y Foto de Perfil */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            {/* Portada */}
            <div className="h-48 bg-gradient-to-r from-purple-500 to-pink-600 relative">
              {editando && (
                <button className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70">
                  <CameraIcon className="h-5 w-5" />
                </button>
              )}
            </div>
            
            {/* Foto de perfil y información básica */}
            <div className="relative px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6">
                {/* Foto de perfil */}
                <div className="relative -mt-16 mb-4 sm:mb-0">
                  <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    {perfil.foto_perfil ? (
                      <img 
                        src={perfil.foto_perfil} 
                        alt="Foto de perfil" 
                        className="w-28 h-28 rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                  {editando && (
                    <button className="absolute bottom-0 right-0 p-2 bg-purple-600 rounded-full text-white hover:bg-purple-700">
                      <CameraIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {/* Información básica */}
                <div className="flex-1 pt-4">
                  {editando ? (
                    <input
                      type="text"
                      value={perfil.nombre_artistico}
                      onChange={(e) => handleInputChange('nombre_artistico', e.target.value)}
                      className="text-2xl font-bold text-gray-900 border-b border-gray-300 bg-transparent focus:border-purple-600 focus:outline-none w-full"
                      placeholder="Tu nombre artístico"
                    />
                  ) : (
                    <h2 className="text-2xl font-bold text-gray-900">{perfil.nombre_artistico}</h2>
                  )}
                  
                  <div className="mt-2 flex flex-wrap gap-2">
                    {perfil.generos.map((genero) => (
                      <span key={genero} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {genero}
                      </span>
                    ))}
                  </div>
                  
                  <p className="mt-2 text-gray-600">
                    {perfil.ciudad}, {perfil.pais}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Información detallada */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Biografía */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Biografía</h3>
              {editando ? (
                <textarea
                  value={perfil.biografia}
                  onChange={(e) => handleInputChange('biografia', e.target.value)}
                  rows={6}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Cuéntanos sobre ti como artista..."
                />
              ) : (
                <p className="text-gray-700 leading-relaxed">{perfil.biografia}</p>
              )}
            </div>

            {/* Géneros musicales */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Géneros Musicales</h3>
              {editando ? (
                <div className="grid grid-cols-2 gap-2">
                  {generosDisponibles.map((genero) => (
                    <label key={genero} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={perfil.generos.includes(genero)}
                        onChange={() => toggleGenero(genero)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{genero}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {perfil.generos.map((genero) => (
                    <span key={genero} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      <MusicalNoteIcon className="h-4 w-4 mr-1" />
                      {genero}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Ubicación */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ubicación</h3>
              {editando ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                    <input
                      type="text"
                      value={perfil.pais}
                      onChange={(e) => handleInputChange('pais', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                    <input
                      type="text"
                      value={perfil.ciudad}
                      onChange={(e) => handleInputChange('ciudad', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center text-gray-700">
                  <GlobeAltIcon className="h-5 w-5 mr-2" />
                  {perfil.ciudad}, {perfil.pais}
                </div>
              )}
            </div>

            {/* Redes sociales */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Redes Sociales</h3>
              {editando ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      value={perfil.website || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      placeholder="https://tuwebsite.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                    <input
                      type="text"
                      value={perfil.instagram || ''}
                      onChange={(e) => handleInputChange('instagram', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      placeholder="@tuinstagram"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
                    <input
                      type="text"
                      value={perfil.twitter || ''}
                      onChange={(e) => handleInputChange('twitter', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      placeholder="@tutwitter"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Spotify</label>
                    <input
                      type="text"
                      value={perfil.spotify || ''}
                      onChange={(e) => handleInputChange('spotify', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Tu nombre en Spotify"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {perfil.website && (
                    <a href={perfil.website} target="_blank" rel="noopener noreferrer" className="flex items-center text-purple-600 hover:text-purple-800">
                      <GlobeAltIcon className="h-5 w-5 mr-2" />
                      Website
                    </a>
                  )}
                  {perfil.instagram && (
                    <div className="flex items-center text-gray-700">
                      <span className="text-pink-600 mr-2">📷</span>
                      {perfil.instagram}
                    </div>
                  )}
                  {perfil.twitter && (
                    <div className="flex items-center text-gray-700">
                      <span className="text-blue-500 mr-2">🐦</span>
                      {perfil.twitter}
                    </div>
                  )}
                  {perfil.spotify && (
                    <div className="flex items-center text-gray-700">
                      <span className="text-green-500 mr-2">🎵</span>
                      {perfil.spotify}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>
      </main>
    </div>
    </DashboardLayout>
  );
}
