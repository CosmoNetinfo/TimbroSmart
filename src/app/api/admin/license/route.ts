import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthSession } from '@/lib/firebase/auth-helper';

export async function POST(request: Request) {
    try {
        const session = await getAuthSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { serialKey } = await request.json();
        const companyId = session.companyId;

        if (!serialKey) {
            return NextResponse.json({ error: 'Serial Key is required' }, { status: 400 });
        }

        // Add to license_keys collection for manual verification
        const licenseRef = adminDb.collection('license_keys');
        await licenseRef.add({
            companyId,
            serialKey,
            status: 'PENDING',
            submittedBy: session.uid,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Licenza inviata per revisione. Lo sblocco avverrà dopo la convalida.' 
        });
    } catch (error) {
        console.error('License submit error:', error);
        return NextResponse.json({ error: 'Failed to submit license key' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const session = await getAuthSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = session.companyId;
        const licenseRef = adminDb.collection('license_keys');
        const snapshot = await licenseRef
            .where('companyId', '==', companyId)
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get();

        if (snapshot.empty) {
            return NextResponse.json({ status: 'NONE' });
        }

        const licenseDoc = snapshot.docs[0].data();
        
        // Also fetch the current company plan
        const companyDoc = await adminDb.collection('companies').doc(companyId).get();
        const currentPlan = companyDoc.exists ? companyDoc.data()?.plan : 'FREE';

        return NextResponse.json({ 
            status: licenseDoc.status, 
            serialKey: licenseDoc.serialKey,
            currentPlan: currentPlan 
        });

    } catch (error) {
        console.error('Fetch license error:', error);
        return NextResponse.json({ error: 'Failed to fetch license status' }, { status: 500 });
    }
}
