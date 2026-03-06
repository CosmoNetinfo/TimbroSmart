import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthSession } from '@/lib/firebase/auth-helper';

export async function POST(request: Request) {
    try {
        const session = await getAuthSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
        }

        const { userId, newCode } = await request.json();
        const companyId = session.companyId;

        if (!userId || !newCode) {
            return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
        }

        // We assume the admin is updating their own code or a user's code in their company
        const userRef = adminDb.collection('users').doc(userId);
        const userSnap = await userRef.get();

        if (!userSnap.exists || userSnap.data()?.companyId !== companyId) {
            return NextResponse.json({ error: 'Utente non trovato o fuori scope' }, { status: 403 });
        }


        // Aggiorna il codice
        await userRef.update({ code: newCode });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update password error:', error);
        return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
    }
}
