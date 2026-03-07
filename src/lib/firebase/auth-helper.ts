import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export async function getAuthSession() {
    const sessionCookie = (await cookies()).get('session')?.value;

    if (!sessionCookie) {
        return null;
    }

    try {
        // Token format: Base64(uid:timestamp:role)
        const [uid, timestamp, role] = Buffer.from(sessionCookie, 'base64').toString().split(':');
        
        if (!uid || !timestamp) return null;

        // Verify if the user still exists in Firestore (resilient check)
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (!userDoc.exists) return null;

        return {
            uid,
            role: role || userDoc.data()?.role || 'USER',
            companyId: userDoc.data()?.companyId || null,
            email: userDoc.data()?.email || `${userDoc.data()?.code}@timbrosmart.local`
        };
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
