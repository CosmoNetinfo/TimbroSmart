'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PaymentsManagement from './PaymentsManagement';
import AdminCalendar from './AdminCalendar';
import LicenseManagement from './LicenseManagement';


interface AdminUser {
    id: string | number;
    name: string;
    code: string;
    hourlyWage?: number;
}

interface AdminEntry {
    id: string | number;
    userId: string | number;
    type: 'IN' | 'OUT';
    timestamp: string;
    hasPhoto: boolean;
    photoUrl?: string;
    user: AdminUser;
}

type AdminView = 'dashboard' | 'users' | 'payments' | 'calendar' | 'license' | 'settings';

export default function Admin() {
    const router = useRouter();
    const [entries, setEntries] = useState<AdminEntry[]>([]);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');

    const [activeView, setActiveView] = useState<AdminView>('dashboard');
    const [companyPlan, setCompanyPlan] = useState<string>('FREE');
    const [companyName, setCompanyName] = useState<string>('TimbroSmart');
    const [newCompanyName, setNewCompanyName] = useState('');
    const [needsCompanyName, setNeedsCompanyName] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // New User State
    const [showAddUser, setShowAddUser] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    const [newUserCode, setNewUserCode] = useState('');
    const [newUserWage, setNewUserWage] = useState('7');
    const [creatingUser, setCreatingUser] = useState(false);

    // Edit Feature State
    const [editingEntry, setEditingEntry] = useState<AdminEntry | null>(null);
    const [editTimestamp, setEditTimestamp] = useState('');

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const fetchCompanyData = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/company');
            if (res.ok) {
                const data = await res.json();
                if (data.name) {
                    setCompanyName(data.name);
                    setNewCompanyName(data.name);
                    if (data.name === 'TimbroSmart') {
                        setNeedsCompanyName(true);
                    }
                } else {
                    setNeedsCompanyName(true);
                }
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    const fetchCompanyPlan = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/license');
            if (res.ok) {
                const data = await res.json();
                if (data.currentPlan) setCompanyPlan(data.currentPlan);
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    const fetchEntries = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', new Date(startDate).toISOString());
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                params.append('endDate', end.toISOString());
            }
            if (selectedUserId) params.append('userId', selectedUserId);

            const res = await fetch(`/api/admin/entries?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setEntries(data);
            } else {
                const err = await res.json();
                alert(`Errore nel caricamento: ${err.error || 'Server error'}`);
            }
        } catch {
            alert('Errore di connessione al server');
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, selectedUserId]);

    useEffect(() => {
        const stored = localStorage.getItem('user_meta');
        if (!stored) {
            router.push('/');
            return;
        }
        const user = JSON.parse(stored);
        if (user.role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }

        fetchUsers();
        fetchEntries();
        fetchCompanyPlan();
        fetchCompanyData();
    }, [fetchUsers, fetchEntries, fetchCompanyPlan, fetchCompanyData, router]);

    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [loadingPhoto, setLoadingPhoto] = useState(false);

    const handleOpenPhoto = async (id: string | number) => {
        setLoadingPhoto(true);
        try {
            const res = await fetch(`/api/admin/get-photo?id=${id}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedPhoto(data.photoUrl);
            } else {
                alert('Impossibile caricare la foto');
            }
        } catch {
            alert('Errore di connessione');
        } finally {
            setLoadingPhoto(false);
        }
    };

    const handleDelete = async (id: string | number) => {
        if (!confirm('Sei sicuro di voler eliminare questa timbratura?')) return;

        try {
            const res = await fetch(`/api/admin/delete-entry?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchEntries();
            } else {
                alert('Errore durante l\'eliminazione');
            }
        } catch {
            alert('Errore di connessione');
        }
    };

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        fetchEntries();
    };

    const handleReset = () => {
        setStartDate('');
        setEndDate('');
        setSelectedUserId('');
        window.location.reload();
    };

    const [newAdminCode, setNewAdminCode] = useState('');

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingUser(true);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: newUserName, 
                    code: newUserCode, 
                    hourlyWage: newUserWage 
                }),
            });

            if (res.ok) {
                alert('Dipendente creato con successo!');
                setNewUserName('');
                setNewUserCode('');
                setShowAddUser(false);
                fetchUsers();
            } else {
                const data = await res.json();
                alert(data.error || 'Errore creazione dipendente');
            }
        } catch {
            alert('Errore di connessione');
        } finally {
            setCreatingUser(false);
        }
    };

    const handleDeleteUser = async (userId: string | number) => {
        if (!confirm('Sei sicuro di voler eliminare questo dipendente?')) return;
        try {
            const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });
            if (res.ok) {
                fetchUsers();
            } else {
                alert('Errore durante la rimozione');
            }
        } catch {
            alert('Errore di connessione');
        }
    };

    const handleUpdateCompanyName = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCompanyName) return;

        try {
            const res = await fetch('/api/admin/company', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyName: newCompanyName }),
            });

            if (res.ok) {
                setCompanyName(newCompanyName);
                setNeedsCompanyName(false);
                alert('Nome azienda aggiornato con successo!');
            } else {
                const data = await res.json();
                alert(`Errore: ${data.error || 'Impossibile aggiornare'}`);
            }
        } catch {
            alert('Errore di connessione');
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAdminCode) return;

        try {
            const stored = localStorage.getItem('user_meta');
            if (!stored) return;
            const user = JSON.parse(stored);

            const res = await fetch('/api/admin/update-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, newCode: newAdminCode }),
            });

            if (res.ok) {
                alert('Password aggiornata con successo! Effettua nuovamente il login.');
                handleLogout();
            } else {
                alert('Errore durante l\'aggiornamento');
            }
        } catch {
            alert('Errore di connessione');
        }
    };

    const handleUpdateWage = async (userId: string | number, wage: string) => {
        try {
            const res = await fetch('/api/admin/update-wage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, hourlyWage: wage }),
            });
            if (res.ok) {
                fetchUsers();
                fetchEntries();
            } else {
                alert('Errore aggiornamento stipendio');
            }
        } catch {
            alert('Errore di connessione');
        }
    };

    const handleEditClick = (entry: AdminEntry) => {
        setEditingEntry(entry);
        const date = new Date(entry.timestamp);
        const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        setEditTimestamp(localDate.toISOString().slice(0, 16));
    };

    const handleSaveEdit = async () => {
        if (!editingEntry || !editTimestamp) return;

        try {
            const res = await fetch('/api/admin/update-entry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingEntry.id,
                    timestamp: new Date(editTimestamp).toISOString()
                })
            });

            if (res.ok) {
                setEditingEntry(null);
                fetchEntries();
            } else {
                alert('Errore durante la modifica');
            }
        } catch {
            alert('Errore di connessione');
        }
    };

    const summary = useMemo(() => {
        const userEntries: Record<string, AdminEntry[]> = {};
        entries.forEach(e => {
            if (!userEntries[e.userId]) userEntries[e.userId] = [];
            userEntries[e.userId].push(e);
        });

        let totalHours = 0;
        const userSummaries = Object.values(userEntries).map(logs => {
            logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            let hours = 0;
            for (let i = 0; i < logs.length; i++) {
                if (logs[i].type === 'IN') {
                    if (i + 1 < logs.length && logs[i + 1].type === 'OUT') {
                        const start = new Date(logs[i].timestamp).getTime();
                        const end = new Date(logs[i + 1].timestamp).getTime();
                        hours += (end - start) / (1000 * 60 * 60);
                        i++;
                    }
                }
            }
            totalHours += hours;
            const wage = logs[0].user?.hourlyWage || 7;
            const salary = hours * wage;
            return {
                userId: logs[0].userId,
                name: logs[0].user?.name || 'Dipendente',
                hours: hours,
                salary: salary,
                wage: wage
            };
        });

        const totalSalary = userSummaries.reduce((acc, curr) => acc + curr.salary, 0);

        return {
            totalHours,
            totalSalary,
            userSummaries
        };
    }, [entries]);

    const handleExport = () => {
        if (entries.length === 0) return;

        const headers = ['ID', 'Data', 'Ora', 'Dipendente', 'Codice', 'Azione', 'Foto'];
        const csvContent = [
            headers.join(','),
            ...entries.map(e => {
                const date = new Date(e.timestamp);
                const dateStr = date.toLocaleDateString();
                const timeStr = date.toLocaleTimeString();
                return [
                    e.id,
                    dateStr,
                    timeStr,
                    `"${e.user.name}"`,
                    e.user.code,
                    e.type === 'IN' ? 'ENTRATA' : 'USCITA',
                    e.photoUrl ? 'SI' : 'NO'
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `report_lavori_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        if (companyPlan === 'FREE') {
            alert('L\'export PDF avanzato è una funzione PRO. Passa a un piano superiore per sbloccarla.');
            return;
        }
        if (entries.length === 0) return;

        interface JsPDFWithAutoTable extends jsPDF {
            lastAutoTable?: { finalY: number; };
        }

        const doc = new jsPDF() as JsPDFWithAutoTable;
        
        const drawBox = (x: number, y: number, w: number, h: number, label: string, content?: string | number) => {
            doc.setDrawColor(220);
            doc.rect(x, y, w, h);
            doc.setFontSize(6);
            doc.setTextColor(140);
            doc.setFont("helvetica", "normal");
            doc.text(label.toUpperCase(), x + 2, y + 3.5);
            if (content !== undefined) {
                doc.setFontSize(9);
                doc.setTextColor(0);
                doc.setFont("helvetica", "bold");
                const textWidth = doc.getTextWidth(String(content));
                const maxW = w - 4;
                let finalContent = String(content);
                if (textWidth > maxW) {
                    finalContent = doc.splitTextToSize(String(content), maxW)[0] + "...";
                }
                doc.text(finalContent, x + 2, y + 9);
            }
        };

        const monthYear = new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.setFont("helvetica", "bold");
        doc.text("CEDOLINO PAGA", 10, 10);

        const r1Y = 14;
        drawBox(10, r1Y, 80, 15, "Nome Azienda", companyName);
        drawBox(90, r1Y, 35, 7.5, "Posizione INPS Azienda", "1234567890");
        drawBox(125, r1Y, 35, 15, "Mese di retribuzione", monthYear);
        drawBox(90, r1Y + 7.5, 35, 7.5, "Posizione INAIL Azienda", "987654321");
        
        try {
            doc.addImage('/icons/app-icon-nobg.png', 'PNG', 175, 4, 15, 15, undefined, 'FAST');
        } catch (e) {
            console.warn("Logo not found, skipping", e);
        }

        doc.setFontSize(6);
        doc.setTextColor(180);
        doc.text("C.d.C. --------------------", 12, r1Y + 18);

        const r2Y = 36;
        drawBox(10, r2Y, 25, 12, "Cod. Dip.", "---");
        drawBox(35, r2Y, 50, 12, "Matricola", summary.userSummaries[0]?.userId.toString().slice(-8) || "---");
        drawBox(85, r2Y, 80, 12, "Cognome Nome", summary.userSummaries[0]?.name || "Dipendente");
        drawBox(165, r2Y, 35, 12, "Data assunzione", "01/01/2024");

        const r3Y = 44;
        drawBox(10, r3Y, 80, 12, "Indirizzo", "---");
        drawBox(90, r3Y, 40, 6, "Codice Fiscale", "---");
        drawBox(130, r3Y, 35, 6, "Codice Inps", "---");
        drawBox(165, r3Y, 35, 6, "Sede di Lavoro", "Sede Principale");
        drawBox(90, r3Y + 6, 40, 6, "Contratto di Lavoro", "Commercio");
        drawBox(130, r3Y + 6, 35, 6, "Qualifica", "Impiegato");
        drawBox(165, r3Y + 6, 35, 6, "Livello", "4");

        const r4Y = 58;
        drawBox(10, r4Y, 80, 10, "Modalità di pagamento", "Bonifico Bancario");
        drawBox(90, r4Y, 110, 10, "Riferimenti Bancari", "---");

        const r5Y = 70;
        drawBox(10, r5Y, 20, 10, "Sett. Retr.", "---");
        drawBox(30, r5Y, 20, 10, "GG. Retr.", "26");
        drawBox(50, r5Y, 30, 10, "GG. Lavorati", (summary.userSummaries[0]?.hours / 8).toFixed(0));
        drawBox(80, r5Y, 30, 10, "Ore Lavorate", summary.userSummaries[0]?.hours.toFixed(2));
        drawBox(110, r5Y, 45, 10, "Scatti Anzianità", "");
        doc.setFontSize(6);
        doc.text("n° --  Data --  Prossimo --", 112, r5Y + 8);
        drawBox(155, r5Y, 45, 10, "", "");

        const r6Y = 82;
        drawBox(10, r6Y, 30, 10, "Paga base", `€ ${summary.userSummaries[0]?.wage.toFixed(2)}`);
        drawBox(40, r6Y, 30, 10, "Ind. Contigenza", "---");
        drawBox(70, r6Y, 20, 10, "E.D.R", "---");
        drawBox(90, r6Y, 20, 10, "E.E.T", "---");
        drawBox(110, r6Y, 90, 10, "Ind. Terr. Settore", "---");

        const tableHeader = [['Data', 'Voci Variabili', 'Quantità', 'Trattenute', 'Competenze', 'Riferimento']];
        const tableBody = entries.map(e => [
            new Date(e.timestamp).toLocaleDateString(),
            e.type === 'IN' ? 'ENTRATA' : 'USCITA',
            '1.00', '', '',
            new Date(e.timestamp).toLocaleTimeString()
        ]);

        autoTable(doc, {
            startY: 96,
            head: tableHeader,
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [248, 250, 252] as [number, number, number], textColor: [71, 85, 105] as [number, number, number], fontSize: 7, fontStyle: 'bold', lineWidth: 0.1 },
            bodyStyles: { fontSize: 8, textColor: [30, 41, 59], lineWidth: 0.1 },
            margin: { left: 10, right: 10 },
            tableWidth: 190,
        });

        const finalY = (doc.lastAutoTable?.finalY || 100) + 8;
        drawBox(10, finalY, 30, 15, "Comp. Tot.", `€ ${summary.userSummaries[0]?.salary.toFixed(2)}`);
        drawBox(40, finalY, 30, 15, "Tratt. Tot.", "€ 0,00");
        drawBox(70, finalY, 40, 15, "Arrotondamento", "0,00");

        doc.setDrawColor(59, 130, 246);
        doc.setFillColor(248, 250, 252);
        doc.rect(140, finalY, 60, 15, 'FD');
        doc.setFontSize(7);
        doc.setTextColor(59, 130, 246);
        doc.setFont("helvetica", "bold");
        doc.text("NETTO BUSTA", 145, finalY + 5);
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text(`€ ${summary.userSummaries[0]?.salary.toFixed(2)}`, 145, finalY + 11);

        doc.save(`busta_paga_${summary.userSummaries[0]?.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const handleLogout = () => {
        localStorage.removeItem('user_meta');
        router.push('/');
    };

    const navItems: { id: AdminView; icon: string; label: string }[] = [
        { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
        { id: 'users', icon: 'group', label: 'Dipendenti' },
        { id: 'payments', icon: 'payments', label: 'Pagamenti' },
        { id: 'calendar', icon: 'event_note', label: 'Calendario' },
        { id: 'license', icon: 'workspace_premium', label: 'Licenza' },
        { id: 'settings', icon: 'settings', label: 'Impostazioni' },
    ];

    return (
        <div className="bg-surface font-body text-on-surface min-h-screen flex">
            
            {/* Company Name Overlay */}
            {needsCompanyName && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                    <div className="bg-surface-container-lowest rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-slide-up border border-primary/20">
                        <div className="bg-primary-container p-4 rounded-2xl w-fit mx-auto mb-6 text-on-primary-container">
                            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>apartment</span>
                        </div>
                        <h2 className="font-headline text-2xl font-extrabold text-on-surface mb-2">Configura la tua Azienda</h2>
                        <p className="text-secondary text-sm mb-6">Benvenuto su TimbroSmart! Per iniziare, inserisci il nome della tua azienda.</p>
                        
                        <form onSubmit={handleUpdateCompanyName} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Es: Rossi Costruzioni S.r.l."
                                value={newCompanyName}
                                onChange={(e) => setNewCompanyName(e.target.value)}
                                className="w-full rounded-xl border-outline-variant p-4 text-center text-on-surface focus:ring-primary focus:border-primary bg-surface-container-lowest font-bold"
                                autoFocus
                                required
                            />
                            <button type="submit" className="w-full py-4 rounded-xl bg-primary text-white font-bold active:scale-95 transition-all shadow-md shadow-primary/20">
                                Salva e Inizia
                            </button>
                        </form>
                        <button onClick={handleLogout} className="mt-4 text-secondary text-sm hover:text-primary transition-colors">
                            Esci e torna al login
                        </button>
                    </div>
                </div>
            )}

            {/* Mobile Sidebar Toggle */}
            <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="fixed top-4 left-4 z-50 lg:hidden bg-white shadow-lg rounded-xl p-2.5 border border-outline-variant/30"
            >
                <span className="material-symbols-outlined">{sidebarOpen ? 'close' : 'menu'}</span>
            </button>

            {/* Sidebar */}
            <aside className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-white border-r border-outline-variant/20 flex flex-col z-40 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                {/* Sidebar Header */}
                <div className="p-6 border-b border-outline-variant/20">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary-container p-2 rounded-xl text-on-primary-container">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>fingerprint</span>
                        </div>
                        <div>
                            <h2 className="font-headline font-extrabold text-on-surface text-lg leading-none">{companyName}</h2>
                            <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                                companyPlan === 'FREE' ? 'bg-slate-100 text-slate-600' : 
                                companyPlan === 'PRO' ? 'bg-blue-100 text-blue-700' : 
                                'bg-amber-100 text-amber-700'
                            }`}>
                                {companyPlan}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sidebar Nav */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => { setActiveView(item.id); setSidebarOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                activeView === item.id
                                    ? 'bg-primary/10 text-primary font-bold shadow-sm'
                                    : 'text-secondary hover:bg-surface-container-low hover:text-on-surface'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[20px]" style={activeView === item.id ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-outline-variant/20">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-error hover:bg-error/5 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        Disconnettiti
                    </button>
                </div>
            </aside>

            {/* Backdrop for mobile sidebar */}
            {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            {/* Main Content */}
            <main className="flex-1 min-h-screen" style={{ opacity: needsCompanyName ? 0.3 : 1, pointerEvents: needsCompanyName ? 'none' : 'auto' }}>
                <div className="max-w-7xl mx-auto p-4 md:p-8">

                    {/* ═══════════════════ DASHBOARD VIEW ═══════════════════ */}
                    {activeView === 'dashboard' && (
                        <div className="animate-slide-up">
                            <div className="mb-8">
                                <h1 className="font-headline text-3xl font-extrabold text-on-surface">Dashboard</h1>
                                <p className="text-secondary">Panoramica generale dell&apos;attività aziendale.</p>
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 flex items-center gap-4 shadow-sm">
                                    <div className="p-3 bg-primary/10 text-primary rounded-xl">
                                        <span className="material-symbols-outlined text-[28px]">schedule</span>
                                    </div>
                                    <div>
                                        <p className="text-secondary text-xs font-bold uppercase tracking-wider">Ore Totali</p>
                                        <h2 className="font-headline text-2xl font-extrabold text-primary">{summary.totalHours.toFixed(1)}h</h2>
                                    </div>
                                </div>

                                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 flex items-center gap-4 shadow-sm">
                                    <div className="p-3 bg-tertiary/10 text-tertiary rounded-xl">
                                        <span className="material-symbols-outlined text-[28px]">euro</span>
                                    </div>
                                    <div>
                                        <p className="text-secondary text-xs font-bold uppercase tracking-wider">Stipendio Stimato</p>
                                        <h2 className="font-headline text-2xl font-extrabold text-tertiary">€{summary.totalSalary.toFixed(2)}</h2>
                                    </div>
                                </div>

                                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 flex items-center gap-4 shadow-sm">
                                    <div className="p-3 bg-secondary/10 text-secondary rounded-xl">
                                        <span className="material-symbols-outlined text-[28px]">group</span>
                                    </div>
                                    <div>
                                        <p className="text-secondary text-xs font-bold uppercase tracking-wider">Dipendenti</p>
                                        <h2 className="font-headline text-2xl font-extrabold text-on-surface">{users.length}</h2>
                                    </div>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 mb-8 shadow-sm">
                                <h3 className="font-bold text-on-surface mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">bar_chart</span> Ore per Dipendente
                                </h3>
                                <div className="w-full h-[300px]">
                                    {isMounted && (
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                            <BarChart data={summary.userSummaries}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} unit="h" />
                                                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,.08)' }} />
                                                <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
                                                    {summary.userSummaries.map((_entry, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0056d2' : '#3b82f6'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            {/* Filters & Table */}
                            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl overflow-hidden shadow-sm">
                                <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant/20">
                                    <form onSubmit={handleFilter} className="flex flex-wrap gap-3 items-end">
                                        <div className="flex-1 min-w-[140px]">
                                            <label className="block text-xs font-bold text-secondary mb-1">Dal</label>
                                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-lg border-outline-variant px-3 py-2 text-sm bg-white" />
                                        </div>
                                        <div className="flex-1 min-w-[140px]">
                                            <label className="block text-xs font-bold text-secondary mb-1">Al</label>
                                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-lg border-outline-variant px-3 py-2 text-sm bg-white" />
                                        </div>
                                        <div className="flex-1 min-w-[180px]">
                                            <label className="block text-xs font-bold text-secondary mb-1">Dipendente</label>
                                            <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="w-full rounded-lg border-outline-variant px-3 py-2 text-sm bg-white" title="Filtra per dipendente">
                                                <option value="">Tutti</option>
                                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex gap-2">
                                            <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">Filtra</button>
                                            <button type="button" onClick={handleReset} className="px-4 py-2 rounded-lg border border-outline-variant text-secondary text-sm font-medium hover:bg-surface-container-low transition-colors">Reset</button>
                                            <button type="button" onClick={handleExport} disabled={entries.length === 0} className="px-4 py-2 rounded-lg bg-tertiary/10 text-tertiary text-sm font-bold hover:bg-tertiary/20 transition-colors disabled:opacity-40">CSV</button>
                                            <button type="button" onClick={handleExportPDF} disabled={entries.length === 0} className="px-4 py-2 rounded-lg bg-error/10 text-error text-sm font-bold hover:bg-error/20 transition-colors disabled:opacity-40">PDF</button>
                                        </div>
                                    </form>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-surface-container-low border-b border-outline-variant/20">
                                                <th className="text-left px-5 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Data / Ora</th>
                                                <th className="text-left px-5 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Dipendente</th>
                                                <th className="text-left px-5 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Matricola</th>
                                                <th className="text-left px-5 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Stato</th>
                                                <th className="text-left px-5 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Azioni</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-outline-variant/10">
                                            {entries.map((entry) => (
                                                <tr key={entry.id} className="hover:bg-surface-container-low transition-colors">
                                                    <td className="px-5 py-3">
                                                        <p className="font-medium text-on-surface">{new Date(entry.timestamp).toLocaleDateString()}</p>
                                                        <p className="text-secondary text-xs">{new Date(entry.timestamp).toLocaleTimeString()}</p>
                                                    </td>
                                                    <td className="px-5 py-3 font-bold text-on-surface">{entry.user.name}</td>
                                                    <td className="px-5 py-3">
                                                        <span className="bg-surface-container-high px-2 py-1 rounded text-xs font-mono">{entry.user.code}</span>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        {entry.type === 'IN' ? (
                                                            <span className="inline-flex items-center gap-1 bg-tertiary/10 text-tertiary px-2.5 py-1 rounded-full text-xs font-bold">
                                                                <span className="w-1.5 h-1.5 bg-tertiary rounded-full"></span> ENTRATA
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 bg-error/10 text-error px-2.5 py-1 rounded-full text-xs font-bold">
                                                                <span className="w-1.5 h-1.5 bg-error rounded-full"></span> USCITA
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <div className="flex gap-1">
                                                            {entry.hasPhoto && (
                                                                <button onClick={() => handleOpenPhoto(entry.id)} disabled={loadingPhoto} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors" title="Vedi Foto">
                                                                    <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                                                                </button>
                                                            )}
                                                            <button onClick={() => handleEditClick(entry)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors" title="Modifica">
                                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                                            </button>
                                                            <button onClick={() => handleDelete(entry.id)} className="p-1.5 rounded-lg hover:bg-error/10 text-error transition-colors" title="Elimina">
                                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {entries.length === 0 && !loading && (
                                                <tr>
                                                    <td colSpan={5} className="px-5 py-16 text-center">
                                                        <span className="material-symbols-outlined text-4xl text-secondary mb-2">inbox</span>
                                                        <p className="text-secondary">Nessuna attività trovata.</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                    {loading && (
                                        <div className="py-16 flex justify-center">
                                            <span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════ USERS VIEW ═══════════════════ */}
                    {activeView === 'users' && (
                        <div className="animate-slide-up">
                            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                                <div>
                                    <h1 className="font-headline text-3xl font-extrabold text-on-surface">Dipendenti</h1>
                                    <p className="text-secondary">Gestione anagrafica e matricole.</p>
                                </div>
                                <button onClick={() => setShowAddUser(!showAddUser)} className="px-5 py-3 rounded-xl bg-primary text-white font-bold active:scale-95 transition-all shadow-md shadow-primary/20 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[20px]">{showAddUser ? 'close' : 'person_add'}</span>
                                    {showAddUser ? 'Annulla' : 'Aggiungi'}
                                </button>
                            </div>

                            {showAddUser && (
                                <div className="bg-surface-container-lowest border border-primary/20 rounded-2xl p-6 mb-6 shadow-sm animate-slide-up">
                                    <h4 className="font-bold text-on-surface mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">person_add</span> Nuovo Dipendente
                                    </h4>
                                    <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                        <div>
                                            <label className="block text-xs font-bold text-secondary mb-1">Nome Completo</label>
                                            <input type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Mario Rossi" required className="w-full rounded-lg border-outline-variant px-3 py-2.5 text-sm bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-secondary mb-1">Matricola (Codice)</label>
                                            <input type="text" value={newUserCode} onChange={e => setNewUserCode(e.target.value.toUpperCase())} placeholder="MR001" required className="w-full rounded-lg border-outline-variant px-3 py-2.5 text-sm bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-secondary mb-1">Paga Oraria (€/h)</label>
                                            <input type="number" value={newUserWage} onChange={e => setNewUserWage(e.target.value)} required className="w-full rounded-lg border-outline-variant px-3 py-2.5 text-sm bg-white" />
                                        </div>
                                        <button type="submit" disabled={creatingUser} className="px-5 py-2.5 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 disabled:opacity-50">
                                            {creatingUser ? 'Salvataggio...' : 'Salva'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {users.map(u => (
                                    <div key={u.id} className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-on-surface">{u.name}</p>
                                                    <p className="text-xs text-secondary">Matricola: <span className="font-mono text-primary font-bold">{u.code}</span></p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 rounded-lg hover:bg-error/10 text-error opacity-0 group-hover:opacity-100 transition-all" title="Elimina">
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                                            <span className="text-xs text-secondary">Paga Oraria</span>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs text-secondary">€</span>
                                                <input
                                                    type="number"
                                                    defaultValue={u.hourlyWage || 7}
                                                    onBlur={(e) => {
                                                        const val = e.target.value;
                                                        if (parseFloat(val) !== u.hourlyWage) {
                                                            handleUpdateWage(u.id, val);
                                                        }
                                                    }}
                                                    className="w-16 text-right font-bold rounded-lg border-outline-variant px-2 py-1 text-sm bg-white"
                                                    title="Paga oraria"
                                                />
                                                <span className="text-xs text-secondary">/h</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════ PAYMENTS VIEW ═══════════════════ */}
                    {activeView === 'payments' && (
                        <div className="animate-slide-up">
                            <div className="mb-8">
                                <h1 className="font-headline text-3xl font-extrabold text-on-surface">Gestione Pagamenti</h1>
                                <p className="text-secondary">Registra e consulta i compensi ai dipendenti.</p>
                            </div>
                            {companyPlan === 'FREE' ? (
                                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-8 text-center shadow-sm">
                                    <span className="material-symbols-outlined text-5xl text-secondary mb-3">lock</span>
                                    <h3 className="font-bold text-lg text-on-surface mb-2">Funzione PRO</h3>
                                    <p className="text-secondary text-sm mb-4">Passa al piano PRO per sbloccare la gestione pagamenti avanzata.</p>
                                    <button onClick={() => setActiveView('license')} className="px-6 py-3 rounded-xl bg-primary text-white font-bold">
                                        Gestisci Licenza
                                    </button>
                                </div>
                            ) : (
                                <PaymentsManagement users={users} />
                            )}
                        </div>
                    )}

                    {/* ═══════════════════ CALENDAR VIEW ═══════════════════ */}
                    {activeView === 'calendar' && (
                        <div className="animate-slide-up">
                            <div className="mb-8">
                                <h1 className="font-headline text-3xl font-extrabold text-on-surface">Calendario Aziendale</h1>
                                <p className="text-secondary">Ferie, malattie e turni dei dipendenti.</p>
                            </div>
                            <AdminCalendar users={users} />
                        </div>
                    )}

                    {/* ═══════════════════ LICENSE VIEW ═══════════════════ */}
                    {activeView === 'license' && (
                        <div className="animate-slide-up">
                            <div className="mb-8">
                                <h1 className="font-headline text-3xl font-extrabold text-on-surface">Licenza & Piano</h1>
                                <p className="text-secondary">Attiva le funzionalità avanzate del tuo ecosistema.</p>
                            </div>
                            <LicenseManagement />
                        </div>
                    )}

                    {/* ═══════════════════ SETTINGS VIEW ═══════════════════ */}
                    {activeView === 'settings' && (
                        <div className="animate-slide-up">
                            <div className="mb-8">
                                <h1 className="font-headline text-3xl font-extrabold text-on-surface">Impostazioni</h1>
                                <p className="text-secondary">Configura il pannello di amministrazione.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 shadow-sm">
                                    <h4 className="font-bold text-on-surface mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">apartment</span> Nome Azienda
                                    </h4>
                                    <form onSubmit={handleUpdateCompanyName} className="space-y-3">
                                        <input type="text" placeholder="Nome Azienda" value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} className="w-full rounded-lg border-outline-variant px-3 py-2.5 text-sm bg-white" />
                                        <button type="submit" className="w-full py-2.5 rounded-lg bg-primary text-white font-bold text-sm">Aggiorna</button>
                                    </form>
                                </div>

                                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 shadow-sm">
                                    <h4 className="font-bold text-on-surface mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">key</span> Cambia Password Admin
                                    </h4>
                                    <form onSubmit={handleUpdatePassword} className="space-y-3">
                                        <input type="text" placeholder="Nuovo Codice Admin" value={newAdminCode} onChange={(e) => setNewAdminCode(e.target.value)} className="w-full rounded-lg border-outline-variant px-3 py-2.5 text-sm bg-white" />
                                        <button type="submit" className="w-full py-2.5 rounded-lg bg-primary text-white font-bold text-sm">Salva</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="text-center mt-16 pb-8 text-xs text-secondary opacity-50">
                        TimbroSmart cosmonet.info &copy; {new Date().getFullYear()}
                    </div>
                </div>
            </main>

            {/* Photo Modal */}
            {selectedPhoto && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000] flex justify-center items-center p-4" onClick={() => setSelectedPhoto(null)}>
                    <div className="relative max-w-3xl w-full animate-slide-up">
                        <img src={selectedPhoto} alt="Prova lavoro" className="w-full h-auto rounded-2xl shadow-2xl border border-white/20" />
                        <button onClick={() => setSelectedPhoto(null)} className="absolute -top-12 right-0 text-white text-sm font-bold flex items-center gap-1 hover:opacity-70 transition-opacity">
                            <span className="material-symbols-outlined">close</span> Chiudi
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingEntry && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex justify-center items-center p-4">
                    <div className="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up border border-outline-variant/20">
                        <h3 className="font-bold text-on-surface text-lg mb-1 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">edit_calendar</span> Modifica Timbratura
                        </h3>
                        <p className="text-secondary text-sm mb-4">
                            Stai modificando l&apos;orario per <strong className="text-on-surface">{editingEntry.user.name}</strong>
                        </p>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-secondary mb-1">Nuova Data e Ora</label>
                            <input
                                type="datetime-local"
                                className="w-full rounded-lg border-outline-variant px-3 py-2.5 text-sm bg-white"
                                value={editTimestamp}
                                onChange={(e) => setEditTimestamp(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setEditingEntry(null)} className="px-5 py-2.5 rounded-lg border border-outline-variant text-secondary font-medium text-sm hover:bg-surface-container-low transition-colors">
                                Annulla
                            </button>
                            <button onClick={handleSaveEdit} className="px-5 py-2.5 rounded-lg bg-primary text-white font-bold text-sm shadow-sm">
                                Salva
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
