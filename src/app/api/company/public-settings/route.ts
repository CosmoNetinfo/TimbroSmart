import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthSession } from '@/lib/firebase/auth-helper';

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = session.companyId;
        if (!companyId) {
            return NextResponse.json({ gpsGeofencing: false, faceValidation: false });
        }

        const companyDoc = await adminDb.collection('companies').doc(companyId).get();

        if (!companyDoc.exists) {
            return NextResponse.json({ gpsGeofencing: false, faceValidation: false });
        }

        const data = companyDoc.data() || {};
        
        // Return only what's needed for the worker app
        return NextResponse.json({
            gpsGeofencing: data.gpsGeofencing || false,
            faceValidation: data.faceValidation || false,
            logoUrl: data.logoUrl || '',
            primaryColor: data.primaryColor || '',
            name: data.name || 'TimbroSmart'
        });
    } catch (error) {
        console.error('Fetch company public settings error:', error);
        return NextResponse.json({ error: 'Errore recupero impostazioni' }, { status: 500 });
    }
}
