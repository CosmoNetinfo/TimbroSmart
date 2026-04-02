import { useState, useEffect, useCallback } from 'react';

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

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            let url = `/api/calendar?month=${year}-${month}`;
            if (selectedUserId) url += `&userId=${selectedUserId}`;
            
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                const enriched = data.map((e: CalendarEvent) => {
                    const u = users.find(user => String(user.id) === String(e.userId));
                    return { ...e, userName: u ? u.name : 'Sconosciuto' };
                });
                setEvents(enriched);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [currentDate, selectedUserId, users]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleDeleteEvent = async (id: string) => {
        if (!confirm('Eliminare questo evento?')) return;
        try {
            const res = await fetch(`/api/calendar?id=${id}`, { method: 'DELETE' });
            if (res.ok) fetchEvents();
        } catch {
            alert('Errore eliminazione');
        }
    };

    const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
        "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

    const handlePrevMonth = () => {
        setCurrentDate(prev => {
            const next = new Date(prev);
            next.setMonth(prev.getMonth() - 1);
            return next;
        });
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => {
            const next = new Date(prev);
            next.setMonth(prev.getMonth() + 1);
            return next;
        });
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'FERIE':
                return 'bg-tertiary/10 text-tertiary';
            case 'MALATTIA':
                return 'bg-error/10 text-error';
            case 'TURNO':
                return 'bg-primary/10 text-primary';
            default:
                return 'bg-secondary/10 text-secondary';
        }
    };

    return (
        <div>
            {/* Controls */}
            <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-3 py-2 shadow-sm">
                    <button onClick={handlePrevMonth} className="p-1 rounded-lg hover:bg-surface-container-low transition-colors" title="Mese precedente">
                        <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                    </button>
                    <span className="font-bold text-on-surface text-sm min-w-[150px] text-center">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </span>
                    <button onClick={handleNextMonth} className="p-1 rounded-lg hover:bg-surface-container-low transition-colors" title="Mese successivo">
                        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                    </button>
                </div>
                <select 
                    value={selectedUserId} 
                    onChange={e => setSelectedUserId(e.target.value)} 
                    className="rounded-lg border-outline-variant px-3 py-2 text-sm bg-white min-w-[180px]"
                    title="Filtra per dipendente"
                >
                    <option value="">Tutti i dipendenti</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
            </div>

            {/* Events Table */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span>
                </div>
            ) : events.length === 0 ? (
                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-12 text-center shadow-sm">
                    <span className="material-symbols-outlined text-5xl text-secondary mb-3">event_busy</span>
                    <h4 className="font-bold text-on-surface text-lg mb-1">Nessun evento</h4>
                    <p className="text-secondary text-sm">Nessun evento registrato per questo mese.</p>
                </div>
            ) : (
                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-surface-container-low border-b border-outline-variant/20">
                                    <th className="text-left px-5 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Data</th>
                                    <th className="text-left px-5 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Dipendente</th>
                                    <th className="text-left px-5 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Tipo</th>
                                    <th className="text-left px-5 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Titolo / Note</th>
                                    <th className="text-left px-5 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Azioni</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10">
                                {events.sort((a, b) => a.date.localeCompare(b.date)).map(e => (
                                    <tr key={e.id} className="hover:bg-surface-container-low transition-colors">
                                        <td className="px-5 py-3">
                                            <p className="font-bold text-on-surface">{new Date(e.date).toLocaleDateString('it-IT')}</p>
                                            <p className="text-xs text-secondary">
                                                ore {new Date(e.date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </td>
                                        <td className="px-5 py-3 font-bold text-on-surface">{e.userName}</td>
                                        <td className="px-5 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${getTypeBadge(e.type)}`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                {e.type}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-on-surface">{e.title}</td>
                                        <td className="px-5 py-3">
                                            <button 
                                                onClick={() => handleDeleteEvent(e.id)} 
                                                className="p-1.5 rounded-lg hover:bg-error/10 text-error transition-colors"
                                                title="Elimina evento"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
