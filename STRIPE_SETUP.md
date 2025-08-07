# Configuración de Stripe para SOUNDLY

## Resumen de la Implementación

Se ha implementado un sistema completo de suscripciones premium con Stripe que incluye:

### ✅ Funcionalidades Implementadas

1. **Pasarela de Pago con Stripe**
   - Checkout Session para suscripciones
   - Manejo de webhooks para eventos de Stripe
   - Integración completa con Stripe Elements

2. **Base de Datos**
   - Tabla `usuarios` con campos para Stripe
   - Tabla `subscriptions` para gestión de suscripciones
   - Triggers automáticos para sincronización

3. **APIs Creadas**
   - `/api/stripe/create-checkout-session` - Crear sesión de pago
   - `/api/stripe/webhook` - Manejar eventos de Stripe
   - `/api/stripe/prices` - Obtener precios desde Stripe
   - `/api/stripe/manage-subscription` - Gestionar suscripciones
   - `/api/stripe/session/[sessionId]` - Verificar sesiones de pago

4. **Componentes React**
   - `PricingDisplay` - Muestra precios y planes con integración Stripe
   - `SubscriptionManager` - Gestiona suscripciones activas
   - Hook `useStripeSubscription` - Manejo de estado de suscripciones

5. **Páginas**
   - `/usuario/upgrade` - Página de planes y upgrade
   - `/checkout/success` - Página de confirmación de pago
   - Integración en `/usuario/configuracion` para gestión

## 🔧 Configuración Requerida

### 1. Variables de Entorno

Actualiza tu archivo `.env.local` con las claves de Stripe:

```bash
# Stripe - Claves de API
STRIPE_SECRET_KEY=sk_test_51RtHKF3JCWqHHdO4pVA5TMcWFEoabhwJYq4EC9Fntk4wHSkUbiXN25k2bj7mD74BsNdtXWXBNKmQ5yJKY8yeUhTY00K0mkoben
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51RtHKF3JCWqHHdO4tkf7allTO43wDgbw8uP11YuYLKHsialJrtpeuoCNwlLWvppJpoxzf6fQhnGoIHMGehnIZRTQ00C0wZX8x9
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe - Price IDs (ya configurados)
STRIPE_PRICE_ID_MENSUAL=price_1RtHPU3JCWqHHdO4N8VFRkQz
STRIPE_PRICE_ID_ANUAL=price_1RtHQ33JCWqHHdO4gxyBvSwl
NEXT_PUBLIC_STRIPE_PRICE_ID_MENSUAL=price_1RtHPU3JCWqHHdO4N8VFRkQz
NEXT_PUBLIC_STRIPE_PRICE_ID_ANUAL=price_1RtHQ33JCWqHHdO4gxyBvSwl

# URL de tu sitio
NEXT_PUBLIC_SITE_URL=http://localhost:6060
```

### 2. Configurar Webhook en Stripe

1. Ve al Dashboard de Stripe > Developers > Webhooks
2. Crear nuevo endpoint con la URL: `https://tu-dominio.com/api/stripe/webhook`
3. Selecciona estos eventos:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copia el webhook secret y úsalo en `STRIPE_WEBHOOK_SECRET`

### 3. Verificar Precios en Stripe

Los Price IDs ya están configurados, pero verifica que existan en tu Dashboard de Stripe:
- Plan Mensual: `price_1RtHPU3JCWqHHdO4N8VFRkQz`
- Plan Anual: `price_1RtHQ33JCWqHHdO4gxyBvSwl`

## 🚀 Cómo Funciona

### Flujo de Suscripción

1. **Usuario selecciona plan** en `/usuario/upgrade`
2. **Se crea Checkout Session** via API
3. **Redirección a Stripe Checkout** 
4. **Usuario completa pago**
5. **Webhook actualiza base de datos**
6. **Redirección a página de éxito**

### Estados de Suscripción

- `active` - Suscripción activa
- `past_due` - Pago vencido
- `canceled` - Cancelada
- `incomplete` - Pago incompleto

### Roles de Usuario

- `usuario` - Plan gratuito
- `premium` - Plan premium activo
- `artista` - Artista verificado
- `admin` - Administrador

## 📱 Uso desde la Interfaz

### Para Usuarios

1. **Upgrade a Premium**:
   - Ir a "Configuración" → "Upgrade"
   - Seleccionar plan mensual o anual
   - Completar pago con Stripe

2. **Gestionar Suscripción**:
   - Ir a "Configuración" → "Suscripción Premium"
   - Cancelar, reactivar o ver detalles

### Características Premium

- Audio de alta calidad (320kbps)
- Descargas offline
- Playlists ilimitadas
- Sin anuncios
- Soporte prioritario

## 🔍 Testing

### Tarjetas de Prueba Stripe

```
Éxito: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Requiere autenticación: 4000 0025 0000 3155
```

### Webhooks Testing

Usa Stripe CLI para testing local:
```bash
stripe listen --forward-to localhost:6060/api/stripe/webhook
```

## 🛠️ Mantenimiento

### Logs y Monitoreo

- Revisar logs de webhooks en Stripe Dashboard
- Monitorear errores en console del servidor
- Verificar sincronización de base de datos

### Gestión de Fallos

- Pagos fallidos se marcan como `past_due`
- Webhooks tienen retry automático
- Logs detallados para debugging

## 📋 Próximos Pasos

1. **Testing en Producción**:
   - Cambiar a claves de producción de Stripe
   - Configurar webhook en dominio real
   - Actualizar URLs en variables de entorno

2. **Funcionalidades Adicionales**:
   - Facturas por email
   - Cupones y descuentos
   - Métricas de suscripciones
   - Panel admin para gestión

3. **Optimizaciones**:
   - Cache de precios de Stripe
   - Retry logic para webhooks
   - Notificaciones push para cambios de suscripción

## ⚠️ Notas Importantes

- ✅ **WEBHOOK_SECRET** es crítico para seguridad
- ✅ **Price IDs** deben coincidir con los de Stripe
- ✅ **URLs** deben ser absolutas para redirects
- ✅ **Base de datos** debe tener las tablas y triggers configurados
- ✅ **Autenticación** debe estar funcionando para usuarios

El sistema está listo para uso en desarrollo. Para producción, actualiza las variables de entorno y configura el webhook en el dominio real.
