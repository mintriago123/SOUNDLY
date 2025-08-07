// Archivo temporal para debuggear el problema de renderizado de objetos
// Este archivo te ayudará a identificar dónde está ocurriendo el error

import React from 'react';

// Componente para renderizar objetos de forma segura
export const SafeObjectDisplay = ({ data, title = "Debug Data" }: { data: any, title?: string }) => {
  if (data === null || data === undefined) {
    return <span>null/undefined</span>;
  }
  
  if (typeof data === 'object') {
    return (
      <details className="debug-object">
        <summary>{title}</summary>
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    );
  }
  
  return <span>{String(data)}</span>;
};

// Hook para detectar renderizado de objetos
export const useObjectRenderDetection = () => {
  React.useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('Objects are not valid as a React child')) {
        console.log('🚨 OBJETO RENDERIZADO DETECTADO:', message);
        console.trace('Stack trace del error:');
      }
      originalConsoleError.apply(console, args);
    };
    
    return () => {
      console.error = originalConsoleError;
    };
  }, []);
};

export default SafeObjectDisplay;
