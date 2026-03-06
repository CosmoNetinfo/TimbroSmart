import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthSession } from '@/lib/firebase/auth-helper';

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

        // Security check: Users can only see their own status
        if (session.role !== 'ADMIN' && session.uid !== userId) {
            // Validate if session email matches user code
            const userDoc = await adminDb.collection('users').doc(userId).get();
            if (!userDoc.exists || userDoc.data()?.code !== session.email?.split('@')[0]) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        const entriesRef = adminDb.collection('entries');
        const querySnapshot = await entriesRef
            .where('userId', '==', userId)
            .get();

        let lastEntry = null;
        if (!querySnapshot.empty) {
            const entries = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
            // Sort in memory to avoid requiring a composite index right away
            entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            lastEntry = entries[0];
        }

        const status = lastEntry?.type === 'IN' ? 'IN' : 'OUT';

        return NextResponse.json({ status, lastEntry });
    } catch (error) {
        console.error('Status check error:', error);
        return NextResponse.json({ error: 'Status check failed' }, { status: 500 });
    }
}
