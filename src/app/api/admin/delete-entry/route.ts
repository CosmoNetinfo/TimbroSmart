import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthSession } from '@/lib/firebase/auth-helper';
import fs from 'fs/promises';
import path from 'path';

export async function DELETE(request: Request) {
    try {
        const session = await getAuthSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

        const entry = entrySnap.data();
        if (!entry) {
            return NextResponse.json({ error: 'Dati entry mancanti' }, { status: 500 });
        }

        if (entry.photoUrl && typeof entry.photoUrl === 'string' && entry.photoUrl.startsWith('/uploads/')) {
            try {
                const filePath = path.join(process.cwd(), 'public', entry.photoUrl);
                await fs.unlink(filePath);
            } catch (err) {
                console.error('Errore cancellazione file immagine (potrebbe non esistere):', err);
            }
        }

        await entryRef.delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json({ error: 'Errore durante la cancellazione' }, { status: 500 });
    }
}
