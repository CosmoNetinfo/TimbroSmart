import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthSession } from '@/lib/firebase/auth-helper';

export async function POST(request: Request) {
    try {
        const session = await getAuthSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId, hourlyWage } = await request.json();
        const companyId = session.companyId;

        if (!userId || hourlyWage === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const wage = parseFloat(hourlyWage);
        if (isNaN(wage)) {
            return NextResponse.json({ error: 'Invalid wage' }, { status: 400 });
        }

        const userRef = adminDb.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists || userDoc.data()?.companyId !== companyId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        
        await userRef.update({
            hourlyWage: wage
        });

        const updatedSnap = await userRef.get();
        const user = { id: updatedSnap.id, ...updatedSnap.data() };

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error('Error updating wage:', error);
        return NextResponse.json({ error: 'Failed to update wage' }, { status: 500 });
    }
}
