'use client';

import { useTheme } from './ThemeProviderEnhanced';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useEffect } from 'react';

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: 'maykel' | 'walther') => {
    console.log('Cambiando tema a:', newTheme);
    setTheme(newTheme);
    
    // Aplicar directamente al body
    setTimeout(() => {
      const body = document.body;
      const root = document.documentElement;
      
      if (newTheme === 'walther') {
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

  // Forzar aplicación de estilos en mount
  useEffect(() => {
    handleThemeChange(theme);
  }, [theme]);

  return (
    <div 
      style={{
        backgroundColor: theme === 'walther' ? '#ffffff' : '#1f2937',
        color: theme === 'walther' ? '#1a0b2e' : '#ffffff',
        borderColor: theme === 'walther' ? '#e5e7eb' : '#374151'
      }}
      className="rounded-xl shadow-sm border p-6 transition-all duration-300"
    >
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <span className="text-xl mr-2">🎨</span>
        <span>Apariencia del Sistema</span>
      </h3>
      
      <div className="space-y-3">
        {/* Modo Maykel (Oscuro) */}
        <button
          onClick={() => handleThemeChange('maykel')}
          style={{
            backgroundColor: theme === 'maykel' ? '#f3e8ff' : '#f9fafb',
            borderColor: theme === 'maykel' ? '#8b5cf6' : '#d1d5db',
            color: theme === 'walther' ? '#1a0b2e' : '#ffffff'
          }}
          className="w-full p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-gray-900 rounded-full flex items-center justify-center">
              <MoonIcon className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <div className="font-medium">Modo Maykel</div>
              <div className="text-sm opacity-70">Tema oscuro, perfecto para la noche</div>
            </div>
          </div>
          {theme === 'maykel' && (
            <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          )}
        </button>

        {/* Modo Walther (Claro) */}
        <button
          onClick={() => handleThemeChange('walther')}
          style={{
            backgroundColor: theme === 'walther' ? '#fff7ed' : '#f9fafb',
            borderColor: theme === 'walther' ? '#f97316' : '#d1d5db',
            color: theme === 'walther' ? '#1a0b2e' : '#ffffff'
          }}
          className="w-full p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full flex items-center justify-center">
              <SunIcon className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <div className="font-medium">Modo Walther</div>
              <div className="text-sm opacity-70">Tema claro, ideal para el día</div>
            </div>
          </div>
          {theme === 'walther' && (
            <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          )}
        </button>
      </div>

      <div 
        style={{
          backgroundColor: theme === 'walther' ? '#f9fafb' : '#374151'
        }}
        className="mt-4 p-3 rounded-lg"
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm">💡</span>
          <p className="text-xs opacity-70">
            Los cambios se aplicarán inmediatamente en toda la aplicación
          </p>
        </div>
        {/* Debug info */}
        <div className="mt-2 text-xs opacity-60">
          Tema actual: <span className="font-mono">{theme}</span>
        </div>
      </div>
    </div>
  );
}
