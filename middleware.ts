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

  // IMPORTANTE: Actualizar la sesión en cada request
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rutas protegidas que requieren autenticación
  const protectedRoutes = ['/dashboard']
  
  // Rutas de autenticación
  const authRoutes = ['/auth/login', '/auth/register']
  
  // Rutas que requieren rol de admin
  const adminRoutes = ['/admin']

  // Rutas que requieren rol de artista
  const artistRoutes = ['/artista']

  // Rutas que requieren rol de premium
  const premiumRoutes = ['/premium']

  // Rutas que requieren rol de usuario
  const userRoutes = ['/usuario']

  // Si el usuario está intentando acceder a una ruta protegida sin estar autenticado
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !user) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Si el usuario está autenticado y trata de acceder a rutas de auth, redirigir según su rol
  if (authRoutes.includes(pathname) && user) {
    try {
      // Obtener el rol del usuario
      const { data: userData, error } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', user.id)
        .single()

      if (error || !userData) {
        return NextResponse.redirect(new URL('/usuario/dashboard', request.url))
      }

      // Redirigir según el rol
      switch (userData.rol) {
        case 'admin':
          return NextResponse.redirect(new URL('/admin/dashboard', request.url))
        case 'artista':
          return NextResponse.redirect(new URL('/artista/dashboard', request.url))
        case 'premium':
          return NextResponse.redirect(new URL('/premium/dashboard', request.url))
        default:
          return NextResponse.redirect(new URL('/usuario/dashboard', request.url))
      }
    } catch (error) {
      console.error('❌ Error obteniendo rol del usuario:', error)
      return NextResponse.redirect(new URL('/usuario/dashboard', request.url))
    }
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
        // Si no es admin, redirigir al dashboard según su rol
        switch (userData?.rol) {
          case 'artista':
            return NextResponse.redirect(new URL('/artista/dashboard', request.url))
          case 'premium':
            return NextResponse.redirect(new URL('/premium/dashboard', request.url))
          default:
            return NextResponse.redirect(new URL('/usuario/dashboard', request.url))
        }
      }
    } catch (error) {
      console.error('❌ Error verificando rol de admin:', error)
      return NextResponse.redirect(new URL('/usuario/dashboard', request.url))
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
        // Si no es artista, redirigir al dashboard según su rol
        switch (userData?.rol) {
          case 'admin':
            return NextResponse.redirect(new URL('/admin/dashboard', request.url))
          case 'premium':
            return NextResponse.redirect(new URL('/premium/dashboard', request.url))
          default:
            return NextResponse.redirect(new URL('/usuario/dashboard', request.url))
        }
      }
    } catch (error) {
      console.error('❌ Error verificando rol de artista:', error)
      return NextResponse.redirect(new URL('/usuario/dashboard', request.url))
    }
  }

  // Verificar rutas de premium
  if (premiumRoutes.some(route => pathname.startsWith(route)) && user) {
    try {
      // Obtener datos del usuario desde la tabla usuarios para verificar el rol
      const { data: userData, error } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', user.id)
        .single()

      if (error || !userData || userData.rol !== 'premium') {
        // Si no es premium, redirigir al dashboard según su rol
        switch (userData?.rol) {
          case 'admin':
            return NextResponse.redirect(new URL('/admin/dashboard', request.url))
          case 'artista':
            return NextResponse.redirect(new URL('/artista/dashboard', request.url))
          default:
            return NextResponse.redirect(new URL('/usuario/dashboard', request.url))
        }
      }
    } catch (error) {
      console.error('❌ Error verificando rol de premium:', error)
      return NextResponse.redirect(new URL('/usuario/dashboard', request.url))
    }
  }

  // Verificar rutas de usuario
  if (userRoutes.some(route => pathname.startsWith(route)) && user) {
    try {
      // Obtener datos del usuario desde la tabla usuarios para verificar el rol
      const { data: userData, error } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', user.id)
        .single()

      if (error || !userData || userData.rol !== 'usuario') {
        // Si no es usuario regular, redirigir al dashboard según su rol
        switch (userData?.rol) {
          case 'admin':
            return NextResponse.redirect(new URL('/admin/dashboard', request.url))
          case 'artista':
            return NextResponse.redirect(new URL('/artista/dashboard', request.url))
          case 'premium':
            return NextResponse.redirect(new URL('/premium/dashboard', request.url))
          default:
            return NextResponse.redirect(new URL('/usuario/dashboard', request.url))
        }
      }
    } catch (error) {
      console.error('❌ Error verificando rol de usuario:', error)
      return NextResponse.redirect(new URL('/usuario/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/',
    '/auth/:path*',
    '/dashboard/:path*',
    '/admin/:path*',
    '/artista/:path*',
    '/premium/:path*',
    '/usuario/:path*',
  ],
}