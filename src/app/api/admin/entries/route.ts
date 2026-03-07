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

        const querySnapshot = await query.get();

        // Perform date filtering and sorting in memory to avoid index requirements
        let allEntries = querySnapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
        }));

        if (startDate) {
            allEntries = allEntries.filter((e: any) => e.timestamp >= startDate);
        }
        if (endDate) {
            allEntries = allEntries.filter((e: any) => e.timestamp <= endDate);
        }

        allEntries.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        const limitedEntries = (!startDate && !userId) ? allEntries.slice(0, 50) : allEntries;

        // Fetch all users for this company to simulate JOIN
        const usersSnapshot = await adminDb.collection('users')
            .where('companyId', '==', finalCompanyId)
            .get();
        
        const usersMap = new Map();
        usersSnapshot.forEach((doc: any) => {
            const data = doc.data();

            usersMap.set(doc.id, { id: doc.id, name: data.name, code: data.code, hourlyWage: data.hourlyWage });
        });

        const safeEntries = limitedEntries.map((data: any) => {
            return {
                id: data.id,
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
