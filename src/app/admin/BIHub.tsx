'use client';
import { useMemo } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, Cell, PieChart, Pie, ComposedChart, Line, Legend 
} from 'recharts';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subDays } from 'date-fns';
import { it } from 'date-fns/locale';

interface BIHubProps {
    entries: any[];
    users: any[];
    companyPlan: string;
}

export default function BIHub({ entries, users, companyPlan }: BIHubProps) {
    const isEnterprise = companyPlan === 'ENTERPRISE';

    // 1. Dati per Trend Settimanale (Ultimi 7 giorni)
    const weeklyTrendData = useMemo(() => {
        const last7Days = eachDayOfInterval({
            start: subDays(new Date(), 6),
            end: new Date()
        });

        return last7Days.map(day => {
            const dayEntries = entries.filter(e => isSameDay(new Date(e.timestamp), day));
            let dailyHours = 0;
            
            // Semplice calcolo ore per il grafico (IN/OUT consecutivi)
            const sortedEntries = [...dayEntries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            for (let i = 0; i < sortedEntries.length; i++) {
                if (sortedEntries[i].type === 'IN' && i + 1 < sortedEntries.length && sortedEntries[i+1].type === 'OUT') {
                    const start = new Date(sortedEntries[i].timestamp).getTime();
                    const end = new Date(sortedEntries[i+1].timestamp).getTime();
                    dailyHours += (end - start) / (1000 * 60 * 60);
                    i++;
                }
            }

            return {
                name: format(day, 'EEE dd', { locale: it }),
                ore: parseFloat(dailyHours.toFixed(1))
            };
        });
    }, [entries]);

    // 2. Dati per Proiezione Costi vs Ore
    const costData = useMemo(() => {
        const userStats: Record<string, { hours: number, cost: number, name: string }> = {};
        
        entries.forEach(e => {
            if (!userStats[e.userId]) {
                userStats[e.userId] = { hours: 0, cost: 0, name: e.user?.name || 'Dipendente' };
            }
        });

        // Calcolo semplificato per dipendente
        Object.keys(userStats).forEach(uid => {
            const userEntries = entries.filter(e => e.userId === uid).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            let hours = 0;
            for (let i = 0; i < userEntries.length; i++) {
                if (userEntries[i].type === 'IN' && i + 1 < userEntries.length && userEntries[i+1].type === 'OUT') {
                    hours += (new Date(userEntries[i+1].timestamp).getTime() - new Date(userEntries[i].timestamp).getTime()) / (1000 * 60 * 60);
                    i++;
                }
            }
            const wage = users.find(u => u.id === uid)?.hourlyWage || 7;
            userStats[uid].hours = hours;
            userStats[uid].cost = hours * wage;
        });

        return Object.values(userStats).map(s => ({
            name: s.name.split(' ')[0],
            ore: parseFloat(s.hours.toFixed(1)),
            costo: parseFloat(s.cost.toFixed(2))
        })).slice(0, 6); // Top 6 per leggibilità
    }, [entries, users]);

    // 3. Distribuzione Oraria (Peak Times)
    const hourlyDistribution = useMemo(() => {
        const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
        entries.forEach(e => {
            const h = new Date(e.timestamp).getHours();
            hours[h].count++;
        });
        return hours.filter(h => h.count > 0 || (h.hour > 7 && h.hour < 20));
    }, [entries]);

    // 4. Saturazione (Pie Chart)
    const saturationData = useMemo(() => {
        const data = costData.map(d => ({ name: d.name, value: d.ore }));
        return data.sort((a, b) => b.value - a.value).slice(0, 5);
    }, [costData]);

    const COLORS = ['#0056d2', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

    if (!isEnterprise) {
        return (
            <div className="relative overflow-hidden bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-12 text-center shadow-xl">
                {/* Overlay di Blocco per simulazione valore Enterprise */}
                <div className="absolute inset-0 bg-white/40 backdrop-blur-md z-10 flex flex-col items-center justify-center p-8">
                    <div className="bg-amber-100 text-amber-700 p-4 rounded-full mb-6">
                        <span className="material-symbols-outlined text-5xl">workspace_premium</span>
                    </div>
                    <h2 className="font-headline text-3xl font-extrabold text-on-surface mb-3">Sblocca Business Intelligence</h2>
                    <p className="max-w-md text-secondary text-sm mb-8">
                        Il piano Enterprise offre grafici avanzati, analisi dei costi in tempo reale e proiezioni di budget per ottimizzare la tua azienda.
                    </p>
                    <button className="px-8 py-4 rounded-2xl bg-amber-600 text-white font-bold text-lg shadow-lg shadow-amber-200 active:scale-95 transition-all">
                        Passa a Enterprise
                    </button>
                    <p className="mt-6 text-[10px] text-secondary font-bold uppercase tracking-widest">Disponibile solo per clienti Platinum</p>
                </div>

                {/* Antefatto blurred dietro */}
                <div className="opacity-20 pointer-events-none grayscale">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="h-40 bg-slate-100 rounded-2xl"></div>
                        <div className="h-40 bg-slate-100 rounded-2xl"></div>
                        <div className="h-40 bg-slate-100 rounded-2xl"></div>
                        <div className="h-40 bg-slate-100 rounded-2xl"></div>
                     </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-slide-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Area Chart: Trend Settimanale */}
                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-on-surface flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">trending_up</span> Trend Ore Settimanali
                        </h3>
                        <span className="bg-primary/10 text-primary text-[10px] font-extrabold px-2 py-1 rounded-md uppercase">Live</span>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={weeklyTrendData}>
                                <defs>
                                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0056d2" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#0056d2" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} unit="h" />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="ore" stroke="#0056d2" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Composed Chart: Costi vs Ore */}
                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-on-surface mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-tertiary">monetization_on</span> Proiezione Costo Lavoro
                    </h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={costData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} unit="h" />
                                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={10} tickLine={false} axisLine={false} unit="€" />
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                <Bar yAxisId="left" dataKey="ore" fill="#0056d2" radius={[4, 4, 0, 0]} barSize={30} name="Ore Totali" />
                                <Line yAxisId="right" type="monotone" dataKey="costo" stroke="#10b981" strokeWidth={3} name="Costo (€)" dot={{ r: 4, fill: '#10b981' }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Bar Chart: Distribuzione Oraria */}
                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-on-surface mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary">update</span> Affluenza per Orario
                    </h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hourlyDistribution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="hour" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(h) => `${h}:00`} />
                                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip labelFormatter={(h) => `Ore ${h}:00`} />
                                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Timbrature" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4. Pie Chart: saturazione */}
                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-on-surface mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500">pie_chart</span> Saturazione Dipendenti
                    </h3>
                    <div className="h-[250px] w-full flex items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={saturationData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                >
                                    {saturationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}
