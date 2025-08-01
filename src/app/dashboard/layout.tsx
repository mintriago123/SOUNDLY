import DashboardLayout from '@/app/components/DashboardLayout';

interface DashboardPageLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout específico para todas las páginas del dashboard
 * 
 * Este layout envuelve todas las páginas dentro de /dashboard/
 * y proporciona la estructura común del dashboard incluyendo:
 * - Sidebar de navegación
 * - Header con información del usuario
 * - Área principal de contenido
 * 
 * @param children - Contenido de las páginas hijas del dashboard
 */
export default function DashboardPageLayout({ children }: DashboardPageLayoutProps) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}
