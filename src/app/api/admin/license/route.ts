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

        // 1. Check against Master Keys
        const masterKeyRef = adminDb.collection('master_keys').doc(serialKey);
        const masterKeySnap = await masterKeyRef.get();

        if (!masterKeySnap.exists || !masterKeySnap.data()?.isActive) {
            return NextResponse.json({ error: 'Chiave non valida o già utilizzata' }, { status: 400 });
        }

        const planToActivate = masterKeySnap.data()?.plan;

        // 2. Perform Upgrade (Atomic)
        const batch = adminDb.batch();
        
        // Calculate Expiry Data (12 months from now)
        const now = new Date();
        const expiryDate = new Date(now);
        expiryDate.setFullYear(now.getFullYear() + 1);
        const expiryISO = expiryDate.toISOString();
        const nowISO = now.toISOString();

        // Update company plan and expiry
        const companyRef = adminDb.collection('companies').doc(companyId);
        batch.update(companyRef, { 
            plan: planToActivate,
            licenseExpiry: expiryISO,
            licenseActivatedAt: nowISO
        });

        // Register activation in license_keys
        const licenseRef = adminDb.collection('license_keys').doc();
        batch.set(licenseRef, {
            companyId,
            serialKey,
            status: 'ACTIVE',
            plan: planToActivate,
            activatedBy: session.uid,
            timestamp: nowISO,
            expiryDate: expiryISO
        });

        // (Optional) Mark key as used if one-time use
        // batch.update(masterKeyRef, { isActive: false, usedBy: companyId });

        await batch.commit();

        return NextResponse.json({ 
            success: true, 
            newPlan: planToActivate,
            message: `Fantastico! Il piano ${planToActivate} è stato attivato con successo.` 
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
        
        // 1. Fetch Company Plan FIRST (Most reliable source)
        const companyDoc = await adminDb.collection('companies').doc(companyId).get();
        if (!companyDoc.exists) {
            return NextResponse.json({ error: 'Dati azienda non trovati' }, { status: 404 });
        }
        
        const companyData = companyDoc.data();
        const currentPlan = companyData?.plan || 'FREE';
        const licenseExpiry = companyData?.licenseExpiry || null;
        const licenseActivatedAt = companyData?.licenseActivatedAt || null;

        // 2. Try to fetch license history (Fail gracefully if index is missing)
        let licenseStatus = 'NONE';
        let serialKey = null;

        try {
            const licenseRef = adminDb.collection('license_keys');
            const snapshot = await licenseRef
                .where('companyId', '==', companyId)
                .orderBy('timestamp', 'desc')
                .limit(1)
                .get();

            if (!snapshot.empty) {
                const doc = snapshot.docs[0].data();
                licenseStatus = doc.status;
                serialKey = doc.serialKey;
            }
        } catch (queryError) {
            console.warn('Index missing or query failed, but proceeding with company plan:', queryError);
            // We proceed even if logs fail, as the core plan info is in the company doc
        }

        return NextResponse.json({
            status: licenseStatus, 
            serialKey: serialKey,
            currentPlan: currentPlan,
            licenseExpiry: licenseExpiry,
            licenseActivatedAt: licenseActivatedAt
        });

    } catch (error) {
        console.error('Fetch license error:', error);
        return NextResponse.json({ error: 'Failed to fetch license status' }, { status: 500 });
    }
}
