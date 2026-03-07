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

async function syncDatabase() {
    console.log("🚀 Avvio Sincronizzazione Database TimbroSmart...");
    
    // Caricamento dati dal file JSON
    const dataPath = path.resolve(process.cwd(), 'CREDENZIALI_BULK.json');
    if (!fs.existsSync(dataPath)) {
        console.error("❌ Errore: File CREDENZIALI_BULK.json non trovato.");
        return;
    }
    
    const { keys, admins } = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`📊 Caricati: ${keys.length} chiavi e ${admins.length} record admin.`);

    // --- A. Sync Master Keys ---
    console.log("\n🔑 Sincronizzazione Master Keys...");
    for (const item of keys) {
        const keyRef = db.collection('master_keys').doc(item.serialKey);
        const doc = await keyRef.get();
        if (!doc.exists) {
            await keyRef.set({
                plan: item.plan,
                isActive: true, // Come richiesto: caricate e pronte ad essere attivate (o già attive)
                createdAt: new Date().toISOString()
            });
            console.log(`+ Creata chiave: ${item.serialKey}`);
        }
    }

    // --- B. Sync Aziende & Admin ---
    console.log("\n🏢 Sincronizzazione Aziende & Admin...");
    for (const item of admins) {
        // 1. Verifica Azienda
        const companyRef = db.collection('companies').doc(item.companyId);
        const companyDoc = await companyRef.get();
        if (!companyDoc.exists) {
            await companyRef.set({
                name: item.companyName,
                plan: item.plan,
                createdAt: new Date().toISOString(),
                ownerName: item.companyName.replace('Azienda', 'Admin'),
                isConfigured: false // Flag per capire se è già stata personalizzata
            });
            console.log(`+ Creata azienda: ${item.companyId}`);
        }

        // 2. Verifica Admin
        const usersRef = db.collection('users');
        const adminQuery = await usersRef.where('role', '==', 'ADMIN').where('code', '==', item.adminCode).get();
        
        if (adminQuery.empty) {
            await usersRef.add({
                name: item.companyName.replace('Azienda', 'Admin'),
                role: "ADMIN",
                code: item.adminCode,
                companyId: item.companyId,
                createdAt: new Date().toISOString(),
                hourlyWage: item.plan === 'FREE' ? 10 : 15, // Default
                isActive: true
            });
            console.log(`+ Creato admin: ${item.adminCode}`);
        }
    }

    console.log("\n✅ SINCRONIZZAZIONE COMPLETATA!");
}

syncDatabase().catch(console.error);
