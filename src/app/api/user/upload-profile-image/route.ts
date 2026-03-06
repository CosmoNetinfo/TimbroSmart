import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthSession } from '@/lib/firebase/auth-helper';

export async function POST(request: Request) {
    try {
        const session = await getAuthSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { image } = await request.json();
        const userId = session.uid;

        if (!image) {
            return NextResponse.json({ error: 'Missing image data' }, { status: 400 });
        }

        const userRef = adminDb.collection('users').doc(userId);
        
        // Update user profile image
        await userRef.update({
            profileImage: image
        });

        const userSnap = await userRef.get();
        const updatedUser = { id: userSnap.id, ...userSnap.data() };


        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error('Error uploading profile image:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
