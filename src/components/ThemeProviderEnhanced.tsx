'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';

type Theme = 'oscuro' | 'claro';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { readonly children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('claro');
  const [mounted, setMounted] = useState(false);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    const body = document.body;
    
    // Limpiar todas las clases de tema
    root.classList.remove('theme-oscuro', 'theme-claro', 'dark');
    body.classList.remove('theme-oscuro', 'theme-claro', 'dark');

    // Aplicar nuevo tema
    root.classList.add(`theme-${newTheme}`);
    body.classList.add(`theme-${newTheme}`);

    if (newTheme === 'oscuro') {
      root.classList.add('dark');
      body.classList.add('dark');
      root.style.colorScheme = 'dark';
      
      // Aplicar estilos directos para modo oscuro
      body.style.backgroundColor = '#0f0f23';
      body.style.color = '#ffffff';
    } else {
      root.style.colorScheme = 'light';
      
      // Aplicar estilos directos para modo claro
      body.style.backgroundColor = '#fefcff';
      body.style.color = '#1a0b2e';
    }
    
    console.log(`Tema aplicado: ${newTheme}`, {
      rootClasses: root.className,
      bodyClasses: body.className,
      bodyStyle: {
        backgroundColor: body.style.backgroundColor,
        color: body.style.color
      }
    });
  };

  useEffect(() => {
    const stored = localStorage.getItem('soundly-theme') as Theme;
    if (stored && (stored === 'oscuro' || stored === 'claro')) {
      setTheme(stored);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('soundly-theme', theme);
      applyTheme(theme);
    }
  }, [theme, mounted]);

  const contextValue = useMemo(() => ({
    theme,
    setTheme: (newTheme: Theme) => {
      console.log('Cambiando tema a:', newTheme);
      setTheme(newTheme);
      if (mounted) {
        applyTheme(newTheme);
      }
    },
    isDark: theme === 'oscuro'
  }), [theme, mounted]);

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
