import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');

    if (secret !== 'TSMT_2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const snapshot = await adminDb.collection('order_requests')
            .orderBy('createdAt', 'desc')
            .get();
        
        const orders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json(orders);
    } catch (error) {
        console.error('Fetch orders error:', error);
        return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    const orderId = searchParams.get('orderId');

    if (secret !== 'TSMT_2026') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!orderId) return NextResponse.json({ error: 'ID ordine mancante' }, { status: 400 });

    try {
        await adminDb.collection('order_requests').doc(orderId).delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Errore durante l\'eliminazione' }, { status: 500 });
    }
}
