import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthSession } from '@/lib/firebase/auth-helper';

export async function GET(request: Request) {
    try {
        const session = await getAuthSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month'); // e.g., "2026-03"
        const userId = searchParams.get('userId'); // Optional: filter by user

        const companyId = session.companyId;
        let query = adminDb.collection('calendar_events')
            .where('companyId', '==', companyId);

        if (month) {
            // Firestore doesn't support partial string match easily with index, 
            // but we can use >= and <= if we store dates as ISO strings.
            const start = `${month}-01`;
            const end = `${month}-31`; // Simplified
            query = query.where('date', '>=', start).where('date', '<=', end);
        }

        if (userId && session.role === 'ADMIN') {
            query = query.where('userId', '==', userId);
        } else if (session.role !== 'ADMIN') {
            // Workers only see their own events
            query = query.where('userId', '==', session.uid);
        }

        const snapshot = await query.get();
        const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json(events);
    } catch (error) {
        console.error('Calendar GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getAuthSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { date, title, type, description, targetUserId } = body;

        if (!date || !title || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const companyId = session.companyId;
        const userId = session.role === 'ADMIN' && targetUserId ? targetUserId : session.uid;

        const newEvent = {
            companyId,
            userId,
            date, // ISO Date YYYY-MM-DD
            title,
            type, // FERIE, MALATTIA, TURNO, ALTRO
            description: description || '',
            createdAt: new Date().toISOString(),
            createdBy: session.uid
        };

        const docRef = await adminDb.collection('calendar_events').add(newEvent);

        return NextResponse.json({ id: docRef.id, ...newEvent });
    } catch (error) {
        console.error('Calendar POST error:', error);
        return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getAuthSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('id');

        if (!eventId) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        const eventRef = adminDb.collection('calendar_events').doc(eventId);
        const doc = await eventRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const data = doc.data();
        if (data?.companyId !== session.companyId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Only Admin or the owner can delete
        if (session.role !== 'ADMIN' && data?.userId !== session.uid) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await eventRef.delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Calendar DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }
}
