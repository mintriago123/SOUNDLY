# 🎵 Soundly

Una aplicación web moderna construida con Next.js para gestión y reproducción de contenido de audio.

## ✨ Características

- **Interfaz moderna** - Construida con React 19 y Tailwind CSS
- **Backend robusto** - Integración completa con Supabase
- **TypeScript** - Tipado estático para mejor experiencia de desarrollo
- **Optimización avanzada** - Utiliza Turbopack para desarrollo rápido
- **Responsive** - Diseño adaptativo para todos los dispositivos

## 🛠️ Tecnologías

- **Frontend**: Next.js 15.4.4, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Base de datos**: Supabase
- **Desarrollo**: Turbopack, ESLint

## 🚀 Instalación y Uso

### Prerequisitos

- Node.js 18+ 
- npm, yarn, pnpm o bun

### Configuración

1. **Clona el repositorio**
   ```bash
   git clone <repository-url>
   cd soundly
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   # o
   yarn install
   # o
   pnpm install
   ```

3. **Configura las variables de entorno**
   
   Crea un archivo `.env.local` en la raíz del proyecto:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
   ```

4. **Ejecuta el servidor de desarrollo**
   ```bash
   npm run dev
   # o
   yarn dev
   # o
   pnpm dev
   # o
   bun dev
   ```

5. **Abre tu navegador**
   
   Visita [http://localhost:3000](http://localhost:3000) para ver la aplicación.

## 📂 Estructura del Proyecto

```
soundly/
├── src/
│   ├── app/           # App Router de Next.js
│   ├── components/    # Componentes reutilizables
│   ├── lib/          # Utilidades y configuraciones
│   └── styles/       # Estilos globales
├── public/           # Archivos estáticos
└── ...
```

## 🧪 Scripts Disponibles

- `npm run dev` - Ejecuta la aplicación en modo desarrollo con Turbopack
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta ESLint para revisar el código

## 🚀 Despliegue

### Vercel (Recomendado)

La forma más fácil de desplegar tu aplicación Next.js es usar la [Plataforma Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Consulta la [documentación de despliegue de Next.js](https://nextjs.org/docs/app/building-your-application/deploying) para más detalles.

### Otras plataformas

- **Netlify**: Conecta tu repositorio y despliega automáticamente
- **Railway**: Despliegue simple con base de datos incluida
- **DigitalOcean**: Para despliegues más personalizados

## 🤝 Contribución

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commitea tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ve el archivo [LICENSE](LICENSE) para más detalles.

## 📚 Recursos Adicionales

- [Documentación de Next.js](https://nextjs.org/docs) - Aprende sobre las características y API de Next.js
- [Tutorial de Next.js](https://nextjs.org/learn) - Tutorial interactivo de Next.js
- [Documentación de Supabase](https://supabase.com/docs) - Guía completa de Supabase
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs) - Referencia de clases de utilidad
