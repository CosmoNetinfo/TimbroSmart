import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthSession } from '@/lib/firebase/auth-helper';

export async function POST(request: Request) {
    try {
        const session = await getAuthSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const userId = formData.get('userId') as string;
        const type = formData.get('type') as string;
        const image = formData.get('image') as File | null;
        
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
