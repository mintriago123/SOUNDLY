# Dockerfile para desarrollo
FROM node:20-alpine

# Instalar dependencias necesarias
RUN apk add --no-cache libc6-compat

# Configurar el directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies)
RUN npm ci

# Copiar el código fuente
COPY . .

# Exponer el puerto 6060
EXPOSE 6060

# Variables de entorno para desarrollo
ENV NODE_ENV=development
ENV PORT=6060
ENV HOSTNAME="0.0.0.0"

# Comando para ejecutar en modo desarrollo
CMD ["npm", "run", "dev"]
