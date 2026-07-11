import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  const isAuthRoute = request.nextUrl.pathname.startsWith('/admin') || 
                      request.nextUrl.pathname.startsWith('/super-admin');

  if (isAuthRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    // Preservar a rota que estava tentando acessar, caso queira redirecionar de volta
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/super-admin/:path*'],
};
