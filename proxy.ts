import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET_BYTES = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-super-secret-jwt-key-bachatgat-2026"
)

const PUBLIC_PREFIXES = [
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/auth/confirm',
  '/join',
  '/pending',
  '/rejected',
  '/api/organizations',
  '/api/auth',
  '/api/files',
  '/_next',
  '/favicon',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/' || PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) {
    const res = NextResponse.next()
    res.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.headers.set('Pragma', 'no-cache')
    res.headers.set('Expires', '0')
    return res
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  const token = request.cookies.get('bb_token')?.value
  if (!token) {
    if (pathname === '/sign-in') return response
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  let payload: any = null
  try {
    const verified = await jwtVerify(token, JWT_SECRET_BYTES)
    payload = verified.payload
  } catch {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  const role = payload?.role || 'MEMBER'
  const status = payload?.status || 'ACTIVE'

  if (status === 'PENDING') {
    if (pathname === '/pending' || pathname.startsWith('/api/')) return response
    return NextResponse.redirect(new URL('/pending', request.url))
  }
  if (status === 'REJECTED') {
    if (pathname === '/rejected' || pathname.startsWith('/api/')) return response
    return NextResponse.redirect(new URL('/rejected', request.url))
  }

  const isAdminRole = ['SUPERADMIN', 'ADMIN'].includes(role)

  if (isAdminRole && (pathname === '/member' || pathname.startsWith('/member/'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  const ADMIN_PATHS = ['/dashboard', '/meetings', '/members', '/payments', '/expenses']
  if (role === 'MEMBER' && ADMIN_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/member', request.url))
  }

  if (role === 'ADMIN' && pathname.startsWith('/settings')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export async function proxy(request: NextRequest) {
  return middleware(request)
}

export default proxy

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
