import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: Request) {
    // SECURITY: Registration is disabled for the commercial version.
    // Companies and Master Admins are pre-configured.
    return NextResponse.json({ error: 'La registrazione è disabilitata in questa versione' }, { status: 403 });

    try {
        const body = await request.json();
        const { name, code, isNewCompany, companyName } = body;

        if (!name || !code) {
            return NextResponse.json({ error: 'Nome e Codice sono richiesti' }, { status: 400 });
        }

        const usersRef = adminDb.collection('users');
        
        // 1. Check if code exists
        const existingUser = await usersRef.where('code', '==', code).get();
        if (!existingUser.empty) {
            return NextResponse.json({ error: 'Codice già in uso' }, { status: 400 });
        }

        let companyId;
        let role = 'USER';

        if (isNewCompany) {
            // 2. Create New Company (Admin Registration)
            const companyRef = await adminDb.collection('companies').add({
                name: companyName || `${name}'s Company`,
                plan: 'FREE',
                createdAt: new Date().toISOString(),
                ownerName: name
            });
            companyId = companyRef.id;
            role = 'ADMIN';
        } else {
            // 3. Join Existing Company (Worker Registration)
            // For now, we simplify: if not new, we look for a default or shared ID.
            // In a real SaaS, workers would receive an invitation or companyCode.
            // Using 'TEST_COMPANY' as a placeholder for anonymous joins if not specified.
            companyId = body.companyId || 'TEST_COMPANY';

            // 4. ENFORCE FREE PLAN LIMITS (Max 3 Users)
            const companyDoc = await adminDb.collection('companies').doc(companyId).get();
            const plan = companyDoc.exists ? companyDoc.data()?.plan : 'FREE';

            if (plan === 'FREE') {
                const companyUsers = await usersRef.where('companyId', '==', companyId).get();
                if (companyUsers.size >= 3) {
                    return NextResponse.json({ 
                        error: 'Limite raggiunto per il piano FREE (Max 3 dipendenti). Passa a PRO per aggiungere altri utenti.' 
                    }, { status: 403 });
                }
            }
        }

        const payload = {
            name,
            code,
            companyId,
            role,
            hourlyWage: 7.0,
            createdAt: new Date().toISOString()
        };

        const docRef = await usersRef.add(payload);
        
        return NextResponse.json({ id: docRef.id, ...payload });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Errore durante la creazione utente' }, { status: 500 });
    }
}

