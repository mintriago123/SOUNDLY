'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [barHeights, setBarHeights] = useState<number[]>([]);

  // Generar las alturas aleatorias solo en el cliente para evitar hydration errors
  useEffect(() => {
    setBarHeights([...Array(5)].map(() => Math.random() * 40 + 20));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#100725] via-[#220639] to-[#491358] relative overflow-hidden">
      {/* Background animated elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-gradient-to-br from-[#6e1f86] to-[#ba319f] rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-gradient-to-tr from-[#ba319f] to-[#6e1f86] rounded-full opacity-20 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-[#491358] to-[#6e1f86] rounded-full opacity-10 blur-2xl animate-bounce"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center p-6 lg:p-8">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-r from-[#6e1f86] to-[#ba319f] rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#ba319f] to-white bg-clip-text text-transparent">
            Soundly
          </h1>
        </div>
        
        <div className="flex space-x-4">
          <Link href="/auth/login" className="text-white hover:text-gray-300 transition-colors">
            <button className="px-6 py-2 border border-[#6e1f86] text-[#ba319f] rounded-full hover:bg-[#6e1f86] hover:text-white transition-all duration-300 font-medium">
              Login
            </button>
          </Link>
          <Link href="/auth/register">
            <button className="px-6 py-2 bg-gradient-to-r from-[#6e1f86] to-[#ba319f] text-white rounded-full hover:shadow-lg hover:shadow-[#ba319f]/25 transition-all duration-300 font-medium">
              Register
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-[#ba319f] to-[#6e1f86] bg-clip-text text-transparent leading-tight">
            Descubre la Música
            <br />
            <span className="text-4xl lg:text-6xl">que Amas</span>
          </h2>
          
          <p className="text-xl lg:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Sumérgete en un universo sonoro infinito. Millones de canciones, artistas y playlists 
            esperándote en la mejor calidad de audio.
          </p>

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href="/auth/register">
              <button className="px-8 py-4 bg-gradient-to-r from-[#6e1f86] to-[#ba319f] text-white rounded-full text-lg font-semibold hover:shadow-xl hover:shadow-[#ba319f]/30 transition-all duration-300 transform hover:scale-105">
                Comenzar Gratis
              </button>
            </Link>
            
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center space-x-2 px-8 py-4 border border-[#6e1f86] text-white rounded-full text-lg font-semibold hover:bg-[#6e1f86]/20 transition-all duration-300"
            >
              <svg className={`w-6 h-6 ${isPlaying ? 'animate-spin' : ''}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <span>Escuchar Demo</span>
            </button>
          </div>

          {/* Features Cards */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mt-20">
            <div className="bg-white/5 backdrop-blur-sm border border-[#6e1f86]/30 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-[#6e1f86] to-[#ba319f] rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Audio HD</h3>
              <p className="text-gray-400">Disfruta de música en alta definición sin comprometer la calidad.</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-[#6e1f86]/30 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-[#6e1f86] to-[#ba319f] rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Playlists Inteligentes</h3>
              <p className="text-gray-400">IA que aprende tus gustos y crea listas perfectas para ti.</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-[#6e1f86]/30 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-[#6e1f86] to-[#ba319f] rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Sin Límites</h3>
              <p className="text-gray-400">Acceso ilimitado a millones de canciones de todos los géneros.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Floating music visualizer */}
      {barHeights.length > 0 && (
        <div className="fixed bottom-8 right-8 z-20">
          <div className="flex space-x-1 items-end">
            {barHeights.map((height, i) => (
              <div
                key={i}
                className={`w-2 bg-gradient-to-t from-[#6e1f86] to-[#ba319f] rounded-full ${
                  isPlaying ? 'animate-pulse' : ''
                }`}
                style={{
                  height: `${height}px`,
                  animationDelay: `${i * 0.1}s`
                }}
              ></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
