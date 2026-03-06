import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthSession } from '@/lib/firebase/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getAuthSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const companyId = session.companyId;

        if (!id) {
            return NextResponse.json({ error: 'ID mancante' }, { status: 400 });
        }

        const entryRef = adminDb.collection('entries').doc(id);
        const entrySnap = await entryRef.get();

        if (!entrySnap.exists || entrySnap.data()?.companyId !== companyId) {
            return NextResponse.json({ error: 'Entry non trovata o fuori scope' }, { status: 404 });
        }

        const photoUrl = entrySnap.data()?.photoUrl;
        if (!photoUrl) {
            return NextResponse.json({ error: 'Foto non trovata' }, { status: 404 });
        }

        return NextResponse.json({ photoUrl });
    } catch (error) {
        console.error('get-photo error:', error);
        return NextResponse.json({ error: 'Errore server' }, { status: 500 });
    }
}
