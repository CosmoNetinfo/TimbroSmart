
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// SECURE: Use environment variables
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

async function seedSystem() {
  console.log("🚀 Inizializzazione Sistema TimbroSmart...");
  
  const configs = [
    {
      companyId: "BASE_PLAN_COMPANY",
      companyName: "TimbroSmart Base",
      plan: "FREE",
      adminCode: "ADMIN_BASE",
      adminName: "Admin Base"
    },
    {
      companyId: "PRO_PLAN_COMPANY",
      companyName: "TimbroSmart PRO",
      plan: "PRO",
      adminCode: "ADMIN_PRO",
      adminName: "Admin PRO"
    },
    {
      companyId: "ENTERPRISE_PLAN_COMPANY",
      companyName: "TimbroSmart Enterprise",
      plan: "ENTERPRISE",
      adminCode: "ADMIN_ENT",
      adminName: "Admin Enterprise"
    }
  ];

  for (const config of configs) {
    try {
      console.log(`Configurazione ${config.companyName}...`);
      
      // 1. Create/Update Company
      await db.collection('companies').doc(config.companyId).set({
        name: config.companyName,
        plan: config.plan,
        createdAt: new Date().toISOString(),
        ownerName: config.adminName
      }, { merge: true });

      // 2. Create/Update Admin User
      const usersRef = db.collection('users');
      const existing = await usersRef.where('code', '==', config.adminCode).get();
      
      if (existing.empty) {
        await usersRef.add({
          name: config.adminName,
          role: "ADMIN",
          code: config.adminCode,
          companyId: config.companyId,
          createdAt: new Date().toISOString(),
          hourlyWage: 0
        });
        console.log(`✅ Creato Admin: ${config.adminCode} (${config.plan})`);
      } else {
        console.log(`ℹ️ Admin ${config.adminCode} già esistente.`);
      }
    } catch (e) {
      console.error(`❌ Errore per ${config.companyName}:`, e);
    }
  }
}

seedSystem();
