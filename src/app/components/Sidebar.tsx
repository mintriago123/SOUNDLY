'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSupabase } from '@/app/components/SupabaseProvider';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  HomeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  PlusCircleIcon,
  Cog6ToothIcon,
  PowerIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MusicalNoteIcon,
  HeartIcon,
  CloudArrowDownIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

// Componente para el icono de infinito personalizado
const InfinityIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M12 12c-2-2-4-2-6 0s-2 4 0 6 4 2 6 0 4-2 6 0 2-4 0-6-4-2-6 0z" 
    />
  </svg>
);

interface SidebarProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly userRole?: string;
  readonly userName?: string;
  readonly className?: string;
}

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  premiumOnly?: boolean;
  adminOnly?: boolean;
  artistOnly?: boolean;
  subItems?: SubMenuItem[];
}

interface SubMenuItem {
  name: string;
  href: string;
  description?: string;
}

const menuItems: MenuItem[] = [
  // Items básicos para todos los usuarios
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    description: 'Panel principal'
  },
  {
    name: 'Mi Biblioteca',
    href: '/dashboard/biblioteca',
    icon: MusicalNoteIcon,
    description: 'Tu colección musical'
  },
  {
    name: 'Playlists',
    href: '/dashboard/playlists',
    icon: ClipboardDocumentListIcon,
    description: 'Listas de reproducción'
  },
  {
    name: 'Favoritos',
    href: '/dashboard/favoritos',
    icon: HeartIcon,
    description: 'Canciones favoritas'
  },
  {
    name: 'Reproductor',
    href: '/dashboard/reproductor',
    icon: MusicalNoteIcon,
    description: 'Reproductor de música'
  },
  
  // Items Premium
  {
    name: 'Música HD',
    href: '/dashboard/premium/hd-music',
    icon: SparklesIcon,
    description: 'Calidad de audio superior',
    premiumOnly: true
  },
  {
    name: 'Descargas',
    href: '/dashboard/premium/downloads',
    icon: CloudArrowDownIcon,
    description: 'Música sin conexión',
    premiumOnly: true
  },
  {
    name: 'Playlists Ilimitadas',
    href: '/dashboard/premium/unlimited',
    icon: InfinityIcon,
    description: 'Sin límites de creación',
    premiumOnly: true
  },
  {
    name: 'Estadísticas Avanzadas',
    href: '/dashboard/premium/stats',
    icon: ChartBarIcon,
    description: 'Análisis de escucha',
    premiumOnly: true
  },
  
  // Items para Artistas
  {
    name: 'Mi Música',
    href: '/dashboard/artista/musica',
    icon: MusicalNoteIcon,
    description: 'Gestionar mis canciones',
    artistOnly: true
  },
  {
    name: 'Estadísticas',
    href: '/dashboard/artista/estadisticas',
    icon: ChartBarIcon,
    description: 'Análisis de mis canciones',
    artistOnly: true
  },
  {
    name: 'Perfil de Artista',
    href: '/dashboard/artista/perfil',
    icon: UserIcon,
    description: 'Gestionar perfil público',
    artistOnly: true
  },
  {
    name: 'Álbumes',
    href: '/dashboard/artista/albumes',
    icon: ClipboardDocumentListIcon,
    description: 'Gestionar mis álbumes',
    artistOnly: true
  },
  
  // Items para Administradores
  // {
  //   name: 'Dashboard Admin',
  //   href: '/dashboard/admin',
  //   icon: HomeIcon,
  //   description: 'Panel de administración',
  //   adminOnly: true
  // },
  // {
  //   name: 'Usuarios',
  //   href: '/dashboard/admin/usuarios',
  //   icon: UserGroupIcon,
  //   description: 'Gestionar usuarios',
  //   adminOnly: true
  // },
  {
    name: 'Usuarios',
    href: '/dashboard/admin/roles',
    icon: UserIcon,
    description: 'Gestionar roles de usuario',
    adminOnly: true
  },
  // {
  //   name: 'Contenido',
  //   href: '/dashboard/admin/contenido',
  //   icon: MusicalNoteIcon,
  //   description: 'Gestionar música',
  //   adminOnly: true
  // },
  {
    name: 'Estadísticas',
    href: '/dashboard/admin/estadisticas',
    icon: ChartBarIcon,
    description: 'Métricas del sistema',
    adminOnly: true
  },
  {
    name: 'Configuración',
    href: '/dashboard/admin/configuracion',
    icon: Cog6ToothIcon,
    description: 'Ajustes del sistema',
    adminOnly: true
  },
  
  // Perfil (siempre al final)
  {
    name: 'Mi Perfil',
    href: '/dashboard/perfil',
    icon: UserIcon,
    description: 'Configuración personal'
  }
];

export default function Sidebar({ 
  isOpen,
  onClose,
  userRole = 'usuario',
  userName = 'Usuario',
  className = ''
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const { supabase } = useSupabase();

  // En dispositivos móviles, empezar contraído
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isAdmin = userRole === 'admin';
  const isPremium = userRole === 'premium';
  const isArtist = userRole === 'artista';
  const isUser = userRole === 'usuario' || !userRole;

  // Filtrar items según el rol
  const filteredMenuItems = menuItems.filter(item => {
    // Si es admin, solo mostrar items administrativos y perfil
    if (isAdmin) {
      return item.adminOnly || item.name === 'Mi Perfil';
    }
    
    // Para otros roles, aplicar filtros normales
    if (item.adminOnly && !isAdmin) return false;
    if (item.premiumOnly && !isPremium) return false;
    if (item.artistOnly && !isArtist) return false;
    return true;
  });

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard' && pathname === '/dashboard') return true;
    return pathname.startsWith(href) && href !== '/dashboard';
  };

  const toggleSubMenu = (itemName: string) => {
    setOpenSubMenus(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isSubMenuOpen = (itemName: string) => {
    return openSubMenus.includes(itemName);
  };

  const hasActiveSubItem = (subItems?: SubMenuItem[]) => {
    if (!subItems) return false;
    return subItems.some(subItem => isActiveRoute(subItem.href));
  };

  const getActiveStyles = (isActive: boolean) => {
    if (!isActive) return 'text-gray-700 hover:bg-gray-50 hover:text-gray-900';
    
    if (isAdmin) return 'bg-blue-50 text-blue-700 border border-blue-200';
    if (isPremium && !isAdmin) return 'bg-purple-50 text-purple-700 border border-purple-200';
    return 'bg-gray-50 text-gray-700 border border-gray-200';
  };

  const getIconStyles = (isActive: boolean) => {
    if (!isActive) return 'text-gray-500 group-hover:text-gray-700';
    
    if (isAdmin) return 'text-blue-600';
    if (isPremium && !isAdmin) return 'text-purple-600';
    return 'text-gray-600';
  };

  const getRoleColor = () => {
    if (isAdmin) return 'bg-blue-500 text-white';
    if (isPremium && !isAdmin) return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
    return 'bg-gray-500 text-white';
  };

  const getRoleLabel = () => {
    if (isAdmin) return 'Administrador';
    if (isPremium && !isAdmin) return 'Premium';
    return 'Usuario';
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  return (
    <>
      {/* Overlay para dispositivos móviles */}
      {isOpen && (
        <button 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden cursor-default"
          onClick={onClose}
          aria-label="Cerrar sidebar"
          type="button"
        />
      )}
      
      <div className={`fixed left-0 top-0 h-full bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-xl border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col z-40 ${
        isCollapsed ? 'w-16' : 'w-64'
      } ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${className}`}>
        
        {/* Header del Sidebar con Avatar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          {!isCollapsed ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {/* Avatar con iniciales */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-md ${getRoleColor()}`}>
                    {getUserInitials(userName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-gray-900 truncate">
                      {userName}
                    </h2>
                    <p className={`text-xs font-medium ${
                      isAdmin ? 'text-blue-600' : isPremium ? 'text-purple-600' : 'text-gray-600'
                    }`}>
                      {getRoleLabel()}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                  aria-label="Contraer sidebar"
                  title="Contraer sidebar"
                >
                  <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <button
                onClick={() => setIsCollapsed(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-md ${getRoleColor()}`}
                title={`Expandir sidebar - ${userName}`}
              >
                {getUserInitials(userName)}
              </button>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Expandir sidebar"
              >
                <ChevronRightIcon className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}
          
          {/* Menú de perfil expandible cuando no está colapsado */}
          {!isCollapsed && (
            <div className="mt-3">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <span className="text-xs text-gray-600 font-medium">Opciones de cuenta</span>
                {isProfileMenuOpen ? (
                  <ChevronUpIcon className="w-3 h-3 text-gray-500" />
                ) : (
                  <ChevronDownIcon className="w-3 h-3 text-gray-500" />
                )}
              </button>
              
              {isProfileMenuOpen && (
                <div className="mt-2 space-y-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                  <Link
                    href="/dashboard/perfil"
                    className="w-full flex items-center px-3 py-2 text-left rounded-md hover:bg-white dark:hover:bg-gray-600 hover:shadow-sm transition-all duration-200"
                    onClick={onClose}
                  >
                    <UserIcon className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                    <span className="text-xs text-gray-700 dark:text-gray-200 font-medium">Mi Perfil</span>
                  </Link>
                  <Link
                    href="/dashboard/configuracion"
                    className="w-full flex items-center px-3 py-2 text-left rounded-md hover:bg-white dark:hover:bg-gray-600 hover:shadow-sm transition-all duration-200"
                    onClick={onClose}
                  >
                    <Cog6ToothIcon className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                    <span className="text-xs text-gray-700 dark:text-gray-200 font-medium">Configuración</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center px-3 py-2 text-left rounded-md hover:bg-white dark:hover:bg-gray-600 hover:shadow-sm transition-all duration-200 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50"
                  >
                    <PowerIcon className="w-4 h-4 mr-2" />
                    <span className="text-xs font-medium">
                      {isLoggingOut ? 'Cerrando...' : 'Cerrar Sesión'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-2 overflow-y-auto">
          <ul className="space-y-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isSubMenuOpenState = isSubMenuOpen(item.name);
              const hasActiveSubItemState = hasActiveSubItem(item.subItems);
              const isItemActive = isActive || hasActiveSubItemState;
              
              return (
                <li key={item.name}>
                  {/* Item principal */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        if (hasSubItems && !isCollapsed) {
                          toggleSubMenu(item.name);
                        } else {
                          router.push(item.href);
                          onClose();
                        }
                      }}
                      className={`w-full flex items-center px-3 py-2.5 text-left rounded-lg transition-all duration-200 group ${
                        getActiveStyles(isItemActive)
                      }`}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <Icon className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : 'mr-3'} ${
                        getIconStyles(isItemActive)
                      }`} />
                      {!isCollapsed && (
                        <>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium">{item.name}</span>
                            {item.description && (
                              <p className="text-xs text-gray-500 mt-0.5 truncate">
                                {item.description}
                              </p>
                            )}
                          </div>
                          {hasSubItems && (
                            <div className="ml-2 transition-transform duration-200">
                              {isSubMenuOpenState ? (
                                <ChevronUpIcon className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </button>

                    {/* Submenú */}
                    {hasSubItems && !isCollapsed && isSubMenuOpenState && (
                      <div className="mt-1 ml-8 space-y-1 border-l-2 border-gray-100 pl-3">
                        {item.subItems!.map((subItem) => {
                          const isSubActive = isActiveRoute(subItem.href);
                          
                          return (
                            <button
                              key={subItem.name}
                              onClick={() => {
                                router.push(subItem.href);
                                onClose();
                              }}
                              className={`w-full flex items-start px-3 py-2 text-left rounded-md transition-all duration-200 group ${
                                isSubActive 
                                  ? 'bg-gray-100 text-gray-900 border border-gray-200' 
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium">{subItem.name}</span>
                                {subItem.description && (
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {subItem.description}
                                  </p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
            
            {/* Botón de Upgrade para usuarios gratuitos solamente */}
            {isUser && !isAdmin && !isCollapsed && (
              <li className="pt-4 border-t border-gray-200 mt-4">
                <Link
                  href="/dashboard/upgrade"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all"
                  onClick={onClose}
                >
                  <SparklesIcon className="w-5 h-5" />
                  <span className="font-medium">Actualizar a Premium</span>
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </>
  );
}
