'use client';

import { useTheme } from './ThemeProviderEnhanced';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: 'maykel' | 'walther') => {
    console.log('Cambiando tema a:', newTheme);
    setTheme(newTheme);
    
    // Forzar una actualización visual
    setTimeout(() => {
      const root = document.documentElement;
      console.log('Después del cambio - HTML classes:', root.className);
    }, 100);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <span className="text-xl mr-2">🎨</span>
        <span>Apariencia del Sistema</span>
      </h3>
      
      <div className="space-y-3">
        {/* Modo Maykel (Oscuro) */}
        <button
          onClick={() => handleThemeChange('maykel')}
          className={`w-full p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-between ${
            theme === 'maykel'
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-2 ring-purple-200'
              : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-gray-900 rounded-full flex items-center justify-center">
              <MoonIcon className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white">Modo Maykel</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Tema oscuro, perfecto para la noche</div>
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
          className={`w-full p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-between ${
            theme === 'walther'
              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 ring-2 ring-orange-200'
              : 'border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full flex items-center justify-center">
              <SunIcon className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white">Modo Walther</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Tema claro, ideal para el día</div>
            </div>
          </div>
          {theme === 'walther' && (
            <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          )}
        </button>
      </div>

      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">💡</span>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Los cambios se aplicarán inmediatamente en toda la aplicación
          </p>
        </div>
        {/* Debug info */}
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
          Tema actual: <span className="font-mono">{theme}</span>
        </div>
      </div>
    </div>
  );
}
