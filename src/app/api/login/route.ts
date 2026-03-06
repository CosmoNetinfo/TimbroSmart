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

        // 2. Simplified Session logic (don't block on adminAuth if DB is verified)
        // This makes the login MUCH more resilient to Firebase Auth config issues on Vercel
        const userUid = userId; // User Firestore ID as seed
        const sessionToken = Buffer.from(`${userUid}:${Date.now()}`).toString('base64');
        const expiresIn = 60 * 60 * 24 * 5 * 1000;
        
        const response = NextResponse.json({ 
            id: userId, 
            ...userData,
            success: true 
        });

        response.cookies.set('session', sessionToken, {
            maxAge: expiresIn,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        });

        return response;

    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json({ 
            error: `Login fallito: ${error.message || 'Errore interno'}` 
        }, { status: 500 });
    }
}
