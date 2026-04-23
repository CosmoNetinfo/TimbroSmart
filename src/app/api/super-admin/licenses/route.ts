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

        // Recupera TUTTE le licenze
        const snapshot = await adminDb.collection('master_keys').get();
        console.log(`[SuperAdmin GET] Documenti trovati: ${snapshot.size}`);

        const keys = await Promise.all(snapshot.docs.map(async (doc) => {
            const data = doc.data();
            const adminCode = data.adminCode;
            let companyInfo = null;

            if (adminCode) {
                // Tenta di trovare il companyId associato a questo adminCode
                const userSnapshot = await adminDb.collection('users')
                    .where('code', '==', adminCode)
                    .where('role', '==', 'ADMIN')
                    .limit(1)
                    .get();

                if (!userSnapshot.empty) {
                    const userData = userSnapshot.docs[0].data();
                    const companyId = userData.companyId;

                    if (companyId) {
                        const companyDoc = await adminDb.collection('companies').doc(companyId).get();
                        if (companyDoc.exists) {
                            const cData = companyDoc.data();
                            companyInfo = {
                                id: companyId,
                                name: cData?.name,
                                licenseExpiry: cData?.licenseExpiry || null,
                                licenseActivatedAt: cData?.licenseActivatedAt || null
                            };
                        }
                    }
                }
            }

            return {
                id: doc.id,
                plan: data.plan || 'UNKNOWN',
                isActive: data.isActive !== undefined ? data.isActive : true,
                adminCode: adminCode || null,
                createdAt: data.createdAt || data.updatedAt || new Date().toISOString(),
                companyInfo
            };
        }));

        // Sort lato server (più recenti prima)
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

        // 1. Dati della licenza pre-cancellazione
        const doc = await adminDb.collection('master_keys').doc(serialKey).get();
        if (!doc.exists) {
            return NextResponse.json({ error: `Chiave ${serialKey} non trovata` }, { status: 404 });
        }
        
        const keyData = doc.data();
        const adminCode = keyData?.adminCode;

        // Inizializza il batch per operazioni multiple
        const batch = adminDb.batch();

        // Elimina subito la chiave master
        batch.delete(adminDb.collection('master_keys').doc(serialKey));

        if (adminCode) {
            console.log(`[SuperAdmin CASCADE] Cerco Admin con code: ${adminCode}`);
            // Trova l'utente Admin per recuperare il companyId
            const adminUsers = await adminDb.collection('users').where('code', '==', adminCode).get();
            
            if (!adminUsers.empty) {
                const companyId = adminUsers.docs[0].data().companyId;
                console.log(`[SuperAdmin CASCADE] Trovato CompanyId: ${companyId}. Avvio pulizia a cascata...`);

                // A. Trova ed elimina tutti gli UTENTI dell'azienda
                const companyUsers = await adminDb.collection('users').where('companyId', '==', companyId).get();
                const userIds: string[] = [];
                
                companyUsers.docs.forEach(uDoc => {
                    batch.delete(uDoc.ref);
                    userIds.push(uDoc.id);
                });
                console.log(`[SuperAdmin CASCADE] In coda eliminazione di ${userIds.length} utenti.`);

                // B. Trova ed elimina tutti i TIMER RECORDS (timbrature) degli utenti
                if (userIds.length > 0) {
                    // Limite Firestore: gli array `in` supportano max 30 elementi per query. 
                    // Li chucnko se necessario. Per semplicità, facciamo query singole se molti.
                    for (const uId of userIds) {
                        const records = await adminDb.collection('entries').where('userId', '==', uId).get();
                        records.docs.forEach(rDoc => batch.delete(rDoc.ref));
                    }
                    console.log(`[SuperAdmin CASCADE] In coda eliminazione timbrature storiche.`);
                }

                // C. Elimina l'AZIENDA principale
                if (companyId) {
                    batch.delete(adminDb.collection('companies').doc(companyId));
                    console.log(`[SuperAdmin CASCADE] In coda eliminazione azienda.`);
                }
            } else {
                console.warn(`[SuperAdmin CASCADE] Nessun Admin trovato per adminCode ${adminCode}`);
            }
        }

        // 2. Esegui la cancellazione distruttiva di massa
        await batch.commit();

        console.log(`[SuperAdmin DELETE] Chiave ${serialKey} ed eventuale ecosistema aziendale eliminati.`);
        return NextResponse.json({ success: true, message: `Licenza ed ecosistema eliminato` });
    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('[SuperAdmin DELETE] Errore critico:', errMsg);
        return NextResponse.json({ error: `Errore nell'eliminazione: ${errMsg}` }, { status: 500 });
    }
}
