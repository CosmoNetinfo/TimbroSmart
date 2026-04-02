'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface HistoryEntry {
    type: 'IN' | 'OUT';
    timestamp: string;
}

interface DashboardUser {
    id: number;
    name: string;
    code: string;
    profileImage?: string;
}

export default function HistoryPage() {
    const [entries, setEntries] = useState<HistoryEntry[]>([]);
    const [hourlyWage, setHourlyWage] = useState<number>(7.0);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const [user, setUser] = useState<DashboardUser | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('user_meta');
        if (!stored) {
            router.push('/');
            return;
        }
        try {
            const parsedUser = JSON.parse(stored);
            setUser(parsedUser);
            fetchHistory(parsedUser.id);
        } catch {
            router.push('/');
        }
    }, [router]);

    const fetchHistory = async (userId: number) => {
        try {
            const res = await fetch(`/api/history?userId=${userId}&t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setEntries(data);
                } else {
                    setEntries(data.entries ?? []);
                    setHourlyWage(data.hourlyWage ?? 7.0);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const historyData = useMemo(() => {
        const sorted = [...entries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        const shifts: { dateObj: Date; date: string; start: string; end: string; hours: number; euros: number }[] = [];
        let totalHoursAllTime = 0;
        let totalEurosAllTime = 0;

        for (let i = 0; i < sorted.length; i++) {
            const current = sorted[i];
            const next = sorted[i + 1];

            const start = new Date(current.timestamp);
            const dateStr = start.toLocaleDateString('it-IT');
            const timeStart = start.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

            if (current.type === 'IN' && next && next.type === 'OUT') {
                const end = new Date(next.timestamp);
                const timeEnd = end.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
                const diff = end.getTime() - start.getTime();
                const hours = Math.max(0, diff / (1000 * 60 * 60));
                const euros = hours * hourlyWage;

                shifts.push({
                    dateObj: start,
                    date: dateStr,
                    start: timeStart,
                    end: timeEnd,
                    hours,
                    euros,
                    type: 'SHIFT'
                } as any);

                totalHoursAllTime += hours;
                totalEurosAllTime += euros;
                i++; 
            } else {
                shifts.push({
                    dateObj: start,
                    date: dateStr,
                    start: timeStart,
                    end: current.type === 'IN' ? 'In corso...' : '---',
                    hours: 0,
                    euros: 0,
                    type: current.type
                } as any);
            }
        }

        const weeksMap = new Map<string, { label: string; totalHours: number; totalEuros: number; shifts: typeof shifts }>();

        shifts.forEach(shift => {
            const d = new Date(shift.dateObj);
            const day = d.getDay();
            const diffDays = d.getDate() - day + (day === 0 ? -6 : 1);

            const monday = new Date(d);
            monday.setDate(diffDays);
            monday.setHours(0, 0, 0, 0);

            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);

            const key = monday.toISOString().split('T')[0];
            const label = `${monday.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} - ${sunday.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}`;

            if (!weeksMap.has(key)) {
                weeksMap.set(key, { label, totalHours: 0, totalEuros: 0, shifts: [] });
            }

            const week = weeksMap.get(key)!;
            week.shifts.push(shift);
            week.totalHours += shift.hours;
            week.totalEuros += shift.euros;
        });

        const weeks = Array.from(weeksMap.entries())
            .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
            .map(([_key, val]) => {
                val.shifts.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
                return val;
            });

        return { weeks, totalHoursAllTime, totalEurosAllTime };
    }, [entries, hourlyWage]);

    const formatDuration = (decimalHours: number) => {
        const h = Math.floor(decimalHours);
        const m = Math.round((decimalHours - h) * 60);
        return `${h}h ${m}m`;
    };

    const fmtEur = (val: number) =>
        val.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });

    const handleLogout = () => {
        localStorage.removeItem('user_meta');
        router.push('/');
    };

    if (!user) return null;

    return (
        <div className="bg-surface font-body text-on-surface min-h-screen pb-28">
            
            {/* TopAppBar */}
            <header className="w-full top-0 sticky z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-6 h-16 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <div className="flex flex-col">
                        <span className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold">TimbroSmart</span>
                        <h1 className="font-headline font-bold text-lg text-on-surface leading-none">Storico Timbrature</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 md:px-6 pt-6">
                
                {/* Hero Total Container */}
                <div className="mb-8 animate-slide-up">
                    <div className="bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-3xl p-6 relative overflow-hidden shadow-md flex flex-col min-h-[140px]">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2"></div>
                        <p className="font-label text-xs uppercase tracking-widest font-bold opacity-80 mb-2">Totale Generale Mese</p>
                        
                        <div className="flex items-end gap-4 mt-auto">
                            <div>
                                <h2 className="font-headline text-4xl font-extrabold tracking-tight">
                                    {formatDuration(historyData.totalHoursAllTime)}
                                </h2>
                                <p className="opacity-90 font-medium text-sm mt-1">Ore Lavorate</p>
                            </div>
                            <div className="h-10 w-px bg-on-primary/20"></div>
                            <div>
                                <div className="text-2xl font-bold text-[#fde047]">
                                    {fmtEur(historyData.totalEurosAllTime)}
                                </div>
                                <p className="opacity-90 font-medium text-sm">Tariffa {fmtEur(hourlyWage)}/h</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* History List */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span>
                        </div>
                    ) : historyData.weeks.length === 0 ? (
                        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-8 text-center shadow-sm">
                            <span className="material-symbols-outlined text-4xl text-secondary mb-2">history_toggle_off</span>
                            <h3 className="font-bold text-lg text-on-surface mb-1">Nessuna timbratura</h3>
                            <p className="text-secondary text-sm">Non hai ancora registrato nessun turno di lavoro.</p>
                        </div>
                    ) : (
                        historyData.weeks.map((week, idx) => (
                            <div key={idx} className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm animate-slide-up" style={{ animationDelay: `${(idx + 1) * 100}ms` }}>
                                
                                {/* Week Header */}
                                <div className="bg-surface-container-low px-5 py-3 flex justify-between items-center border-b border-outline-variant/30">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-secondary">date_range</span>
                                        <h3 className="font-bold text-sm text-on-surface">{week.label}</h3>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <div className="font-bold text-primary text-sm flex gap-1 items-center">
                                            <span className="material-symbols-outlined text-[16px]">schedule</span>
                                            {formatDuration(week.totalHours)}
                                        </div>
                                        <div className="font-bold text-[#d97706] text-sm flex gap-1 items-center">
                                             <span className="material-symbols-outlined text-[16px]">payments</span>
                                            {fmtEur(week.totalEuros)}
                                        </div>
                                    </div>
                                </div>

                                {/* Shifts */}
                                <div className="divide-y divide-outline-variant/20">
                                    {week.shifts.map((shift, sIdx) => (
                                        <div key={sIdx} className="p-4 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined">work_history</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-on-surface text-sm">{shift.date}</p>
                                                    <p className="text-secondary text-xs flex items-center gap-1 mt-0.5">
                                                        <span className="w-2 h-2 rounded-full bg-green-500"></span> {shift.start}
                                                        <span className="mx-1 text-secondary/50">→</span>
                                                        <span className={`w-2 h-2 rounded-full ${shift.type === 'IN' ? 'bg-orange-500 animate-pulse' : 'bg-red-500'}`}></span> {shift.end}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className="font-bold text-on-surface text-sm">{formatDuration(shift.hours)}</p>
                                                <p className="text-[#d97706] font-medium text-xs mt-0.5">{fmtEur(shift.euros)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-2 pb-6 pt-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-[#c3c6d6]/20 shadow-[0_-12px_32px_rgba(23,28,31,0.06)] z-50 rounded-t-2xl">
                <Link href="/dashboard" className="cursor-pointer flex flex-col items-center justify-center text-slate-500 hover:text-primary px-2 py-1 transition-transform duration-300 active:scale-95">
                    <span className="material-symbols-outlined">home</span>
                    <span className="font-label text-[10px] sm:text-[11px] font-medium">Home</span>
                </Link>
                <Link href="/dashboard/calendar" className="flex flex-col items-center justify-center text-slate-500 hover:text-primary px-2 py-1 transition-transform duration-300 active:scale-95">
                    <span className="material-symbols-outlined">event_note</span>
                    <span className="font-label text-[10px] sm:text-[11px] font-medium">Ferie</span>
                </Link>
                <div className="flex flex-col items-center justify-center bg-[#e4e9ed] text-primary rounded-xl px-3 py-1 transition-transform duration-300 active:scale-95">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
                    <span className="font-label text-[10px] sm:text-[11px] font-bold">Storico</span>
                </div>
                <Link href="/dashboard/payments" className="flex flex-col items-center justify-center text-slate-500 hover:text-primary px-2 py-1 transition-transform duration-300 active:scale-95">
                    <span className="material-symbols-outlined">account_balance_wallet</span>
                    <span className="font-label text-[10px] sm:text-[11px] font-medium">Paga</span>
                </Link>
                <div onClick={handleLogout} className="cursor-pointer flex flex-col items-center justify-center text-slate-500 hover:text-primary px-2 py-1 transition-transform duration-300 active:scale-95">
                    <span className="material-symbols-outlined">logout</span>
                    <span className="font-label text-[10px] sm:text-[11px] font-medium">Esci</span>
                </div>
            </nav>
        </div>
    );
}
