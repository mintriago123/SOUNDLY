'use client';

import { useTheme } from './ThemeProviderEnhanced';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useEffect } from 'react';

export default function ThemeSelectorClean() {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: 'oscuro' | 'claro') => {
    console.log('Cambiando tema a:', newTheme);
    setTheme(newTheme);
    
    // Aplicar directamente al body para forzar cambios
    setTimeout(() => {
      const body = document.body;
      const root = document.documentElement;

      if (newTheme === 'claro') {
        body.style.backgroundColor = '#fefcff';
        body.style.color = '#1a0b2e';
        root.style.colorScheme = 'light';
      } else {
        body.style.backgroundColor = '#0f0f23';
        body.style.color = '#ffffff';
        root.style.colorScheme = 'dark';
      }
      
      console.log('Estilos aplicados:', {
        backgroundColor: body.style.backgroundColor,
        color: body.style.color,
        theme: newTheme
      });
    }, 50);
  };

  // Aplicar tema inicial en mount
  useEffect(() => {
    handleThemeChange(theme);
  }, [theme]);

  // Función para obtener estilos según el tema
  const getContainerStyles = () => {
    return {
      backgroundColor: theme === 'claro' ? '#ffffff' : '#1f2937',
      color: theme === 'claro' ? '#1a0b2e' : '#ffffff',
      borderColor: theme === 'claro' ? '#e5e7eb' : '#374151'
    };
  };

  const getButtonStyles = (isActive: boolean, buttonTheme: 'oscuro' | 'claro') => {
    if (isActive) {
      return buttonTheme === 'oscuro' 
        ? { backgroundColor: '#f3e8ff', borderColor: '#8b5cf6', color: '#1a0b2e' }
        : { backgroundColor: '#fff7ed', borderColor: '#f97316', color: '#1a0b2e' };
    }
    
    return theme === 'claro'
      ? { backgroundColor: '#f9fafb', borderColor: '#d1d5db', color: '#374151' }
      : { backgroundColor: '#374151', borderColor: '#6b7280', color: '#ffffff' };
  };

  const getInfoBackgroundStyle = () => {
    return {
      backgroundColor: theme === 'claro' ? '#f9fafb' : '#374151'
    };
  };

  return (
    <div 
      style={getContainerStyles()}
      className="rounded-xl shadow-sm border p-6 transition-all duration-300"
    >
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <span className="text-xl mr-2">🎨</span>
        <span>Configuración de Apariencia</span>
      </h3>
      
      <div className="space-y-3">
        {/* Modo Oscuro */}
        <button
          onClick={() => handleThemeChange('oscuro')}
          style={getButtonStyles(theme === 'oscuro', 'oscuro')}
          className="w-full p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-between hover:shadow-md"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-800 rounded-full flex items-center justify-center shadow-lg">
              <MoonIcon className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <div className="font-medium">Modo Oscuro</div>
              <div className="text-sm opacity-70">Tema oscuro elegante y moderno</div>
            </div>
          </div>
          {theme === 'oscuro' && (
            <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          )}
        </button>

        {/* Modo Claro */}
        <button
          onClick={() => handleThemeChange('claro')}
          style={getButtonStyles(theme === 'claro', 'claro')}
          className="w-full p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-between hover:shadow-md"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full flex items-center justify-center shadow-lg">
              <SunIcon className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <div className="font-medium">Modo Claro</div>
              <div className="text-sm opacity-70">Tema claro y vibrante</div>
            </div>
          </div>
          {theme === 'claro' && (
            <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          )}
        </button>
      </div>

      {/* Información del estado actual */}
      <div 
        style={getInfoBackgroundStyle()}
        className="mt-4 p-3 rounded-lg"
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm">💡</span>
          <p className="text-xs opacity-70">
            Los cambios se aplicarán inmediatamente en toda la aplicación
          </p>
        </div>
        
        {/* Estado actual */}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs opacity-60">
            Tema activo: <span className="font-mono font-medium">
              {theme === 'oscuro' ? 'Modo Oscuro' : 'Modo Claro'}
            </span>
          </div>
          <div className="text-lg">
            {theme === 'oscuro' ? '🌙' : '☀️'}
          </div>
        </div>
      </div>
    </div>
  );
}
