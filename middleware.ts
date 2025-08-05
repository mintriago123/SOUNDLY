import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Obtener el rol del usuario desde la base de datos
 */
async function getUserRole(supabase: any, userId: string) {
  try {
    const { data: userData, error } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', userId)
      .single()

    if (error || !userData) {
      return null
    }

    return userData.rol
  } catch (error) {
    console.error('❌ Error obteniendo rol del usuario:', error)
    return null
  }
}

/**
 * Redirigir según el rol del usuario
 */
function redirectByRole(role: string | null, request: NextRequest) {
  const baseUrl = request.url
  
  switch (role) {
    case 'admin':
      return NextResponse.redirect(new URL('/admin/dashboard', baseUrl))
    case 'artista':
      return NextResponse.redirect(new URL('/artista/dashboard', baseUrl))
    case 'premium':
      return NextResponse.redirect(new URL('/premium/dashboard', baseUrl))
    default:
      return NextResponse.redirect(new URL('/usuario/dashboard', baseUrl))
  }
}

/**
 * Verificar acceso a rutas según el rol
 */
async function checkRoleAccess(
  supabase: any, 
  user: any, 
  pathname: string, 
  requiredRole: string,
  request: NextRequest
) {
  const userRole = await getUserRole(supabase, user.id)
  
  if (!userRole || userRole !== requiredRole) {
    return redirectByRole(userRole, request)
  }
  
  return null
}

/**
 * Manejar rutas de autenticación
 */
async function handleAuthRoutes(supabase: any, user: any, request: NextRequest) {
  const userRole = await getUserRole(supabase, user.id)
  return redirectByRole(userRole, request)
}

/**
 * Procesar verificaciones de acceso para todas las rutas protegidas
 */
async function processRoleBasedRoutes(
  supabase: any,
  user: any,
  pathname: string,
  request: NextRequest
) {
  const routeChecks = [
    { routes: ['/admin'], role: 'admin' },
    { routes: ['/artista'], role: 'artista' },
    { routes: ['/premium'], role: 'premium' },
    { routes: ['/usuario'], role: 'usuario' }
  ]

  for (const check of routeChecks) {
    if (check.routes.some(route => pathname.startsWith(route))) {
      const result = await checkRoleAccess(supabase, user, pathname, check.role, request)
      if (result) return result
    }
  }

  return null
}

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
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: Actualizar la sesión en cada request
  const {
    data: { user }
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rutas protegidas que requieren autenticación
  const protectedRoutes = ['/dashboard']
  
  // Rutas de autenticación
  const authRoutes = ['/auth/login', '/auth/register']

  // Si el usuario está intentando acceder a una ruta protegida sin estar autenticado
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !user) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Si el usuario está autenticado y trata de acceder a rutas de auth, redirigir según su rol
  if (authRoutes.includes(pathname) && user) {
    return await handleAuthRoutes(supabase, user, request)
  }

  // Verificar rutas según el rol requerido
  if (user) {
    const roleCheckResult = await processRoleBasedRoutes(supabase, user, pathname, request)
    if (roleCheckResult) return roleCheckResult
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