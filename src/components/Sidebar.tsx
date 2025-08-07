'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSupabase } from '@/components/SupabaseProvider';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  HomeIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  PowerIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MusicalNoteIcon,
  HeartIcon,
  CloudArrowDownIcon,
  SparklesIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon
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
    // Items para Administrador
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: HomeIcon,
    description: 'Panel principal de administración',
    adminOnly: true
  },
  {
    name: 'Gestión de Usuarios',
    href: '/admin/usuarios',
    icon: UserGroupIcon,
    description: 'Administrar usuarios del sistema',
    adminOnly: true
  },
  {
    name: 'Contenido Musical',
    href: '/admin/biblioteca',
    icon: MusicalNoteIcon,
    description: 'Gestionar canciones y contenido',
    adminOnly: true
  },
  {
    name: 'Moderación',
    href: '/admin/moderacion',
    icon: ClipboardDocumentListIcon,
    description: 'Reportes y moderación de contenido',
    adminOnly: true
  },
  {
    name: 'Analíticas',
    href: '/admin/analiticas',
    icon: ChartBarIcon,
    description: 'Estadísticas y métricas',
    adminOnly: true
  },
  {
    name: 'Playlists',
    href: '/admin/playlists',
    icon: ClipboardDocumentListIcon,
    description: 'Gestión de listas de reproducción',
    adminOnly: true
  },
  {
    name: 'Favoritos',
    href: '/admin/favoritos',
    icon: HeartIcon,
    description: 'Gestión de favoritos',
    adminOnly: true
  },
  {
    name: 'Reproductor',
    href: '/admin/reproductor',
    icon: MusicalNoteIcon,
    description: 'Reproductor de música',
    adminOnly: true
  },


  // Items para Usuario Premium
  {
    name: 'Dashboard',
    href: '/premium/dashboard',
    icon: HomeIcon,
    description: 'Panel principal',
    premiumOnly: true
  },
  {
    name: 'Playlists',
    href: '/premium/playlists',
    icon: ClipboardDocumentListIcon,
    description: 'Listas de reproducción',
    premiumOnly: true
  },
  {
    name: 'Favoritos',
    href: '/premium/favoritos',
    icon: HeartIcon,
    description: 'Canciones favoritas',
    premiumOnly: true
  },
  {
    name: 'Reproductor',
    href: '/premium/reproductor',
    icon: MusicalNoteIcon,
    description: 'Reproductor de música',
    premiumOnly: true
  },
  {
    name: 'Música HD',
    href: '/premium/hd-music',
    icon: SparklesIcon,
    description: 'Calidad de audio superior',
    premiumOnly: true
  },
  {
    name: 'Descargas',
    href: '/premium/downloads',
    icon: CloudArrowDownIcon,
    description: 'Música sin conexión',
    premiumOnly: true
  },
  
  // Items para Artistas
  {
    name: 'Dashboard',
    href: '/artista/dashboard',
    icon: HomeIcon,
    description: 'Panel principal del artista',
    artistOnly: true
  },
  {
    name: 'Mi Biblioteca',
    href: '/artista/biblioteca',
    icon: MusicalNoteIcon,
    description: 'Tu colección musical',
    artistOnly: true
  },
  {
    name: 'Mi Música',
    href: '/artista/musica',
    icon: MusicalNoteIcon,
    description: 'Gestionar mis canciones',
    artistOnly: true
  },
  {
    name: 'Álbumes',
    href: '/artista/albumes',
    icon: ClipboardDocumentListIcon,
    description: 'Gestionar mis álbumes',
    artistOnly: true
  },
  {
    name: 'Estadísticas',
    href: '/artista/estadisticas',
    icon: ChartBarIcon,
    description: 'Análisis de mis canciones',
    artistOnly: true
  },
  {
    name: 'Playlists',
    href: '/artista/playlists',
    icon: ClipboardDocumentListIcon,
    description: 'Listas de reproducción',
    artistOnly: true
  },
  {
    name: 'Favoritos',
    href: '/artista/favoritos',
    icon: HeartIcon,
    description: 'Canciones favoritas',
    artistOnly: true
  },
  {
    name: 'Reproductor',
    href: '/artista/reproductor',
    icon: MusicalNoteIcon,
    description: 'Reproductor de música',
    artistOnly: true
  },

  // Items para Usuario Básico
  {
    name: 'Dashboard',
    href: '/usuario/dashboard',
    icon: HomeIcon,
    description: 'Panel principal'
  },
  {
    name: 'Mi Biblioteca',
    href: '/usuario/biblioteca',
    icon: MusicalNoteIcon,
    description: 'Tu colección musical'
  },
  {
    name: 'Buscar Música',
    href: '/usuario/buscar',
    icon: MagnifyingGlassIcon,
    description: 'Explorar y descubrir música'
  },
  {
    name: 'Playlists',
    href: '/usuario/playlists',
    icon: ClipboardDocumentListIcon,
    description: 'Listas de reproducción'
  },
  {
    name: 'Favoritos',
    href: '/usuario/favoritos',
    icon: HeartIcon,
    description: 'Canciones favoritas'
  },
  {
    name: 'Reproductor',
    href: '/usuario/reproductor',
    icon: MusicalNoteIcon,
    description: 'Reproductor de música'
  },
];

/**
 * Obtener el color de texto según el rol del usuario
 */
const getRoleTextColor = (isAdmin: boolean, isPremium: boolean) => {
  if (isAdmin) return 'text-blue-600';
  if (isPremium) return 'text-purple-600';
  return 'text-gray-600';
};

/**
 * Obtener la URL del perfil según el rol del usuario
 */
const getProfileUrl = (isAdmin: boolean, isPremium: boolean, isArtist: boolean) => {
  if (isAdmin) return "/admin/perfil";
  if (isPremium) return "/premium/perfil";
  if (isArtist) return "/artista/perfil";
  return "/usuario/perfil";
};

/**
 * Obtener la URL de configuración según el rol del usuario
 */
const getConfigUrl = (isAdmin: boolean, isPremium: boolean, isArtist: boolean) => {
  if (isAdmin) return "/admin/configuracion";
  if (isPremium) return "/premium/configuracion";
  if (isArtist) return "/artista/configuracion";
  return "/usuario/configuracion";
};

/**
 * Obtener la URL de upgrade según el rol del usuario
 */
const getUpgradeUrl = (isAdmin: boolean, isPremium: boolean, isArtist: boolean) => {
  if (isAdmin) return "/admin/upgrade";
  if (isPremium) return "/premium/upgrade";
  if (isArtist) return "/artista/upgrade";
  return "/usuario/upgrade";
};

/**
 * Renderizar el menú de perfil desplegable
 */
const renderProfileMenu = (
  isProfileMenuOpen: boolean,
  isAdmin: boolean,
  isPremium: boolean,
  isArtist: boolean,
  onClose: () => void,
  handleLogout: () => void,
  isLoggingOut: boolean
) => {
  if (!isProfileMenuOpen) return null;

  return (
    <div className="mt-2 space-y-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
      {isAdmin && (
        <>
          <Link
            href="/admin/configuracion-sistema"
            className="w-full flex items-center px-3 py-2 text-left rounded-md hover:bg-white hover:shadow-sm dark:hover:bg-gray-700 dark:hover:text-purple-300 transition-all duration-200"
          >
            <Cog6ToothIcon className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400 dark:hover:text-purple-300" />
            <span className="text-xs text-gray-700 dark:text-gray-200 font-medium">Configuración del Sistema</span>
          </Link>

          <Link
            href="/admin/configuracion-global"
            className="w-full flex items-center px-3 py-2 text-left rounded-md hover:bg-white hover:shadow-sm dark:hover:bg-gray-700 dark:hover:text-purple-300 transition-all duration-200"
          >
            <Cog6ToothIcon className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400 dark:hover:text-purple-300" />
            <span className="text-xs text-gray-700 dark:text-gray-200 font-medium">Configuración Global</span>
          </Link>
        </>
      )}

      {/* <Link
        href={getProfileUrl(isAdmin, isPremium, isArtist)}
        className="w-full flex items-center px-3 py-2 text-left rounded-md hover:bg-white dark:hover:bg-gray-600 hover:shadow-sm transition-all duration-200"
        onClick={onClose}
      >
        <GlobeAltIcon className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
        <span className="text-xs text-gray-700 dark:text-gray-200 font-medium">Perfil</span>
      </Link> */}

      <Link
        href={getConfigUrl(isAdmin, isPremium, isArtist)}
        className="w-full flex items-center px-3 py-2 text-left rounded-md hover:bg-white hover:shadow-sm dark:hover:bg-gray-700 dark:hover:text-purple-300 transition-all duration-200"
        onClick={onClose}
      >
        <Cog6ToothIcon className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400 dark:hover:text-purple-300" />
        <span className="text-xs text-gray-700 dark:text-gray-200 font-medium">Configuración</span>
      </Link>

      <Link
        href={getUpgradeUrl(isAdmin, isPremium, isArtist)}
        className="w-full flex items-center px-3 py-2 text-left rounded-md hover:bg-white hover:shadow-sm dark:hover:bg-gray-700 dark:hover:text-purple-300 transition-all duration-200"
        onClick={onClose}
      >
        <SparklesIcon className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400 dark:hover:text-purple-300" />
        <span className="text-xs text-gray-700 dark:text-gray-200 font-medium">Ver planes</span>
      </Link>

      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="w-full flex items-center px-3 py-2 text-left rounded-md hover:bg-white dark:hover:bg-gray-700 dark:hover:text-purple-300 hover:shadow-sm transition-all duration-200 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-purple-300 disabled:opacity-50"
      >
        <PowerIcon className="w-4 h-4 mr-2 dark:group-hover:text-purple-300" />
        <span className="text-xs font-medium">
          {isLoggingOut ? "Cerrando..." : "Cerrar Sesión"}
        </span>
      </button>
    </div>
  );
};

/**
 * Renderizar el header del sidebar
 */
const renderSidebarHeader = (props: {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  userName: string;
  getRoleColor: () => string;
  getRoleLabel: () => string;
  getUserInitials: (name: string) => string;
  isAdmin: boolean;
  isPremium: boolean;
  isProfileMenuOpen: boolean;
  setIsProfileMenuOpen: (value: boolean) => void;
  onClose: () => void;
  handleLogout: () => Promise<void> | void;
  isLoggingOut: boolean;
}) => {
  const {
    isCollapsed,
    setIsCollapsed,
    userName,
    getRoleColor,
    getRoleLabel,
    getUserInitials,
    isAdmin,
    isPremium,
    isProfileMenuOpen,
    setIsProfileMenuOpen,
    onClose,
    handleLogout,
    isLoggingOut
  } = props;

  return (
    <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
      {!isCollapsed ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-md ${getRoleColor()}`}>
                {getUserInitials(userName)}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-gray-900 truncate">
                  {userName}
                </h2>
                <p className={`text-xs font-medium ${getRoleTextColor(isAdmin, isPremium)}`}>
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
          
          {renderProfileMenu(isProfileMenuOpen, isAdmin, isPremium, false, onClose, handleLogout, isLoggingOut)}
        </div>
      )}
    </div>
  );
};

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

  // Filtrar items según el rol del usuario
  const filteredMenuItems = menuItems.filter(item => {
    // Items específicos para cada rol
    if (isAdmin && item.adminOnly) return true;
    if (isPremium && !isAdmin && item.premiumOnly) return true;
    if (isArtist && !isAdmin && !isPremium && item.artistOnly) return true;
    if (isUser && !item.adminOnly && !item.premiumOnly && !item.artistOnly) return true;
    
    // No mostrar items de otros roles
    return false;
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
    // Normalizar las rutas para comparación
    const normalizedHref = href.startsWith('/') ? href : '/' + href;
    const normalizedPathname = pathname;
    
    // Casos específicos de rutas exactas
    if (normalizedHref === '/admin/dashboard' && normalizedPathname === '/admin/dashboard') return true;
    if (normalizedHref === '/premium/dashboard' && normalizedPathname === '/premium/dashboard') return true;
    if (normalizedHref === '/artista/dashboard' && normalizedPathname === '/artista/dashboard') return true;
    if (normalizedHref === '/dashboard' && normalizedPathname === '/dashboard') return true;
    
    // Para otras rutas, verificar si el pathname actual comienza con la ruta
    return normalizedPathname.startsWith(normalizedHref) && normalizedHref !== '/dashboard' && normalizedHref !== '/admin/dashboard' && normalizedHref !== '/premium/dashboard' && normalizedHref !== '/artista/dashboard';
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
    if (!isActive) return 'text-gray-700 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400';
    
    if (isAdmin) return 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700';
    if (isPremium && !isAdmin) return 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700';
    return 'bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
  };

  const getIconStyles = (isActive: boolean) => {
    if (!isActive) return 'text-gray-500 group-hover:text-purple-600 dark:text-gray-400 dark:group-hover:text-purple-400';
    
    if (isAdmin) return 'text-blue-600 dark:text-blue-400';
    if (isPremium && !isAdmin) return 'text-purple-600 dark:text-purple-400';
    return 'text-gray-600 dark:text-gray-400';
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
        {renderSidebarHeader({
          isCollapsed,
          setIsCollapsed,
          userName,
          getRoleColor,
          getRoleLabel,
          getUserInitials,
          isAdmin,
          isPremium,
          isProfileMenuOpen,
          setIsProfileMenuOpen,
          onClose,
          handleLogout,
          isLoggingOut
        })}

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
                      } hover:bg-gray-50 dark:hover:bg-gray-700`}
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
                                  ? 'bg-gray-100 text-gray-900 border border-gray-200 dark:bg-gray-700 dark:text-purple-300 dark:border-gray-600' 
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-purple-300'
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
            {isUser && !isAdmin && !isPremium && !isArtist && !isCollapsed && (
              <li className="pt-4 border-t border-gray-200 mt-4">
                <Link
                  href="/usuario/upgrade"
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
