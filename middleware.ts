import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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

  // Verificar si el usuario está autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rutas protegidas que requieren autenticación
  const protectedRoutes = ['/dashboard']
  
  // Rutas de autenticación
  const authRoutes = ['/auth/login', '/auth/register']
  
  // Rutas que requieren rol de admin
  const adminRoutes = ['/dashboard/admin']

  // Si el usuario está intentando acceder a una ruta protegida sin estar autenticado
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !user) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Si el usuario está autenticado y trata de acceder a rutas de auth, redirigir al dashboard
  if (authRoutes.includes(pathname) && user) {
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
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch (error) {
      console.error('Error verificando rol de admin:', error)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Si el usuario está autenticado y accede a la página principal, puede quedarse o ir al dashboard
  // (esto es opcional, puedes descomentarlo si quieres forzar que vayan al dashboard)
  /*
  if (pathname === '/' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  */

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}