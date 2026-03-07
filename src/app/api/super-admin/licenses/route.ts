import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// FUNZIONE DI SICUREZZA TEMPORANEA
// In un ambiente reale, useremmo un ruolo SUPER_ADMIN in Firebase Auth.
// Qui usiamo un controllo basato su una Master Key definita nel server.
const MASTER_SECRET = process.env.SUPER_ADMIN_PASSWORD || 'TSMT_ADMIN_2026';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        if (secret !== MASTER_SECRET) {
            return NextResponse.json({ error: 'Accesso negato' }, { status: 403 });
        }

        const snapshot = await adminDb.collection('master_keys').orderBy('createdAt', 'desc').get();
        const keys = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json(keys);
    } catch (error) {
        console.error('Super Admin GET error:', error);
        return NextResponse.json({ error: 'Errore nel recupero licenze' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { secret, serialKey, plan, isActive } = await request.json();

        if (secret !== MASTER_SECRET) {
            return NextResponse.json({ error: 'Accesso negato' }, { status: 403 });
        }

        if (!serialKey || !plan) {
            return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
        }

        await adminDb.collection('master_keys').doc(serialKey).set({
            plan,
            isActive,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString() // Fallback se nuova
        }, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Super Admin POST error:', error);
        return NextResponse.json({ error: 'Errore nel salvataggio licenza' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');
        const serialKey = searchParams.get('serialKey');

        if (secret !== MASTER_SECRET) {
            return NextResponse.json({ error: 'Accesso negato' }, { status: 403 });
        }

        if (!serialKey) {
            return NextResponse.json({ error: 'SerialKey mancante' }, { status: 400 });
        }

        await adminDb.collection('master_keys').doc(serialKey).delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Super Admin DELETE error:', error);
        return NextResponse.json({ error: 'Errore nell\'eliminazione' }, { status: 500 });
    }
}
