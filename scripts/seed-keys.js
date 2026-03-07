require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

// Manual env loading (robust fallback)
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
} catch (e) {}

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

async function seedKeys() {
  console.log("🔑 Generazione Chiavi Master TimbroSmart...");
  
  const keys = [
    { key: "BASE-7788-9900-TSMT", plan: "FREE", note: "Licenza Base di Prova" },
    { key: "PROO-1122-3344-TSMT", plan: "PRO", note: "Licenza PRO Commerciale" },
    { key: "ENTR-5566-7788-TSMT", plan: "ENTERPRISE", note: "Licenza Enterprise Full" }
  ];

  for (const k of keys) {
    try {
      await db.collection('master_keys').doc(k.key).set({
        plan: k.plan,
        note: k.note,
        createdAt: new Date().toISOString(),
        isActive: true
      });
      console.log(`✅ Generata Chiave ${k.plan}: ${k.key}`);
    } catch (e) {
      console.error(`❌ Errore per ${k.key}:`, e);
    }
  }
}

seedKeys();
