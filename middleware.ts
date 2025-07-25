import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  console.log('🚀 Middleware ejecutándose para:', request.nextUrl.pathname)
  
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // IMPORTANTE: Actualizar la sesión en cada request
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  // Debug más detallado
  console.log('🔍 Pathname:', request.nextUrl.pathname)
  console.log('🍪 Cookies disponibles:', request.cookies.getAll().map(c => c.name))
  console.log('👤 Usuario autenticado:', !!user)
  console.log('📧 Email del usuario:', user?.email || 'No autenticado')
  console.log('❌ Error de auth:', error?.message || 'Sin error')

  const { pathname } = request.nextUrl

  // Rutas protegidas que requieren autenticación
  const protectedRoutes = ['/dashboard']
  
  // Rutas de autenticación
  const authRoutes = ['/auth/login', '/auth/register']
  
  // Rutas que requieren rol de admin
  const adminRoutes = ['/dashboard/admin']

  // Rutas que requieren rol de artista
  const artistRoutes = ['/dashboard/artista']

  // Si el usuario está intentando acceder a una ruta protegida sin estar autenticado
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !user) {
    console.log('🚫 Acceso denegado a ruta protegida, redirigiendo a login')
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Si el usuario está autenticado y trata de acceder a rutas de auth, redirigir al dashboard
  if (authRoutes.includes(pathname) && user) {
    console.log('✅ Usuario autenticado intentando acceder a auth, redirigiendo al dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Verificar rutas de admin
  if (adminRoutes.some(route => pathname.startsWith(route)) && user) {
    try {
      // Obtener datos del usuario desde la tabla usuarios para verificar el rol
      const { data: userData, error } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', user.id)
        .single()

      if (error || !userData || userData.rol !== 'admin') {
        // Si no es admin, redirigir al dashboard normal
        console.log('🚫 Usuario no es admin, redirigiendo al dashboard normal')
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch (error) {
      console.error('❌ Error verificando rol de admin:', error)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Verificar rutas de artista
  if (artistRoutes.some(route => pathname.startsWith(route)) && user) {
    try {
      // Obtener datos del usuario desde la tabla usuarios para verificar el rol
      const { data: userData, error } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', user.id)
        .single()

      if (error || !userData || userData.rol !== 'artista') {
        // Si no es artista, redirigir al dashboard normal
        console.log('🚫 Usuario no es artista, redirigiendo al dashboard normal')
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch (error) {
      console.error('❌ Error verificando rol de artista:', error)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  console.log('✨ Middleware completado, permitiendo acceso')
  return response
}

export const config = {
  matcher: [
    '/',
    '/auth/:path*',
    '/dashboard/:path*',
  ],
}