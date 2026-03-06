import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthSession } from '@/lib/firebase/auth-helper';

export async function GET(req: NextRequest) {
    try {
        const session = await getAuthSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const companyId = session.companyId;

        if (!userId) {
            return NextResponse.json({ error: 'userId richiesto' }, { status: 400 });
        }

        // Security check: Only allow users to see their own payments OR admins to see any within their company
        if (session.role !== 'ADMIN' && session.uid !== userId) {
             // We need to map session.uid to the internal DB userId if they differ. 
             // In our Virtual Email logic, we can verify the userId in Firestore.
             // For now, if role is USER, we check if the requested userId matches their Firestore doc ID.
             const userDoc = await adminDb.collection('users').doc(userId).get();
             if (!userDoc.exists || userDoc.data()?.code !== session.email?.split('@')[0]) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
             }
        }

        const paymentsRef = adminDb.collection('payments');
        const querySnapshot = await paymentsRef
            .where('companyId', '==', companyId)
            .where('userId', '==', userId)
            .get();

        const payments = querySnapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }))
            .sort((a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());


        return NextResponse.json({ payments });
    } catch (error) {
        console.error('Error fetching payments:', error);
        return NextResponse.json({ error: 'Errore nel recupero dei pagamenti' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getAuthSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { userId, amount, periodStart, periodEnd, notes, paymentDate } = body;
        const companyId = session.companyId;

        if (!userId || !amount || !periodStart || !periodEnd) {
            return NextResponse.json({ 
                error: 'userId, amount, periodStart e periodEnd sono richiesti' 
            }, { status: 400 });
        }

        const payload = {
            userId,
            companyId,
            amount: parseFloat(amount),
            periodStart: new Date(periodStart).toISOString(),
            periodEnd: new Date(periodEnd).toISOString(),
            paymentDate: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString(),
            notes: notes || null
        };

        const docRef = await adminDb.collection('payments').add(payload);

        return NextResponse.json({ payment: { id: docRef.id, ...payload } }, { status: 201 });
    } catch (error) {
        console.error('Error creating payment:', error);
        return NextResponse.json({ error: 'Errore nella creazione del pagamento' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getAuthSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const paymentId = searchParams.get('paymentId');
        const companyId = session.companyId;

        if (!paymentId) {
            return NextResponse.json({ error: 'paymentId richiesto' }, { status: 400 });
        }

        const paymentRef = adminDb.collection('payments').doc(paymentId);
        const doc = await paymentRef.get();

        if (!doc.exists || doc.data()?.companyId !== companyId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await paymentRef.delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting payment:', error);
        return NextResponse.json({ error: 'Errore nella cancellazione del pagamento' }, { status: 500 });
    }
}
