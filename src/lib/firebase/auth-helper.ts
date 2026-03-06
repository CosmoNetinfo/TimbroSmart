import { adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export async function getAuthSession() {
    const sessionCookie = (await cookies()).get('session')?.value;

    if (!sessionCookie) {
        return null;
    }

    try {
        // Verify the session cookie. In production, checkRevoked should be true in some cases.
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, false);
        return decodedClaims;
    } catch (error) {
        return null;
    }
}

export async function requireAdmin() {
    const session = await getAuthSession();
    if (!session || session.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }
    return session;
}

export async function requireUser() {
    const session = await getAuthSession();
    if (!session) {
        throw new Error('Unauthorized');
    }
    return session;
}
