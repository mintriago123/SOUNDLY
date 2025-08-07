// Utilidad para prevenir errores de renderizado de objetos
import React from 'react';

// Función para verificar si un valor es seguro para renderizar
export const isSafeToRender = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return true;
  if (React.isValidElement(value)) return true;
  return false;
};

// Función para convertir cualquier valor a algo seguro para renderizar
export const makeSafeForRender = (value: any): React.ReactNode => {
  if (isSafeToRender(value)) {
    return value;
  }
  
  // Si es un objeto, no lo renderices directamente
  if (typeof value === 'object') {
    console.warn('⚠️ Objeto detectado en renderizado. Convirtiendo a string:', value);
    return null; // O podrías devolver una representación string si es necesario
  }
  
  return String(value);
};

// Hook para debugging seguro
export const useDebugSafe = () => {
  const debugRender = (data: any, label = 'Debug') => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${label}]`, data);
    }
    return null; // No renderiza nada en la UI
  };
  
  return { debugRender };
};

// Componente ErrorBoundary simple para capturar errores de renderizado
export class RenderErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('Error de renderizado capturado:', error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Detalles del error de renderizado:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Algo salió mal al renderizar este componente.</div>;
    }

    return this.props.children;
  }
}

export default { isSafeToRender, makeSafeForRender, useDebugSafe, RenderErrorBoundary };
