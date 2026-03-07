'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CalendarEvent {
    id: string;
    date: string;
    title: string;
    type: 'FERIE' | 'MALATTIA' | 'TURNO' | 'ALTRO';
    description?: string;
}

export default function CalendarPage() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showModal, setShowModal] = useState(false);
    const [newEvent, setNewEvent] = useState({
        date: new Date().toISOString().split('T')[0],
        title: '',
        type: 'FERIE' as const,
        description: ''
    });

    const router = useRouter();

    useEffect(() => {
        fetchEvents();
    }, [currentDate]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const res = await fetch(`/api/calendar?month=${year}-${month}`);
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/calendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEvent)
            });
            if (res.ok) {
                setShowModal(false);
                fetchEvents();
            }
        } catch (e) {
            alert('Errore di connessione');
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

    // Calendar logic
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const prevMonthLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();

    const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
        "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

    return (
        <main className="mobile-container">
            <div className="animate-slide-up" style={{ padding: '2rem 1rem', paddingBottom: '100px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <Link href="/dashboard" style={{ textDecoration: 'none', fontSize: '1.5rem' }}>⬅️</Link>
                    <h2 style={{ margin: 0 }}>Calendario</h2>
                    <button onClick={() => setShowModal(true)} className="btn-glass-primary" style={{ padding: '8px 15px', width: 'auto' }}>
                        +
                    </button>
                </div>

                {/* Month Picker */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'var(--surface)', padding: '10px', borderRadius: '12px' }}>
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>◀️</button>
                    <span style={{ fontWeight: 'bold' }}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>▶️</button>
                </div>

                {/* Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
                    {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map(d => (
                        <div key={d} style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)', padding: '5px' }}>{d}</div>
                    ))}
                    
                    {/* Empty Slots */}
                    {Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 }).map((_, i) => (
                        <div key={i} style={{ height: '60px', opacity: 0.3, background: 'var(--surface-alt)', borderRadius: '8px' }} />
                    ))}

                    {/* Days */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayEvents = events.filter(e => e.date === dateStr);
                        
                        return (
                            <div key={i} style={{ 
                                height: '60px', 
                                background: 'var(--surface)', 
                                borderRadius: '8px', 
                                padding: '4px',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                border: '1px solid var(--border)'
                            }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{day}</span>
                                <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4px' }}>
                                    {dayEvents.map(e => (
                                        <div key={e.id} title={e.title} style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: e.type === 'FERIE' ? '#34d399' : e.type === 'MALATTIA' ? '#fb7185' : '#60a5fa'
                                        }} />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Events list of the month */}
                <div style={{ marginTop: '2rem' }}>
                    <h3 className="mb-4">Eventi di {monthNames[currentDate.getMonth()]}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {events.sort((a,b) => a.date.localeCompare(b.date)).map(e => (
                            <div key={e.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{ 
                                        padding: '8px', 
                                        borderRadius: '8px', 
                                        background: e.type === 'FERIE' ? '#dcfce7' : e.type === 'MALATTIA' ? '#fee2e2' : '#dbeafe',
                                        fontSize: '1.2rem'
                                    }}>
                                        {e.type === 'FERIE' ? '🌴' : e.type === 'MALATTIA' ? '🤒' : '🕒'}
                                    </div>
                                    <div>
                                        <div className="font-bold">{e.title}</div>
                                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>{new Date(e.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}</div>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteEvent(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>🗑️</button>
                            </div>
                        ))}
                        {events.length === 0 && <p className="text-muted text-center py-4">Nessun evento in questo mese.</p>}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                    <div className="card-solid animate-slide-up" style={{ width: '100%', maxWidth: '400px' }}>
                        <h3 className="mb-4">Nuovo Evento</h3>
                        <form onSubmit={handleAddEvent}>
                            <div className="mb-4">
                                <label className="label">Titolo</label>
                                <input type="text" className="custom-input" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} placeholder="Es. Ferie estive" required />
                            </div>
                            <div className="mb-4">
                                <label className="label">Tipo</label>
                                <select value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value as any})} className="custom-input">
                                    <option value="FERIE">🌴 Ferie</option>
                                    <option value="MALATTIA">🤒 Malattia</option>
                                    <option value="TURNO">🕒 Turno/Straordinario</option>
                                    <option value="ALTRO">✨ Altro</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="label">Data</label>
                                <input type="date" className="custom-input" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} required />
                            </div>
                            <div className="mb-6">
                                <label className="label">Note (opzionale)</label>
                                <textarea className="custom-input" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} style={{ height: '80px', paddingTop: '10px' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-glass-primary" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Annulla</button>
                                <button type="submit" className="btn-glass-primary">Salva</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
