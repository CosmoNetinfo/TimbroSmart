
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Use existing environment variables or placeholders for local execution
// In a real scenario, this would run once to setup the master DB
const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "timbrosmart-9f170",
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

async function seedAdmin() {
  console.log("Inizializzazione Account Master Admin...");
  
  const MASTER_COMPANY_ID = "MASTER_ADMIN_COMPANY";
  const MASTER_ADMIN_CODE = "ADMIN2026"; // Codice fornito all'acquisto

  try {
    // 1. Create/Update Company
    await db.collection('companies').doc(MASTER_COMPANY_ID).set({
      name: "TimbroSmart Admin",
      plan: "PRO",
      createdAt: new Date().toISOString(),
      ownerName: "Administrator"
    }, { merge: true });

    // 2. Create/Update Admin User
    const usersRef = db.collection('users');
    const existing = await usersRef.where('code', '==', MASTER_ADMIN_CODE).get();
    
    if (existing.empty) {
      await usersRef.add({
        name: "Amministratore",
        role: "ADMIN",
        code: MASTER_ADMIN_CODE,
        companyId: MASTER_COMPANY_ID,
        createdAt: new Date().toISOString(),
        hourlyWage: 0
      });
      console.log(`Successo! Account Admin creato con codice: ${MASTER_ADMIN_CODE}`);
    } else {
      console.log("L'account Admin esiste già.");
    }
  } catch (e) {
    console.error("Errore durante il seeding:", e);
  }
}

seedAdmin();
