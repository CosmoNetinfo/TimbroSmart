import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
    const session = request.cookies.get('session');
    
    // Define protected routes
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
    const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');

    if (!session && (isAdminRoute || isDashboardRoute)) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Role-based protection would ideally happen here, but requires verifying the session token.
    // For now, we'll let the client-side/API handle deep roles, but middleware handles the existence of session.
    
    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/dashboard/:path*'],
};
