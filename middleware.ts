import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Redirecionar dashboard genérico para escritório (padrão)
  if (path === '/dashboard') {
    return NextResponse.redirect(new URL('/escritorio/dashboard', request.url));
  }
  
  // Redirecionar rotas antigas para novas
  if (path === '/prestador' && !path.startsWith('/prestador/')) {
    return NextResponse.redirect(new URL('/prestador/dashboard', request.url));
  }
  
  if (path === '/contratante' && !path.startsWith('/escritorio/')) {
    return NextResponse.redirect(new URL('/escritorio/dashboard', request.url));
  }
  
  // Redirecionar carteira para prestador
  if (path === '/carteira') {
    return NextResponse.redirect(new URL('/prestador/carteira', request.url));
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};