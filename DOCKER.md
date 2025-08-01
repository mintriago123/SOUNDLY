# Docker Setup para Soundly

Este documento explica cómo configurar y ejecutar la aplicación Soundly usando Docker para desarrollo y producción.

## Prerrequisitos

- Docker instalado en tu sistema
- Docker Compose instalado
- Un proyecto de Supabase configurado

## Configuración de Variables de Entorno

1. Copia el archivo de ejemplo de variables de entorno:
```bash
cp .env.example .env
```

2. Edita el archivo `.env` con tus credenciales de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-de-supabase
NODE_ENV=development
PORT=6060
```

## Desarrollo

### Usando Docker Compose para Desarrollo (Recomendado)

Para desarrollo con hot reload y `npm run dev`:

```bash
# Ejecutar en modo desarrollo
docker-compose -f docker-compose.dev.yml up --build

# Ejecutar en segundo plano
docker-compose -f docker-compose.dev.yml up -d --build

# Detener
docker-compose -f docker-compose.dev.yml down
```

### Usando Docker directamente para Desarrollo

```bash
# Construir imagen de desarrollo
docker build -f Dockerfile.dev -t soundly-dev .

# Ejecutar con volúmenes para hot reload
docker run -p 6060:6060 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima \
  -v $(pwd):/app \
  -v /app/node_modules \
  -v /app/.next \
  --name soundly-dev-container \
  soundly-dev
```

## Producción

### Usando Docker Compose para Producción

```bash
# Ejecutar en modo producción
docker-compose up --build

# Ejecutar en segundo plano
docker-compose up -d --build

# Detener
docker-compose down
```

### Usando Docker directamente para Producción

1. Construir la imagen:
```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima \
  -t soundly-app .
```

2. Ejecutar el contenedor:
```bash
docker run -p 6060:6060 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima \
  --name soundly-container \
  soundly-app
```

## Acceso a la Aplicación

Una vez que el contenedor esté ejecutándose, puedes acceder a la aplicación en:
- http://localhost:6060

## Logs y Debugging

Para ver los logs del contenedor:
```bash
docker-compose logs -f soundly-app
```

O con Docker directamente:
```bash
docker logs -f soundly-container
```

## Desarrollo

Para desarrollo local, es recomendable usar el comando normal de Next.js:
```bash
npm run dev
```

El contenedor Docker está optimizado para producción.

## Notas Importantes

- El puerto 6060 está configurado tanto en desarrollo como en producción
- Las variables de entorno de Supabase son necesarias para el funcionamiento correcto
- La aplicación usa el modo `standalone` de Next.js para optimización en contenedores
- El contenedor corre con un usuario no-root para mayor seguridad

## Solución de Problemas

1. **Error de conexión a Supabase**: Verifica que las variables de entorno estén correctamente configuradas
2. **Puerto ocupado**: Asegúrate de que el puerto 6060 no esté siendo usado por otra aplicación
3. **Problemas de build**: Ejecuta `docker-compose down -v` y luego `docker-compose up --build` para limpiar volúmenes
