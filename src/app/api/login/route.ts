import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { code } = await request.json();

        if (!code) {
            return NextResponse.json({ error: 'Codice richiesto' }, { status: 400 });
        }

        // 1. Find user in Firestore by Code
        const usersRef = adminDb.collection('users');
        const querySnapshot = await usersRef.where('code', '==', code).get();

        if (querySnapshot.empty) {
            return NextResponse.json({ error: 'Codice non valido' }, { status: 401 });
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const userId = userDoc.id;
        const companyId = userData.companyId || 'TEST_COMPANY';
        const role = userData.role || 'USER';

        // 2. Map to Firebase Auth User (using a virtual email)
        const virtualEmail = `${userData.code}@timbrosmart.local`;
        let authUser;

        try {
            authUser = await adminAuth.getUserByEmail(virtualEmail);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                authUser = await adminAuth.createUser({
                    email: virtualEmail,
                    displayName: userData.name,
                });
            } else {
                throw error;
            }
        }

        // 3. Set Custom Claims for Multi-Tenancy and Security
        await adminAuth.setCustomUserClaims(authUser.uid, { companyId, role });

        // 4. Create Session Cookie (expires in 5 days)
        const expiresIn = 60 * 60 * 24 * 5 * 1000;
        
        // Note: For real production, you'd verify a client-side ID Token here.
        // For our "Simple PIN" logic, we generate it directly because the server verified the DB code.
        const customToken = await adminAuth.createCustomToken(authUser.uid);
        
        // IMPORTANT: We need an ID token, but since we are server-side, 
        // normally we'd get this from the client. As a workaround for this PIN flow,
        // we'll use a placeholder cookie that the middleware can trust if it matches the DB.
        const sessionToken = Buffer.from(`${authUser.uid}:${Date.now()}`).toString('base64');
        
        const response = NextResponse.json({ 
            id: userId, 
            ...userData,
            success: true 
        });

        (await cookies()).set('session', sessionToken, {
            maxAge: expiresIn,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Login fallito' }, { status: 500 });
    }
}
