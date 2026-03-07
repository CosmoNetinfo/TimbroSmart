'use client';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

interface CalendarEvent {
    id: string;
    userId: string;
    date: string;
    title: string;
    type: 'FERIE' | 'MALATTIA' | 'TURNO' | 'ALTRO';
    userName?: string;
}

interface User {
    id: string | number;
    name: string;
}

export default function AdminCalendar({ users }: { users: User[] }) {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedUserId, setSelectedUserId] = useState('');

    useEffect(() => {
        fetchEvents();
    }, [currentDate, selectedUserId]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            let url = `/api/calendar?month=${year}-${month}`;
            if (selectedUserId) url += `&userId=${selectedUserId}`;
            
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                // Join with user names for display
                const enriched = data.map((e: any) => {
                    const u = users.find(user => String(user.id) === String(e.userId));
                    return { ...e, userName: u ? u.name : 'Sconosciuto' };
                });
                setEvents(enriched);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEvent = async (id: string) => {
        if (!confirm('Eliminare questo evento?')) return;
        try {
            const res = await fetch(`/api/calendar?id=${id}`, { method: 'DELETE' });
            if (res.ok) fetchEvents();
        } catch (e) {
            alert('Errore eliminazione');
        }
    };

    const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
        "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

    return (
        <div className="card mb-8 animate-slide-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                <h3 style={{ margin: 0 }}><Calendar size={20} className="inline mr-2" /> Calendario Aziendale (Ferie/Malattie)</h3>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} style={{ width: '200px' }}>
                        <option value="">Tutti i dipendenti</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <div style={{ background: 'var(--surface-alt)', padding: '5px 15px', borderRadius: '8px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="btn-ghost" style={{ padding: '5px' }}><ChevronLeft /></button>
                        <span style={{ fontWeight: 600, minWidth: '120px', textAlign: 'center' }}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                        <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="btn-ghost" style={{ padding: '5px' }}><ChevronRight /></button>
                    </div>
                </div>
            </div>

            {loading ? (
                <p className="text-center py-10 text-muted">Caricamento eventi...</p>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Dipendente</th>
                                <th>Tipo</th>
                                <th>Titolo / Note</th>
                                <th>Azioni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.sort((a,b) => a.date.localeCompare(b.date)).map(e => (
                                <tr key={e.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{new Date(e.date).toLocaleDateString('it-IT')}</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                            ore {new Date(e.date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td><strong>{e.userName}</strong></td>
                                    <td>
                                        <span className={`status-badge ${e.type === 'FERIE' ? 'status-in' : e.type === 'MALATTIA' ? 'status-out' : ''}`} style={{ background: e.type === 'TURNO' ? '#dbeafe' : '', color: e.type === 'TURNO' ? '#1e40af' : '' }}>
                                            {e.type}
                                        </span>
                                    </td>
                                    <td>{e.title}</td>
                                    <td>
                                        <button onClick={() => handleDeleteEvent(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                            {events.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }} className="text-muted">Nessun evento registrato per questo mese.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
