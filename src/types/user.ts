// Tipos de roles del sistema
export type UserRole = 'admin' | 'premium' | 'usuario';

// Interfaz para el usuario
export interface Usuario {
  id: string;
  email?: string;
  nombre?: string;
  rol: UserRole;
  estado?: 'activo' | 'inactivo';
  fecha_registro?: string;
}

// Permisos por rol
export interface RolePermissions {
  canDownload: boolean;
  canAccessHD: boolean;
  hasAds: boolean;
  maxPlaylists: number;
  canUploadMusic: boolean;
  canManageUsers: boolean;
  canAccessPremiumFeatures: boolean;
}

// Configuración de permisos por rol
export const rolePermissions: Record<UserRole, RolePermissions> = {
  usuario: {
    canDownload: false,
    canAccessHD: false,
    hasAds: true,
    maxPlaylists: 5,
    canUploadMusic: true,
    canManageUsers: false,
    canAccessPremiumFeatures: false,
  },
  premium: {
    canDownload: true,
    canAccessHD: true,
    hasAds: false,
    maxPlaylists: 50,
    canUploadMusic: true,
    canManageUsers: false,
    canAccessPremiumFeatures: true,
  },
  admin: {
    canDownload: true,
    canAccessHD: true,
    hasAds: false,
    maxPlaylists: -1, // Ilimitado
    canUploadMusic: true,
    canManageUsers: true,
    canAccessPremiumFeatures: true,
  },
};

// Función para verificar permisos
export function hasPermission(userRole: UserRole, permission: keyof RolePermissions): boolean {
  return rolePermissions[userRole][permission] as boolean;
}

// Función para obtener el límite de playlists
export function getPlaylistLimit(userRole: UserRole): number {
  return rolePermissions[userRole].maxPlaylists;
}
