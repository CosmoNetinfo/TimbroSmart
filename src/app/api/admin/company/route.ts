import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthSession } from '@/lib/firebase/auth-helper';

export async function POST(request: Request) {
    try {
        const session = await getAuthSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { companyName } = await request.json();
        let companyId = session.companyId;

        // Fallback: if admin has no companyId, we generate one based on their UID
        if (!companyId) {
            companyId = `COMP_${session.uid}`;
            // Update the user doc to link this companyId permanently
            await adminDb.collection('users').doc(session.uid).update({ companyId });
        }

        const companyRef = adminDb.collection('companies').doc(companyId);
        await companyRef.set({ 
            name: companyName.trim(),
            updatedAt: new Date().toISOString()
        }, { merge: true });

        return NextResponse.json({ 
            success: true, 
            message: 'Nome azienda aggiornato con successo!' 
        });
    } catch (error) {
        console.error('Update company name error:', error);
        return NextResponse.json({ error: 'Errore durante l\'aggiornamento' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = session.companyId;
        if (!companyId) {
            return NextResponse.json({ name: 'TimbroSmart', plan: 'FREE' });
        }

        const companyDoc = await adminDb.collection('companies').doc(companyId).get();

        if (!companyDoc.exists) {
            return NextResponse.json({ name: 'TimbroSmart', plan: 'FREE' });
        }

        return NextResponse.json(companyDoc.data());
    } catch (error) {
        console.error('Fetch company error:', error);
        return NextResponse.json({ error: 'Errore recupero dati azienda' }, { status: 500 });
    }
}
