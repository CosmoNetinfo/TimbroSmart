import admin from 'firebase-admin';

function getAdminApp() {
    if (!admin.apps.length) {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (projectId && clientEmail && privateKey) {
            try {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId,
                        clientEmail,
                        privateKey,
                    }),
                });
            } catch (error) {
                console.error('Firebase admin initialization error', error);
            }
        } else {
            try {
                // Safe fallback for build time
                admin.initializeApp({
                    projectId: projectId || 'timbrosmart-dummy',
                });
            } catch (error) {
                console.error('Firebase admin fallback initialization error', error);
            }
        }
    }
    return admin.apps[0];
}

export const adminAuth = new Proxy({} as admin.auth.Auth, {
    get(target, prop) {
        getAdminApp();
        return Reflect.get(admin.auth(), prop);
    }
});

export const adminDb = new Proxy({} as admin.firestore.Firestore, {
    get(target, prop) {
        getAdminApp();
        return Reflect.get(admin.firestore(), prop);
    }
});
