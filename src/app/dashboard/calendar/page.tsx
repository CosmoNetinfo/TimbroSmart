'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Sun, Heart, Clock, Sparkles } from 'lucide-react';

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
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
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

    const handleLogout = () => {
        localStorage.removeItem('user_meta');
        router.push('/');
    };

    // Calendar logic
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    // JS getDay() -> 0: Sun, 1: Mon. We want 0: Mon, 6: Sun for European calendar
    const firstDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const prevMonthLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();

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

    const handleDayClick = (dateStr: string) => {
        setSelectedDate(dateStr);
    };

    const selectedDayEvents = selectedDate ? events.filter(e => e.date === selectedDate) : [];

    return (
        <div className="bg-surface font-body text-on-surface min-h-screen">
            {/* TopAppBar */}
            <header className="w-full top-0 sticky z-40 bg-[#f6fafe] dark:bg-slate-950 flex items-center justify-between px-6 h-16 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/dashboard')} className="transition-all duration-200 active:scale-95 text-slate-500 dark:text-slate-400">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>arrow_back</span>
                    </button>
                    <h1 className="font-headline font-bold tracking-tight text-xl text-[#171c1f] dark:text-slate-100">Calendario</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowModal(true)} className="flex items-center justify-center p-2 rounded-full bg-primary-container text-on-primary-container active:scale-95 transition-all">
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
                    </button>
                </div>
            </header>

            <main className="pb-28 max-w-4xl mx-auto px-4 md:px-6">
                {/* Month Selector Hero Area */}
                <section className="py-8 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="font-label text-xs uppercase tracking-widest text-secondary font-semibold">TimbroSmart Ecosystem</span>
                        <h2 className="font-headline text-3xl font-extrabold text-on-surface mt-1">
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h2>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handlePrevMonth} className="h-10 w-10 flex items-center justify-center rounded-xl bg-surface-container-low transition-all active:scale-90 text-primary">
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <button onClick={handleNextMonth} className="h-10 w-10 flex items-center justify-center rounded-xl bg-surface-container-low transition-all active:scale-90 text-primary">
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                </section>

                {/* Bento Grid Calendar */}
                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-surface-container-lowest rounded-xl p-4 md:p-6 shadow-sm">
                        {/* Day Names */}
                        <div className="grid grid-cols-7 mb-4">
                            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (
                                <div key={d} className="text-center font-label text-[11px] font-bold text-secondary uppercase tracking-tighter">{d}</div>
                            ))}
                        </div>

                        {/* Calendar Days */}
                        <div className="grid grid-cols-7 gap-[1px] bg-surface-container-high rounded-lg overflow-hidden border border-surface-container-high">
                            {/* Previous Month */}
                            {Array.from({ length: firstDayIndex }).map((_, i) => {
                                const prevDay = prevMonthLastDay - firstDayIndex + i + 1;
                                return (
                                    <div key={`prev-${i}`} className="bg-surface-container-low min-h-[70px] md:min-h-[90px] p-1 md:p-2 flex flex-col items-end opacity-40">
                                        <span className="text-xs font-medium">{prevDay}</span>
                                    </div>
                                );
                            })}

                            {/* Current Month */}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const dayEvents = events.filter(e => e.date === dateStr);
                                const isSelected = selectedDate === dateStr;
                                const isToday = dateStr === new Date().toISOString().split('T')[0];

                                return (
                                    <div 
                                        key={day} 
                                        onClick={() => handleDayClick(dateStr)}
                                        className={`bg-surface-container-lowest min-h-[70px] md:min-h-[90px] p-1 md:p-2 flex flex-col items-end relative cursor-pointer
                                            ${isSelected ? 'ring-2 ring-primary ring-inset z-10 bg-primary/5' : 'hover:bg-slate-50 transition-colors'}
                                        `}
                                    >
                                        <span className={`text-xs ${isToday ? 'font-bold text-primary flex items-center justify-center h-5 w-5 bg-primary-container/20 rounded-full' : 'font-medium'}`}>
                                            {day}
                                        </span>
                                        <div className="mt-auto w-full space-y-1">
                                            {dayEvents.map(e => (
                                                <div key={e.id} className={`h-1.5 w-full rounded-full ${
                                                    e.type === 'FERIE' ? 'bg-tertiary-container' : 
                                                    e.type === 'MALATTIA' ? 'bg-error' : 
                                                    e.type === 'TURNO' ? 'bg-primary-container' : 'bg-orange-400'
                                                }`} title={e.title}></div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-primary-container"></span>
                                <span className="text-[11px] font-medium text-secondary">Turno / Lavoro</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-tertiary-container"></span>
                                <span className="text-[11px] font-medium text-secondary">Ferie</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-error"></span>
                                <span className="text-[11px] font-medium text-secondary">Malattia</span>
                            </div>
                             <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-orange-400"></span>
                                <span className="text-[11px] font-medium text-secondary">Altro</span>
                            </div>
                        </div>
                    </div>

                    {/* Dettaglio Giorno Section */}
                    {selectedDate && (
                        <section className="space-y-4 animate-slide-up bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-slate-100 mt-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-headline font-bold text-xl">Dettaglio Giorno</h3>
                                <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                                    {new Date(selectedDate).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </span>
                            </div>
                            
                            {selectedDayEvents.length === 0 ? (
                                <p className="text-sm text-secondary py-4 text-center">Nessun evento registrato in questa data.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedDayEvents.map(e => (
                                        <div key={e.id} className="bg-surface-container-lowest p-5 rounded-xl border-l-4 shadow-sm" style={{ 
                                            borderColor: e.type === 'FERIE' ? 'var(--tertiary-container)' : 
                                                        e.type === 'MALATTIA' ? 'var(--error)' : 
                                                        e.type === 'TURNO' ? 'var(--primary-container)' : '#fbbf24'
                                        }}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <span className="font-label text-[10px] font-bold text-secondary uppercase tracking-widest">{e.type}</span>
                                                    <h4 className="font-headline font-bold text-lg">{e.title}</h4>
                                                </div>
                                                <button onClick={() => handleDeleteEvent(e.id)} className="text-secondary hover:text-error transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                            {e.description && (
                                                <div className="space-y-3">
                                                    <div className="flex items-start gap-3">
                                                        <div className="bg-surface-container-low p-2 rounded-lg">
                                                            <span className="material-symbols-outlined text-sm">notes</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-secondary leading-none mb-1">Note</p>
                                                            <p className="text-sm">{e.description}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </main>

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                    <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md animate-slide-up">
                        <h3 className="font-headline font-bold text-xl mb-4">Nuovo Evento</h3>
                        <form onSubmit={handleAddEvent}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-secondary mb-1">Titolo</label>
                                <input type="text" className="w-full rounded-lg border-outline-variant p-3 focus:ring-primary focus:border-primary" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} placeholder="Es. Visita medica" required />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-secondary mb-1">Tipo</label>
                                <select value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value as any})} className="w-full rounded-lg border-outline-variant p-3 focus:ring-primary focus:border-primary">
                                    <option value="FERIE">Ferie</option>
                                    <option value="MALATTIA">Malattia</option>
                                    <option value="TURNO">Turno/Straordinario</option>
                                    <option value="ALTRO">Altro</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-secondary mb-1">Data</label>
                                <input type="date" className="w-full rounded-lg border-outline-variant p-3 focus:ring-primary focus:border-primary" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} required />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-secondary mb-1">Note (opzionale)</label>
                                <textarea className="w-full rounded-lg border-outline-variant p-3 focus:ring-primary focus:border-primary" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} rows={3} />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-outline-variant text-secondary font-medium hover:bg-slate-50 transition-colors">Annulla</button>
                                <button type="submit" className="flex-1 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors">Salva</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-[#c3c6d6]/20 shadow-[0_-12px_32px_rgba(23,28,31,0.06)] z-50 rounded-t-2xl">
                <Link href="/dashboard" className="flex flex-col items-center justify-center text-slate-500 px-4 py-1 transition-transform duration-300 active:scale-90 hover:text-primary">
                    <span className="material-symbols-outlined">dashboard</span>
                    <span className="font-label text-[11px] font-medium">Dashboard</span>
                </Link>
                <Link href="/dashboard/history" className="flex flex-col items-center justify-center text-slate-500 px-4 py-1 transition-transform duration-300 active:scale-90 hover:text-primary">
                    <span className="material-symbols-outlined">history</span>
                    <span className="font-label text-[11px] font-medium">Storico</span>
                </Link>
                <div className="flex flex-col items-center justify-center bg-[#e4e9ed] text-primary rounded-xl px-4 py-1 transition-transform duration-300 active:scale-90">
                    <span className="material-symbols-outlined">calendar_month</span>
                    <span className="font-label text-[11px] font-medium">Richieste</span>
                </div>
                <div onClick={handleLogout} className="cursor-pointer flex flex-col items-center justify-center text-slate-500 px-4 py-1 transition-transform duration-300 active:scale-90 hover:text-primary">
                    <span className="material-symbols-outlined">logout</span>
                    <span className="font-label text-[11px] font-medium">Esci</span>
                </div>
            </nav>
        </div>
    );
}
