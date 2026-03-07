import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthSession } from '@/lib/firebase/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getAuthSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = session.companyId;
        const usersRef = adminDb.collection('users');
        const querySnapshot = await usersRef.where('companyId', '==', companyId).get();

        const users = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                code: data.code,
                role: data.role,
                hourlyWage: data.hourlyWage,
            };
        });

        users.sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json(users);
    } catch (error) {
        console.error('Fetch users error:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getAuthSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, code, hourlyWage } = await request.json();
        const companyId = session.companyId;

        if (!name || !code) {
            return NextResponse.json({ error: 'Nome e Matricola sono obbligatori' }, { status: 400 });
        }

        // Check if code already exists
        const codeCheck = await adminDb.collection('users').where('code', '==', code).get();
        if (!codeCheck.empty) {
            return NextResponse.json({ error: 'Questa matricola è già in uso' }, { status: 400 });
        }

        const newUser = {
            name: name.trim(),
            code: code.trim().toUpperCase(),
            role: 'USER',
            companyId: companyId,
            hourlyWage: parseFloat(hourlyWage) || 0,
            createdAt: new Date().toISOString()
        };

        const docRef = await adminDb.collection('users').add(newUser);

        return NextResponse.json({ 
            success: true, 
            id: docRef.id, 
            message: 'Dipendente creato con successo!' 
        });
    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json({ error: 'Errore durante la creazione' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getAuthSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('id');

        if (!userId) {
            return NextResponse.json({ error: 'ID utente mancante' }, { status: 400 });
        }

        // Security check: verify the user belongs to the same company
        const userDoc = await adminDb.collection('users').doc(userId).get();
        if (!userDoc.exists || userDoc.data()?.companyId !== session.companyId) {
            return NextResponse.json({ error: 'Accesso negato o utente non trovato' }, { status: 403 });
        }

        await adminDb.collection('users').doc(userId).delete();

        return NextResponse.json({ success: true, message: 'Dipendente rimosso' });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Errore durante la rimozione' }, { status: 500 });
    }
}
