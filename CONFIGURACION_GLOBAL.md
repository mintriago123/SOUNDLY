# Sistema de Configuración Global de Soundly 🌐

## Descripción General

El sistema de configuración global de Soundly permite centralizar y gestionar todos los parámetros que afectan a la plataforma completa. Este sistema está diseñado para ser escalable, flexible y fácil de mantener.

## Arquitectura del Sistema

### 1. Base de Datos (PostgreSQL)

#### Tabla `configuracion_sistema`
Contiene todos los parámetros principales de configuración:

```sql
-- Archivos y uploads
max_file_size: INTEGER (tamaño máximo en MB)
allowed_formats: TEXT[] (formatos permitidos: mp3, wav, flac, etc.)
max_uploads_per_day: INTEGER
upload_approval_required: BOOLEAN

-- Precios y suscripciones  
premium_price_monthly: DECIMAL(10,2)
premium_price_yearly: DECIMAL(10,2)
premium_discount_yearly: INTEGER (porcentaje de descuento)
artist_verification_fee: DECIMAL(10,2)
commission_percentage: DECIMAL(5,2)

-- Límites de usuarios
max_playlists_free: INTEGER
max_playlists_premium: INTEGER (-1 = ilimitado)
max_followers_free: INTEGER
max_followers_premium: INTEGER (-1 = ilimitado)

-- Sistema y seguridad
maintenance_mode: BOOLEAN
registration_enabled: BOOLEAN
max_login_attempts: INTEGER
session_timeout_minutes: INTEGER
```

#### Tabla `configuraciones_features`
Gestiona características específicas y su disponibilidad:

```sql
feature_name: VARCHAR(100) (nombre único de la característica)
enabled: BOOLEAN (si está habilitada globalmente)
requires_premium: BOOLEAN (si requiere suscripción premium)
config_data: JSONB (configuración específica de la característica)
description: TEXT (descripción de la característica)
```

### 2. Funciones SQL

#### `get_system_config()`
Obtiene toda la configuración del sistema de forma optimizada.

#### `update_system_config(config_updates JSONB)`
Actualiza múltiples configuraciones de forma atómica.

#### `get_feature_config(feature_name VARCHAR)`
Obtiene la configuración de una característica específica.

#### `user_can_access_feature(feature_name VARCHAR, user_is_premium BOOLEAN)`
Verifica si un usuario puede acceder a una característica.

### 3. Frontend (React/Next.js)

#### Hook `useConfiguracionGlobal`

```typescript
const { 
  config,          // Configuración completa del sistema
  features,        // Lista de características
  loading,         // Estado de carga
  updateConfig,    // Función para actualizar configuración
  updateFeature,   // Función para actualizar características
  isFeatureEnabled,// Verificar si una característica está habilitada
  getPremiumPricing // Obtener información de precios
} = useConfiguracionGlobal();
```

#### Hook `useFeatureAccess`

```typescript
const { canAccessFeature } = useFeatureAccess();

// Verificar acceso
const hasEqualizer = canAccessFeature('custom_equalizer', userIsPremium);
```

## Características Implementadas

### 🎵 Audio y Calidad
- **high_quality_audio**: Audio hasta 320kbps para usuarios Premium
- **custom_equalizer**: Ecualizador personalizado con presets
- **lyrics_display**: Mostrar letras de canciones

### 📱 Funcionalidades Sociales  
- **social_sharing**: Compartir en redes sociales
- **collaborative_playlists**: Playlists colaborativas
- **comments_enabled**: Sistema de comentarios

### 💾 Descargas y Offline
- **offline_downloads**: Descargas para escucha offline
- **download_enabled**: Control global de descargas

### 📊 Analíticas
- **advanced_analytics**: Métricas detalladas para artistas
- **analytics_enabled**: Control global de analíticas

### 🎪 Características Avanzadas
- **live_streaming**: Transmisiones en vivo
- **collaborative_playlists**: Playlists colaborativas

## Ejemplos de Uso

### 1. Configurar Precios Dinámicos

```typescript
// En el componente de admin
const { updateConfig } = useConfiguracionGlobal();

const handlePriceUpdate = async () => {
  await updateConfig({
    premium_price_monthly: 12.99,
    premium_price_yearly: 129.99,
    premium_discount_yearly: 20
  });
};
```

### 2. Control de Características por Usuario

```typescript
// En el reproductor de música
const { canAccessFeature } = useFeatureAccess();

function MusicPlayer({ userIsPremium }) {
  const hasEqualizer = canAccessFeature('custom_equalizer', userIsPremium);
  const hasDownloads = canAccessFeature('offline_downloads', userIsPremium);
  
  return (
    <div>
      {hasEqualizer && <EqualizerComponent />}
      {hasDownloads && <DownloadButton />}
    </div>
  );
}
```

### 3. Validación de Límites

```typescript
// Verificar límites de playlists
const { config } = useConfiguracionGlobal();

const canCreatePlaylist = (userPlaylists, userIsPremium) => {
  const limit = userIsPremium ? config.max_playlists_premium : config.max_playlists_free;
  return limit === -1 || userPlaylists.length < limit;
};
```

### 4. Configuración de Uploads

```typescript
// Validar archivos antes de subir
const { config } = useConfiguracionGlobal();

const validateFile = (file) => {
  const extension = file.name.split('.').pop().toLowerCase();
  const sizeInMB = file.size / (1024 * 1024);
  
  return {
    validFormat: config.allowed_formats.includes(extension),
    validSize: sizeInMB <= config.max_file_size,
    maxSize: config.max_file_size
  };
};
```

## Páginas de Administración

### 1. Configuración Global (`/admin/configuracion-global`)
- **General**: Archivos, sistema, plataforma
- **Precios**: Suscripciones, comisiones, verificación de artistas
- **Usuarios**: Límites para gratuitos y premium
- **Contenido**: Moderación y funcionalidades
- **Seguridad**: Autenticación y API
- **Características**: Control granular de features

### 2. Gestión de Usuarios (`/admin/usuarios`)
- Visualización y edición de usuarios
- Aplicación de límites según configuración
- Gestión de roles y permisos

### 3. Biblioteca de Contenido (`/admin/biblioteca`)
- Moderación de música
- Aplicación de políticas de contenido
- Control de aprobaciones

## Impacto en la Plataforma

### ✅ Cambios Inmediatos
- Límites de playlists y seguidores
- Habilitación/deshabilitación de características
- Precios mostrados a nuevos usuarios
- Políticas de contenido

### ⏰ Cambios en Próxima Sesión
- Configuración de seguridad
- Tiempo de sesión
- Verificación de email

### 🔄 Cambios Graduales
- Configuración de API
- Límites de uploads
- Moderación de contenido

## Seguridad y Permisos

### Acceso de Administrador
- Solo usuarios con rol `admin` pueden acceder a `/admin/*`
- Todas las modificaciones se registran con timestamp
- Funciones SQL con verificaciones de permisos

### Triggers de Auditoría
```sql
-- Registro automático de cambios
CREATE TRIGGER config_audit_trigger 
AFTER UPDATE ON configuracion_sistema
FOR EACH ROW EXECUTE FUNCTION log_config_changes();
```

### Validaciones
- Precios no pueden ser negativos
- Límites deben ser números válidos
- Formatos de archivo verificados
- Email de soporte debe ser válido

## Casos de Uso Avanzados

### 1. Modo Mantenimiento
```typescript
// Componente global de mantenimiento
const { config } = useConfiguracionGlobal();

if (config.maintenance_mode) {
  return <MaintenancePage message={config.maintenance_message} />;
}
```

### 2. A/B Testing de Precios
```typescript
// Experimento con precios dinámicos
const { updateConfig, config } = useConfiguracionGlobal();

const runPriceExperiment = async (variant) => {
  const newPrice = variant === 'A' ? 9.99 : 11.99;
  await updateConfig({ premium_price_monthly: newPrice });
};
```

### 3. Características por Región
```typescript
// Habilitar características según ubicación
const { updateFeature } = useConfiguracionGlobal();

const enableRegionalFeature = async (feature, region) => {
  const configData = { enabled_regions: [region] };
  await updateFeature(feature, { config_data: configData });
};
```

## Métricas y Monitoreo

### Dashboard de Configuración
- Últimos cambios realizados
- Impacto en usuarios activos
- Métricas de adopción de características premium
- Alertas de configuración crítica

### Notificaciones Automáticas
- Email cuando se activa modo mantenimiento
- Slack cuando cambian precios
- Log de auditoría para cambios de seguridad

## Deployment y Migración

### Scripts de Migración
```sql
-- Migración segura de configuración
BEGIN;
INSERT INTO configuracion_sistema (id, ...) VALUES (1, ...)
ON CONFLICT (id) DO UPDATE SET ...;
COMMIT;
```

### Backup de Configuración
```bash
# Exportar configuración actual
pg_dump --table=configuracion_sistema soundly_db > config_backup.sql
pg_dump --table=configuraciones_features soundly_db >> config_backup.sql
```

## Conclusión

El sistema de configuración global de Soundly proporciona:

1. **Centralización**: Un solo lugar para toda la configuración
2. **Flexibilidad**: Características habilitables/deshabilitables
3. **Escalabilidad**: Fácil adición de nuevos parámetros
4. **Seguridad**: Control granular y auditoría completa
5. **Experiencia de Usuario**: Funcionalidades adaptadas según suscripción

Este sistema permite que Soundly evolucione dinámicamente sin necesidad de despliegues de código para cambios de configuración, mejorando la agilidad operativa y la experiencia del usuario.
