# Sistema de Actualización de Roles de Usuario - Premium

## Descripción del Problema

El problema era que los usuarios no tenían su rol actualizado correctamente de "usuario" a "premium" después de realizar un pago exitoso en Stripe. Esto impedía que accedieran a las características premium.

## Solución Implementada

### 1. Corrección del Webhook de Stripe (`/src/app/api/stripe/webhook/route.ts`)

Se corrigieron los siguientes casos en el webhook para asegurar la actualización correcta del rol:

#### `checkout.session.completed`
- ✅ Ya estaba funcionando correctamente
- Actualiza el rol a 'premium' cuando el pago inicial es exitoso

#### `invoice.payment_succeeded` (CORREGIDO)
- **Antes**: Solo actualizaba `subscription_status`, no el rol
- **Ahora**: Actualiza el rol a 'premium' y todos los campos relacionados
- Determina el tipo de plan (`premium_monthly` o `premium_yearly`)

#### `invoice.payment_failed` (CORREGIDO)
- **Antes**: Solo actualizaba `subscription_status` a 'past_due'
- **Ahora**: Cambia el rol a 'usuario' cuando el pago falla

#### `customer.subscription.updated`
- ✅ Ya funcionaba correctamente
- Actualiza el rol basado en el estado de la suscripción

#### `customer.subscription.deleted`
- ✅ Ya funcionaba correctamente
- Cambia el rol a 'usuario' cuando se cancela la suscripción

### 2. Tabla `subscriptions` (`/database/subscriptions_table.sql`)

Se creó la tabla `subscriptions` que faltaba en el schema, la cual es esencial para:
- Almacenar información de suscripciones de Stripe
- Relacionar usuarios con sus suscripciones
- Permitir consultas sobre el estado de suscripción

**Campos importantes**:
- `user_id`: ID del usuario
- `stripe_subscription_id`: ID de la suscripción en Stripe
- `status`: Estado de la suscripción (active, canceled, past_due, etc.)
- `plan_type`: Tipo de plan (free, premium_monthly, premium_yearly)

### 3. Campos Adicionales en la Tabla `usuarios`

Se agregaron campos adicionales a la tabla usuarios:
- `subscription_status`: Estado actual de la suscripción
- `subscription_tier`: Tipo de suscripción
- `stripe_customer_id`: ID del cliente en Stripe

### 4. API de Verificación de Sesión Mejorada (`/src/app/api/stripe/session/[sessionId]/route.ts`)

Se mejoró la API que verifica las sesiones de pago para:
- Verificar que el usuario tenga el rol correcto después del pago
- Forzar la actualización del rol si es necesario
- Proporcionar información detallada sobre el pago

### 5. API de Sincronización de Roles (`/src/app/api/user/sync-role/route.ts`)

Se creó una nueva API que permite:
- Verificar si el rol del usuario coincide con su suscripción
- Actualizar automáticamente roles incorrectos
- Manejar casos donde el usuario tiene suscripción activa pero rol incorrecto
- Manejar casos donde el usuario no tiene suscripción pero tiene rol premium

### 6. Componente de Gestión de Suscripciones Mejorado (`/src/components/SubscriptionManager.tsx`)

Se agregó funcionalidad para:
- Botón de "Sincronizar rol" para forzar verificación manual
- Indicador de carga durante la sincronización
- Recarga automática de la página cuando se actualiza el rol

## Flujo de Actualización de Roles

### Flujo Normal (Automático)

1. **Usuario realiza pago** → Stripe procesa el pago
2. **Stripe envía webhook** → `checkout.session.completed`
3. **Webhook actualiza usuario** → Rol cambia a 'premium'
4. **Usuario accede a características premium**

### Flujo de Renovación (Automático)

1. **Stripe procesa renovación** → `invoice.payment_succeeded`
2. **Webhook actualiza usuario** → Confirma rol 'premium'
3. **Suscripción se mantiene activa**

### Flujo de Fallo de Pago (Automático)

1. **Stripe falla en cobro** → `invoice.payment_failed`
2. **Webhook actualiza usuario** → Rol cambia a 'usuario'
3. **Usuario pierde acceso premium**

### Flujo de Sincronización Manual

1. **Usuario hace clic en "Sincronizar rol"**
2. **API verifica estado de suscripción**
3. **Si hay discrepancia** → Actualiza rol automáticamente
4. **Página se recarga** → Usuario ve cambios inmediatamente

## Variables de Entorno Necesarias

Asegúrate de tener configuradas estas variables:

```env
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MENSUAL=price_...
STRIPE_PRICE_ID_ANUAL=price_...
```

## Testing

### Para probar el sistema:

1. **Crear un pago de prueba** usando las claves de test de Stripe
2. **Verificar webhook** en el dashboard de Stripe
3. **Comprobar base de datos** que el rol se actualice
4. **Probar sincronización manual** usando el botón en el dashboard

### Casos de prueba importantes:

- ✅ Pago exitoso inicial
- ✅ Renovación automática exitosa
- ✅ Fallo en renovación
- ✅ Cancelación de suscripción
- ✅ Sincronización manual

## Monitoreo

Para monitorear el sistema:

1. **Logs de webhook** en Stripe Dashboard
2. **Logs de aplicación** para errores de actualización
3. **Base de datos** para verificar consistencia entre `usuarios` y `subscriptions`

## Resolución de Problemas Comunes

### Usuario pagó pero sigue sin acceso premium

1. Verificar que el webhook se ejecutó correctamente
2. Comprobar logs de Stripe
3. Usar el botón "Sincronizar rol" en el dashboard
4. Verificar manualmente en la base de datos

### Webhook no se ejecuta

1. Verificar URL del webhook en Stripe
2. Comprobar que `STRIPE_WEBHOOK_SECRET` esté configurado
3. Verificar que el endpoint esté accesible públicamente

### Rol no se actualiza después del webhook

1. Verificar logs de la aplicación
2. Comprobar que la tabla `subscriptions` existe
3. Verificar que los campos adicionales en `usuarios` existan
4. Usar la API de sincronización manual

## Estructura de Archivos Modificados

```
src/
├── app/
│   ├── api/
│   │   ├── stripe/
│   │   │   ├── webhook/route.ts (MODIFICADO)
│   │   │   └── session/[sessionId]/route.ts (MODIFICADO)
│   │   └── user/
│   │       └── sync-role/route.ts (NUEVO)
│   └── checkout/
│       └── success/page.tsx (SIN CAMBIOS - ya funcionaba)
├── components/
│   └── SubscriptionManager.tsx (MODIFICADO)
└── database/
    └── subscriptions_table.sql (NUEVO)
```

Este sistema ahora garantiza que los usuarios tengan el rol correcto según su estado de suscripción en Stripe.
