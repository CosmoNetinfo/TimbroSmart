import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(req: Request) {
    try {
        const { companyName, email, plan } = await req.json();

        if (!companyName || !email) {
            return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 });
        }

        await adminDb.collection('order_requests').add({
            companyName,
            email,
            plan: plan || 'PRO',
            status: 'PENDING',
            createdAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Order request error:', error);
        return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
    }
}
