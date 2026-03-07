import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// Questo endpoint serve per essere chiamato ogni X minuti (es. da Cron-job.org)
// per evitare che le Cloud Functions o il Database entrino in sleep (Cold Start).
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        // Controlliamo un secret di base per evitare abusi pubblici
        if (secret !== process.env.CRON_SECRET && secret !== 'TSMT_CRON_PING') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[CRON] Esecuzione ping per risveglio database...');

        // Operazione leggerissima sul DB: leggiamo 1 documento a caso (o controlliamo l'orario)
        // per forzare l'apertura della connessione a Firestore
        const snapshot = await adminDb.collection('master_keys').limit(1).get();

        return NextResponse.json({ 
            status: 'ok', 
            message: 'Database e istanza serverless attivi',
            timestamp: new Date().toISOString(),
            dbResponse: !snapshot.empty
        });
    } catch (error) {
        console.error('[CRON] Errore ping:', error);
        return NextResponse.json({ error: 'Errore interno nel ping' }, { status: 500 });
    }
}
