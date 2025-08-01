import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SupabaseProvider from "./components/SupabaseProvider";
import { ThemeProvider } from "./components/ThemeProviderEnhanced";

/**
 * Configuración de fuentes de Google Fonts
 * Estas fuentes se cargan de manera optimizada por Next.js
 */

// Geist: Fuente sans-serif moderna y legible para texto general
const geistSans = Geist({
  variable: "--font-geist-sans", // Variable CSS personalizada para usar en Tailwind
  subsets: ["latin"], // Subconjunto de caracteres latinos (reduce el tamaño de descarga)
});

// Geist Mono: Fuente monoespaciada para código y elementos técnicos
const geistMono = Geist_Mono({
  variable: "--font-geist-mono", // Variable CSS personalizada para usar en Tailwind
  subsets: ["latin"], // Subconjunto de caracteres latinos
});

/**
 * Metadatos de la aplicación para SEO y redes sociales
 * Estos metadatos aparecen en:
 * - Pestañas del navegador
 * - Resultados de búsqueda
 * - Previews en redes sociales
 */
export const metadata: Metadata = {
  title: "SOUNDLY", // Título que aparece en la pestaña del navegador
  description: "Plataforma de música en streaming", // Descripción para SEO y redes sociales
  icons: {
    icon: "/favicon.ico", // Favicon principal que aparece en la pestaña
    shortcut: "/favicon.ico", // Icono de acceso directo
    apple: "/favicon.ico", // Icono para dispositivos Apple (bookmarks, homescreen)
  },
};

/**
 * RootLayout - Componente raíz de la aplicación
 * 
 * Este componente define la estructura HTML base que envuelve toda la aplicación.
 * Se ejecuta en cada página y proporciona:
 * - Configuración del idioma en español (importante para SEO y accesibilidad)
 * - Variables de fuentes tipográficas (Geist Sans y Geist Mono)
 * - Proveedor de Supabase para autenticación y base de datos
 * - Estilos globales y antialias para mejorar la legibilidad de fuentes
 * 
 * Notas técnicas:
 * - Las variables de fuente se inyectan como clases CSS personalizadas
 * - SupabaseProvider envuelve toda la app para proporcionar contexto global
 * - antialiased mejora la renderización de fuentes en pantallas
 * 
 * @param children - Contenido de las páginas hijas que se renderizará dentro del layout
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode; // Contenido de las páginas hijas
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <SupabaseProvider>
            {children}
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
