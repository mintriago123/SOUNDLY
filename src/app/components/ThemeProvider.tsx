'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';

type Theme = 'maykel' | 'walther';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('walther'); // Cambiar default a walther (claro)
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('soundly-theme') as Theme;
    if (stored && (stored === 'maykel' || stored === 'walther')) {
      setTheme(stored);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('soundly-theme', theme);
      
      // Aplicar la clase de tema al HTML
      const root = document.documentElement;
      const body = document.body;
      
      // Limpiar todas las clases de tema anteriores
      root.classList.remove('theme-maykel', 'theme-walther', 'dark');
      body.classList.remove('theme-maykel', 'theme-walther', 'dark');
      
      // Aplicar el tema seleccionado
      root.classList.add(`theme-${theme}`);
      body.classList.add(`theme-${theme}`);
      
      // Si es Modo Maykel, también aplicar dark para Tailwind
      if (theme === 'maykel') {
        root.classList.add('dark');
        body.classList.add('dark');
      }
      
      // Forzar actualización de estilos
      root.style.colorScheme = theme === 'maykel' ? 'dark' : 'light';
      
      console.log('Tema aplicado:', theme);
      console.log('Clases del HTML:', root.className);
      console.log('Clases del Body:', body.className);
    }
  }, [theme, mounted]);

  const contextValue = useMemo(() => ({
    theme,
    setTheme,
    isDark: theme === 'maykel'
  }), [theme]);

  if (!mounted) {
    return <div className="opacity-0">{children}</div>;
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
