import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// FUNZIONE DI SICUREZZA TEMPORANEA
// In un ambiente reale, useremmo un ruolo SUPER_ADMIN in Firebase Auth.
// Qui usiamo un controllo basato su una Master Key definita nel server.
const MASTER_SECRET = process.env.SUPER_ADMIN_PASSWORD || 'TSMT_2026';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        console.log('[SuperAdmin GET] Tentativo di accesso...');

        if (secret !== MASTER_SECRET) {
            console.warn('[SuperAdmin GET] Password errata');
            return NextResponse.json({ error: 'Accesso negato' }, { status: 403 });
        }

        // Recupera TUTTE le licenze senza orderBy (evita errori indice Firestore)
        const snapshot = await adminDb.collection('master_keys').get();
        
        console.log(`[SuperAdmin GET] Documenti trovati: ${snapshot.size}`);

        const keys = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                plan: data.plan || 'UNKNOWN',
                isActive: data.isActive !== undefined ? data.isActive : true,
                adminCode: data.adminCode || null,
                createdAt: data.createdAt || data.updatedAt || new Date().toISOString(),
                updatedAt: data.updatedAt || '',
            };
        });

        // Sort lato server (più recenti prima) - evita la necessità di indici Firestore
        keys.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime() || 0;
            const dateB = new Date(b.createdAt).getTime() || 0;
            return dateB - dateA;
        });

        return NextResponse.json(keys);
    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('[SuperAdmin GET] Errore critico:', errMsg);
        return NextResponse.json({ error: `Errore nel recupero licenze: ${errMsg}` }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { secret, serialKey, adminCode, plan, isActive } = body;

        console.log(`[SuperAdmin POST] Richiesta per chiave: ${serialKey}, piano: ${plan}`);

        if (secret !== MASTER_SECRET) {
            console.warn('[SuperAdmin POST] Password errata');
            return NextResponse.json({ error: 'Accesso negato' }, { status: 403 });
        }

        if (!serialKey || !plan || !adminCode) {
            return NextResponse.json({ error: 'Dati mancanti (serialKey, adminCode e plan sono obbligatori)' }, { status: 400 });
        }

        // Controlla se la chiave esiste già per preservare createdAt
        const existing = await adminDb.collection('master_keys').doc(serialKey).get();
        const existingData = existing.exists ? existing.data() : null;

        // Se la chiave è NUOVA, creiamo in automatico anche la Compagnia e l'Utente Admin
        if (!existing.exists) {
            const companyId = `CMP-${plan}-${Date.now().toString().slice(-6)}`;
            
            await adminDb.collection('companies').doc(companyId).set({
                name: `Nuova Azienda ${plan}`,
                plan: plan,
                createdAt: new Date().toISOString(),
                ownerName: `Admin ${plan}`
            });

            await adminDb.collection('users').add({
                name: `Admin ${plan}`,
                role: "ADMIN",
                code: adminCode,
                companyId: companyId,
                createdAt: new Date().toISOString(),
                hourlyWage: 0
            });
            console.log(`[SuperAdmin POST] Provisioning account completato per ${adminCode}`);
        }

        await adminDb.collection('master_keys').doc(serialKey).set({
            plan,
            adminCode,
            isActive: isActive !== undefined ? isActive : true,
            updatedAt: new Date().toISOString(),
            createdAt: existingData?.createdAt || new Date().toISOString(),
        }, { merge: true });

        console.log(`[SuperAdmin POST] Chiave ${serialKey} salvata con successo`);
        return NextResponse.json({ success: true, message: `Licenza ${serialKey} salvata` });
    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('[SuperAdmin POST] Errore critico:', errMsg);
        return NextResponse.json({ error: `Errore nel salvataggio licenza: ${errMsg}` }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');
        const serialKey = searchParams.get('serialKey');

        console.log(`[SuperAdmin DELETE] Richiesta eliminazione: ${serialKey}`);

        if (secret !== MASTER_SECRET) {
            console.warn('[SuperAdmin DELETE] Password errata');
            return NextResponse.json({ error: 'Accesso negato' }, { status: 403 });
        }

        if (!serialKey) {
            return NextResponse.json({ error: 'SerialKey mancante' }, { status: 400 });
        }

        // Verifica che la chiave esista prima di eliminare
        const doc = await adminDb.collection('master_keys').doc(serialKey).get();
        if (!doc.exists) {
            return NextResponse.json({ error: `Chiave ${serialKey} non trovata` }, { status: 404 });
        }

        await adminDb.collection('master_keys').doc(serialKey).delete();

        console.log(`[SuperAdmin DELETE] Chiave ${serialKey} eliminata`);
        return NextResponse.json({ success: true, message: `Licenza ${serialKey} eliminata` });
    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('[SuperAdmin DELETE] Errore critico:', errMsg);
        return NextResponse.json({ error: `Errore nell'eliminazione: ${errMsg}` }, { status: 500 });
    }
}
