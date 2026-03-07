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

// 3. Funzioni di Utilità
function generateRandomCode(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function bulkSeed() {
  console.log("🚀 Avvio Generazione Bulk TimbroSmart...");
  
  const plans = ['FREE', 'PRO', 'ENTERPRISE'];
  const countPerPlan = 30;
  const results = {
      keys: [],
      admins: []
  };

  for (const plan of plans) {
    console.log(`\n📦 Generazione per piano: ${plan}...`);
    
    for (let i = 1; i <= countPerPlan; i++) {
        // --- A. Generazione Chiave di Attivazione ---
        const serialKey = `${plan}-${generateRandomCode(4)}-${generateRandomCode(4)}-TSMT`;
        await db.collection('master_keys').doc(serialKey).set({
            plan: plan,
            isActive: true,
            createdAt: new Date().toISOString()
        });
        results.keys.push({ serialKey, plan });

        // --- B. Generazione Admin e Azienda ---
        const companyId = `CMP-${plan}-${i.toString().padStart(3, '0')}-${generateRandomCode(4)}`;
        const adminCode = `ADM-${plan}-${generateRandomCode(6)}`;
        const companyName = `Azienda ${plan} ${i}`;

        // Create Company
        await db.collection('companies').doc(companyId).set({
            name: companyName,
            plan: plan,
            createdAt: new Date().toISOString(),
            ownerName: `Admin ${plan} ${i}`
        });

        // Create Admin User
        await db.collection('users').add({
            name: `Admin ${plan} ${i}`,
            role: "ADMIN",
            code: adminCode,
            companyId: companyId,
            createdAt: new Date().toISOString(),
            hourlyWage: plan === 'FREE' ? 10 : 15 // Esempio
        });

        results.admins.push({
            companyName,
            plan,
            adminCode,
            companyId
        });

        if (i % 10 === 0) console.log(`... ${i}/${countPerPlan} completati`);
    }
  }

  // 4. Salvataggio risultati in JSON
  const outputPath = path.resolve(process.cwd(), 'CREDENZIALI_BULK.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  
  console.log(`\n✅ GENERAZIONE COMPLETATA!`);
  console.log(`🔑 Chiavi generate: ${results.keys.length}`);
  console.log(`👥 Admin generati: ${results.admins.length}`);
  console.log(`📄 Dati salvati in: ${outputPath}`);
}

bulkSeed().catch(console.error);
