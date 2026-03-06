import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthSession } from '@/lib/firebase/auth-helper';

export async function POST(request: Request) {
    try {
        const session = await getAuthSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id, timestamp } = await request.json();
        const companyId = session.companyId;

        if (!id || !timestamp) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const entryRef = adminDb.collection('entries').doc(id);
        const entrySnap = await entryRef.get();

        if (!entrySnap.exists || entrySnap.data()?.companyId !== companyId) {
            return NextResponse.json({ error: 'Entry not found or out of scope' }, { status: 404 });
        }

        
        await entryRef.update({
            timestamp: new Date(timestamp).toISOString()
        });

        const updatedSnap = await entryRef.get();
        const updatedEntry = { id: updatedSnap.id, ...updatedSnap.data() };

        return NextResponse.json(updatedEntry);
    } catch (error) {
        console.error('Error updating entry:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
