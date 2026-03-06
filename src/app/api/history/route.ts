import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthSession } from '@/lib/firebase/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getAuthSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Security check
        if (session.role !== 'ADMIN' && session.uid !== userId) {
            const userDoc = await adminDb.collection('users').doc(userId).get();
            if (!userDoc.exists || userDoc.data()?.code !== session.email?.split('@')[0]) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }


        const entriesSnap = await adminDb.collection('entries')
            .where('userId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(100)
            .get();
        
        const userSnap = await adminDb.collection('users').doc(userId).get();

        const entries = entriesSnap.docs.map((doc: any) => {
            const data = doc.data();
            return {
                id: doc.id,
                type: data.type,
                timestamp: data.timestamp
            };
        });


        const userData = userSnap.exists ? userSnap.data() : null;

        return NextResponse.json({
            entries,
            hourlyWage: userData?.hourlyWage ?? 7.0,
        });
    } catch (error) {
        console.error('Failed to fetch history:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
