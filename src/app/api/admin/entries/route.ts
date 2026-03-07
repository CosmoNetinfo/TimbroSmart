import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthSession } from '@/lib/firebase/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getAuthSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        
        // Type safety: cast session or use specific check
        const sessionAny = session as any;
        
        let finalCompanyId = sessionAny.companyId;
        if (!finalCompanyId) {
            const userDoc = await adminDb.collection('users').doc(session.uid).get();
            finalCompanyId = userDoc.data()?.companyId;
        }

        const entriesRef = adminDb.collection('entries');
        let query: any = entriesRef.where('companyId', '==', finalCompanyId);

        if (userId) {
            query = query.where('userId', '==', userId);
        }

        if (startDate && endDate) {
            query = query.where('timestamp', '>=', startDate).where('timestamp', '<=', endDate);
        } else if (startDate) {
            query = query.where('timestamp', '>=', startDate);
        }

        query = query.orderBy('timestamp', 'desc');

        if (!startDate && !userId) {
            query = query.limit(50);
        }

        const querySnapshot = await query.get();

        // Fetch all users for this company to simulate JOIN
        const usersSnapshot = await adminDb.collection('users')
            .where('companyId', '==', companyId)
            .get();
        
        const usersMap = new Map();
        usersSnapshot.forEach((doc: any) => {
            const data = doc.data();

            usersMap.set(doc.id, { id: doc.id, name: data.name, code: data.code, hourlyWage: data.hourlyWage });
        });

        const safeEntries = querySnapshot.docs.map((doc: any) => {
            const data = doc.data();

            return {
                id: doc.id,
                type: data.type,
                timestamp: data.timestamp,
                userId: data.userId,
                photoUrl: null, // Avoid payload bloat in list view
                hasPhoto: !!data.photoUrl,
                user: usersMap.get(data.userId) || null
            };
        });

        return NextResponse.json(safeEntries);
    } catch (error) {
        console.error('Fetch entries error:', error);
        return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
    }
}
