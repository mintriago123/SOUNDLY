'use client';

import React from 'react';

// Componente wrapper para prevenir errores de renderizado de objetos
export const SafeRender = ({ children, fallback = null }: { children: React.ReactNode, fallback?: React.ReactNode }) => {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error('Error de renderizado capturado:', error);
    return <>{fallback}</>;
  }
};

// Hook para detectar y prevenir renderizado de objetos
export const useRenderSafety = () => {
  const safeStringify = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (typeof value === 'object') {
      console.warn('⚠️ Intento de renderizar objeto detectado:', value);
      return JSON.stringify(value);
    }
    return String(value);
  };

  const safeRender = (value: any) => {
    if (React.isValidElement(value)) {
      return value;
    }
    return safeStringify(value);
  };

  return { safeStringify, safeRender };
};

export default SafeRender;
