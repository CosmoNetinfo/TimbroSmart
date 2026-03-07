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
        // Fetch all events for the company and filter in memory to avoid "missing index" errors
        // for composite queries (Equality + Range).
        let query = adminDb.collection('calendar_events')
            .where('companyId', '==', companyId);

        const snapshot = await query.get();
        let events = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

        // Month filter: date starts with "YYYY-MM"
        if (month) {
            events = events.filter((e: any) => e.date.startsWith(month));
        }

        // User filter
        if (session.role === 'ADMIN') {
            if (userId) {
                events = events.filter((e: any) => e.userId === userId);
            }
        } else {
            // Workers only see their own events
            events = events.filter((e: any) => e.userId === session.uid);
        }

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
