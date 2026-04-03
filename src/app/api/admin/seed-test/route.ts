import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET() {
    try {
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

        const results = [];

        for (const config of configs) {
            // 1. Create/Update Company
            await adminDb.collection('companies').doc(config.companyId).set({
                name: config.companyName,
                plan: config.plan,
                createdAt: new Date().toISOString(),
                ownerName: config.adminName
            }, { merge: true });

            // 2. Create/Update Admin User
            const usersRef = adminDb.collection('users');
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
                results.push(`✅ Creato Admin: ${config.adminCode} (${config.plan})`);
            } else {
                results.push(`ℹ️ Admin ${config.adminCode} già esistente.`);
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: "Inizializzazione completata!",
            results: results
        });
    } catch (error: any) {
        console.error('Seed error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
