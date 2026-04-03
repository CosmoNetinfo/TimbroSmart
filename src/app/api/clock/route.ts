import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthSession } from '@/lib/firebase/auth-helper';

export async function POST(request: Request) {
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // Raggio Terra in metri
        const p1 = lat1 * Math.PI / 180;
        const p2 = lat2 * Math.PI / 180;
        const dp = (lat2 - lat1) * Math.PI / 180;
        const dl = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dp/2) * Math.sin(dp/2) +
                  Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    };

    try {
        const session = await getAuthSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const userId = formData.get('userId') as string;
        const type = formData.get('type') as string;
        const image = formData.get('image') as File | null;
        const lat = parseFloat(formData.get('latitude') as string || '0');
        const lng = parseFloat(formData.get('longitude') as string || '0');
        
        const companyId = session.companyId;

        if (!userId || !['IN', 'OUT'].includes(type || '')) {
            return NextResponse.json({ error: 'Dati non validi' }, { status: 400 });
        }

        // Security check: Users can only clock for themselves
        if (session.uid !== userId) {
            const userDoc = await adminDb.collection('users').doc(userId).get();
            if (!userDoc.exists || userDoc.data()?.code !== session.email?.split('@')[0]) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        // Enterprise Validation
        const companyDoc = await adminDb.collection('companies').doc(companyId).get();
        const companyData = companyDoc.data() || {};

        // GPS Check
        if (companyData.gpsGeofencing && companyData.latitude && companyData.longitude) {
            if (!lat || !lng) {
                return NextResponse.json({ error: 'Posizione GPS mancante e obbligatoria' }, { status: 403 });
            }
            const distance = calculateDistance(lat, lng, companyData.latitude, companyData.longitude);
            if (distance > 500) {
                return NextResponse.json({ 
                    error: `Sei fuori dal raggio aziendale (${Math.round(distance)}m). Distanza massima consentita: 500m.` 
                }, { status: 403 });
            }
        }

        // Face Validation Placeholder (Check if image exists if face validation is on)
        if (companyData.faceValidation && !image) {
            return NextResponse.json({ error: 'La foto è obbligatoria per la validazione facciale' }, { status: 403 });
        }

        let photoUrl = null;

        if (image) {
            try {
                // Convert to Base64 to store directly in DB (Vercel has ephemeral file system)
                const buffer = Buffer.from(await image.arrayBuffer());
                const base64Image = buffer.toString('base64');
                photoUrl = `data:${image.type};base64,${base64Image}`;
            } catch (e) {
                console.error('Error processing image:', e);
            }
        }

        const payload = {
            userId,
            companyId,
            type,
            photoUrl,
            timestamp: new Date().toISOString()
        };
        
        const entryDoc = await adminDb.collection('entries').add(payload);

        return NextResponse.json({ id: entryDoc.id, ...payload });
    } catch (error) {
        console.error('Clock error:', error);
        return NextResponse.json({ error: 'Clock operation failed' }, { status: 500 });
    }
}
