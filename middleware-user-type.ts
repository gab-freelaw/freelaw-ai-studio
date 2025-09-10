import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { createClient } from '@/lib/supabase/server';

export async function userTypeMiddleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = await createClient();
  
  try {
    // Verificar autenticação
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      // Usuário não autenticado - permitir acesso apenas a rotas públicas
      const publicPaths = ['/', '/login', '/signup', '/cadastro'];
      const isPublicPath = publicPaths.some(path => 
        request.nextUrl.pathname === path || 
        request.nextUrl.pathname.startsWith('/cadastro/')
      );
      
      if (!isPublicPath) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      return response;
    }

    // Buscar tipo de usuário
    const userType = await getUserType(user.id);
    const path = request.nextUrl.pathname;

    // Proteger rotas do escritório
    if (path.startsWith('/escritorio')) {
      if (userType !== 'contractor') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    // Proteger rotas do prestador
    if (path.startsWith('/prestador')) {
      if (userType !== 'provider') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    // Proteger rotas admin
    if (path.startsWith('/admin')) {
      if (userType !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    // Redirecionar dashboard genérico para específico
    if (path === '/dashboard') {
      switch (userType) {
        case 'contractor':
          return NextResponse.redirect(new URL('/escritorio/dashboard', request.url));
        case 'provider':
          return NextResponse.redirect(new URL('/prestador/dashboard', request.url));
        case 'admin':
          return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        default:
          return NextResponse.redirect(new URL('/', request.url));
      }
    }

    // Adicionar tipo de usuário aos headers para uso nos componentes
    response.headers.set('x-user-type', userType || 'guest');
    
    return response;

  } catch (error) {
    console.error('Middleware error:', error);
    return response;
  }
}

async function getUserType(userId: string): Promise<string | null> {
  try {
    const supabase = await createClient();
    
    // Buscar na tabela user_profiles (será criada)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('user_id', userId)
      .single();

    return profile?.user_type || null;
    
  } catch (error) {
    console.error('Error getting user type:', error);
    
    // Fallback: detectar baseado em dados existentes
    try {
      const supabase = await createClient();
      
      // Verificar se é prestador
      const { data: provider } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (provider) return 'provider';

      // Verificar se é contratante (office)
      const { data: office } = await supabase
        .from('organizations')
        .select('id')
        .eq('created_by', userId)
        .single();

      if (office) return 'contractor';

      // Default: contractor (escritório)
      return 'contractor';
      
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
      return 'contractor';
    }
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
