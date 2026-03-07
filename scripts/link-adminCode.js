const fs = require('fs');
const path = require('path');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// 1. Caricamento variabili d'ambiente da .env.local
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                let value = valueParts.join('=').trim();
                if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                process.env[key.trim()] = value;
            }
        });
    }
} catch (e) {
    console.error("Errore caricamento .env.local:", e);
}

// 2. Inizializzazione Firebase
const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

async function run() {
    const jsonPath = path.resolve(process.cwd(), 'CREDENZIALI_BULK.json');
    if (!fs.existsSync(jsonPath)) {
        console.error('File CREDENZIALI_BULK.json non trovato');
        return;
    }
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const { keys, admins } = data;

    console.log(`Aggiornamento di ${keys.length} chiavi con i relativi adminCode...`);

    let batch = db.batch();
    let count = 0;

    for (let i = 0; i < keys.length; i++) {
        const serialKey = keys[i].serialKey;
        const adminCode = admins[i].adminCode;
        // Includiamo l'ID dell'azienda se è necessario, ma adminCode è il più critico
        
        const docRef = db.collection('master_keys').doc(serialKey);
        batch.update(docRef, { adminCode });
        
        count++;
        if (count % 400 === 0) {
            await batch.commit();
            console.log(`Committed ${count} updates...`);
            batch = db.batch();
        }
    }
    
    if (count % 400 !== 0) {
        await batch.commit();
        console.log(`Committed final batch, total ${count} updates.`);
    }

    console.log('Migrazione completata!');
}

run().catch(console.error);
