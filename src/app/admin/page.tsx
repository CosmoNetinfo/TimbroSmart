'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PaymentsManagement from './PaymentsManagement';
import AdminCalendar from './AdminCalendar';
import LicenseManagement from './LicenseManagement';
import { Users, CreditCard, Calendar, Key, Settings, LogOut, Clock, DollarSign, BarChart3, Trash2 } from 'lucide-react';


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

export default function Admin() {
    const router = useRouter();
    const [entries, setEntries] = useState<AdminEntry[]>([]);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');

    const [showUsers, setShowUsers] = useState(false);
    const [showPayments, setShowPayments] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showLicense, setShowLicense] = useState(false);
    const [companyPlan, setCompanyPlan] = useState<string>('FREE');
    const [companyName, setCompanyName] = useState<string>('TimbroSmart');
    const [newCompanyName, setNewCompanyName] = useState('');
    const [needsCompanyName, setNeedsCompanyName] = useState(false);

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
        } catch (e) {
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
        } catch (e) {
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
                // Ricarica senza refresh
                fetchEntries();
            } else {
                alert('Errore durante l\'eliminazione');
            }
        } catch (e) {
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
        // We'll rely on the user to click filter or just reload.
        // Let's reload to be simple and robust.
        window.location.reload();
    };

    const [newAdminCode, setNewAdminCode] = useState('');
    const [showSettings, setShowSettings] = useState(false);

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
        } catch (e) {
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
        } catch (e) {
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
                setNeedsCompanyName(false); // Sblocca la dashboard
                alert('Nome azienda aggiornato con successo!');
            } else {
                const data = await res.json();
                alert(`Errore: ${data.error || 'Impossibile aggiornare'}`);
            }
        } catch (error) {
            alert('Errore di connessione');
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAdminCode) return;

        try {
            // Get current admin ID from localStorage
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
        } catch (error) {
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
                // Refresh data
                fetchUsers();
                fetchEntries(); // To update summaries
            } else {
                alert('Errore aggiornamento stipendio');
            }
        } catch (e) {
            alert('Errore di connessione');
        }
    };

    const handleEditClick = (entry: AdminEntry) => {
        setEditingEntry(entry);
        // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
        // Adjust for local timezone offset
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
        } catch (e) {
            alert('Errore di connessione');
        }
    };

    const summary = useMemo(() => {
        // Group entries by user
        const userEntries: Record<string, AdminEntry[]> = {};
        entries.forEach(e => {
            if (!userEntries[e.userId]) userEntries[e.userId] = [];
            userEntries[e.userId].push(e);
        });

        let totalHours = 0;
        const userSummaries = Object.values(userEntries).map(logs => {
            // Sort ascending
            logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            let hours = 0;
            // Iterate and pair IN/OUT
            for (let i = 0; i < logs.length; i++) {
                if (logs[i].type === 'IN') {
                    if (i + 1 < logs.length && logs[i + 1].type === 'OUT') {
                        const start = new Date(logs[i].timestamp).getTime();
                        const end = new Date(logs[i + 1].timestamp).getTime();
                        hours += (end - start) / (1000 * 60 * 60);
                        i++; // Skip the OUT processed
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
            lastAutoTable?: {
                finalY: number;
            };
        }

        const doc = new jsPDF() as JsPDFWithAutoTable;
        
        // --- PREMIUM STYLING HELPERS ---
        const drawBox = (x: number, y: number, w: number, h: number, label: string, content?: string | number) => {
            doc.setDrawColor(220); // Softer border
            doc.rect(x, y, w, h);
            
            doc.setFontSize(6);
            doc.setTextColor(140); // Lighter gray for labels
            doc.setFont("helvetica", "normal");
            doc.text(label.toUpperCase(), x + 2, y + 3.5);
            
            if (content !== undefined) {
                doc.setFontSize(9);
                doc.setTextColor(0); // Deep black for data
                doc.setFont("helvetica", "bold");
                // Avoid overflow - truncate if needed
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

        // --- TITLE ---
        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.setFont("helvetica", "bold");
        doc.text("CEDOLINO PAGA", 10, 8);

        // --- ROW 1: Company Header ---
        const r1Y = 12;
        drawBox(10, r1Y, 80, 15, "Nome Azienda", companyName);
        drawBox(90, r1Y, 35, 7.5, "Posizione INPS Azienda", "1234567890");
        drawBox(125, r1Y, 35, 15, "Mese di retribuzione", monthYear);
        drawBox(90, r1Y + 7.5, 35, 7.5, "Posizione INAIL Azienda", "987654321");
        
        // Brand Logo Positioning (Final fix for transparency and overlap)
        try {
            // Using 'FAST' alias for transparency preservation
            doc.addImage('/logo-premium.png', 'PNG', 165, 5, 22, 22, undefined, 'FAST');
        } catch (e) {
            console.warn("Logo not found, skipping", e);
        }

        doc.setFontSize(6);
        doc.setTextColor(180);
        doc.text("C.d.C. --------------------", 12, r1Y + 18);

        // --- ROW 2: Employee Main Info ---
        const r2Y = 32;
        drawBox(10, r2Y, 25, 12, "Cod. Dip.", "---");
        drawBox(35, r2Y, 50, 12, "Matricola", summary.userSummaries[0]?.userId.toString().slice(-8) || "---");
        drawBox(85, r2Y, 80, 12, "Cognome Nome", summary.userSummaries[0]?.name || "Dipendente");
        drawBox(165, r2Y, 35, 12, "Data assunzione", "01/01/2024");

        // --- ROW 3: Secondary Employee Info ---
        const r3Y = 44;
        drawBox(10, r3Y, 80, 12, "Indirizzo", "---");
        drawBox(90, r3Y, 40, 6, "Codice Fiscale", "---");
        drawBox(130, r3Y, 35, 6, "Codice Inps", "---");
        drawBox(165, r3Y, 35, 6, "Sede di Lavoro", "Sede Principale");
        
        drawBox(90, r3Y + 6, 40, 6, "Contratto di Lavoro", "Commercio");
        drawBox(130, r3Y + 6, 35, 6, "Qualifica", "Impiegato");
        drawBox(165, r3Y + 6, 35, 6, "Livello", "4");

        // --- ROW 4: Payment & Sector ---
        const r4Y = 58;
        drawBox(10, r4Y, 80, 10, "Modalità di pagamento", "Bonifico Bancario");
        drawBox(90, r4Y, 110, 10, "Riferimenti Bancari", "---");

        // --- ROW 5: Time Stats ---
        const r5Y = 70;
        drawBox(10, r5Y, 20, 10, "Sett. Retr.", "---");
        drawBox(30, r5Y, 20, 10, "GG. Retr.", "26");
        drawBox(50, r5Y, 30, 10, "GG. Lavorati", (summary.userSummaries[0]?.hours / 8).toFixed(0));
        drawBox(80, r5Y, 30, 10, "Ore Lavorate", summary.userSummaries[0]?.hours.toFixed(2));
        drawBox(110, r5Y, 45, 10, "Scatti Anzianità", "");
        doc.setFontSize(6);
        doc.text("n° --  Data --  Prossimo --", 112, r5Y + 8);
        drawBox(155, r5Y, 45, 10, "", "");

        // --- ROW 6: Wage Details ---
        const r6Y = 82;
        drawBox(10, r6Y, 30, 10, "Paga base", `€ ${summary.userSummaries[0]?.wage.toFixed(2)}`);
        drawBox(40, r6Y, 30, 10, "Ind. Contigenza", "---");
        drawBox(70, r6Y, 20, 10, "E.D.R", "---");
        drawBox(90, r6Y, 20, 10, "E.E.T", "---");
        drawBox(110, r6Y, 90, 10, "Ind. Terr. Settore", "---");

        // --- SECTION: Variable Items table (Wages Activity) ---
        const tableHeader = [['Data', 'Voci Variabili', 'Quantità', 'Trattenute', 'Competenze', 'Riferimento']];
        const tableBody = entries.map(e => [
            new Date(e.timestamp).toLocaleDateString(),
            e.type === 'IN' ? 'ENTRATA' : 'USCITA',
            '1.00',
            '',
            '',
            new Date(e.timestamp).toLocaleTimeString()
        ]);

        autoTable(doc, {
            startY: 96,
            head: tableHeader,
            body: tableBody,
            theme: 'grid',
            headStyles: { 
                fillColor: [248, 250, 252] as [number, number, number], 
                textColor: [71, 85, 105] as [number, number, number], 
                fontSize: 7, 
                fontStyle: 'bold',
                lineWidth: 0.1
            },
            bodyStyles: { 
                fontSize: 8,
                textColor: [30, 41, 59],
                lineWidth: 0.1
            },
            margin: { left: 10, right: 10 },
            tableWidth: 190,
        });

        const finalY = (doc.lastAutoTable?.finalY || 100) + 8;

        // --- SECTION: Footer Final Totals ---
        drawBox(10, finalY, 30, 15, "Comp. Tot.", `€ ${summary.userSummaries[0]?.salary.toFixed(2)}`);
        drawBox(40, finalY, 30, 15, "Tratt. Tot.", "€ 0,00");
        drawBox(70, finalY, 40, 15, "Arrotondamento", "0,00");
        
        // Net Busta: Highlighted Premium Box
        doc.setDrawColor(59, 130, 246); // Primary blue
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


    return (
        <main className="container">
            {/* Overlay Bloccante per Nome Azienda */}
            {needsCompanyName && (
                <div 
                    style={{ 
                        position: 'fixed', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        bottom: 0, 
                        backgroundColor: 'rgba(2, 6, 23, 0.95)', 
                        zIndex: 9999, 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        justifyContent: 'center',
                        padding: '20px',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <div className="card animate-slide-up" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', border: '2px solid var(--primary)' }}>
                        <div style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem' }}>
                            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                                <path d="M20 40C20 23.4315 33.4315 10 50 10C66.5685 10 80 23.4315 80 40C80 56.5685 60 90 50 90C40 90 20 56.5685 20 40Z" fill="url(#azureGradOverlay)" />
                                <defs>
                                    <linearGradient id="azureGradOverlay" x1="50" y1="10" x2="50" y2="90">
                                        <stop stopColor="#0ea5e9" />
                                        <stop offset="1" stopColor="#2563eb" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Configura la tua Azienda</h2>
                        <p className="text-muted mb-6">Benvenuto su TimbroSmart! Per iniziare a utilizzare il pannello, inserisci il nome ufficiale della tua azienda.</p>
                        
                        <form onSubmit={handleUpdateCompanyName}>
                            <div className="mb-4">
                                <label className="label">Nome Azienda</label>
                                <input
                                    type="text"
                                    placeholder="Es: Rossi Costruzioni S.r.l."
                                    value={newCompanyName}
                                    onChange={(e) => setNewCompanyName(e.target.value)}
                                    className="custom-input"
                                    autoFocus
                                    required
                                    style={{ textAlign: 'center' }}
                                />
                            </div>
                            <button type="submit" className="btn-glass-primary" style={{ height: '55px', fontSize: '1.1rem' }}>
                                Salva e Inizia
                            </button>
                        </form>
                        
                        <button 
                            onClick={handleLogout} 
                            style={{ marginTop: '1.5rem', opacity: 0.7, background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            Esci e torna al login
                        </button>
                    </div>
                </div>
            )}

            <div className="animate-slide-up" style={{ opacity: needsCompanyName ? 0.3 : 1, pointerEvents: needsCompanyName ? 'none' : 'auto' }}>

                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }} className="mb-8">
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ width: '60px', height: '60px' }}>
                          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                            <path d="M20 40C20 23.4315 33.4315 10 50 10C66.5685 10 80 23.4315 80 40C80 56.5685 60 90 50 90C40 90 20 56.5685 20 40Z" fill="url(#azureGradAdmin)" />
                            <circle cx="50" cy="40" r="18" stroke="white" strokeWidth="4" />
                            <path d="M50 30V40L60 40" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M70 30C75 35 75 45 70 50" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />
                            <defs>
                              <linearGradient id="azureGradAdmin" x1="50" y1="10" x2="50" y2="90" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#0ea5e9" />
                                <stop offset="1" stopColor="#2563eb" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>
                        <div>
                            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Pannello: {companyName}</h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <p className="text-muted">Gestione completa dipendenti e buste paga</p>
                                <span style={{ 
                                    background: companyPlan === 'FREE' ? '#e2e8f0' : companyPlan === 'PRO' ? '#dbeafe' : '#fef3c7',
                                    color: companyPlan === 'FREE' ? '#475569' : companyPlan === 'PRO' ? '#2563eb' : '#d97706',
                                    padding: '2px 10px',
                                    borderRadius: '20px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    border: '1px solid currentColor'
                                }}>
                                    {companyPlan} PLAN
                                </span>
                            </div>
                        </div>
                    </div>


                    <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                        <button 
                            onClick={() => {
                                if (companyPlan === 'FREE' && !showPayments) {
                                    alert('La Gestione Pagamenti è una funzione PRO. Passa a un piano superiore per sbloccarla.');
                                    return;
                                }
                                setShowPayments(!showPayments);
                            }} 
                            style={{ flex: '1 1 auto', minWidth: 'max-content' }} 
                            className={`btn ${showPayments ? 'btn-primary' : 'btn-secondary'}`}
                        >
                            {showPayments ? 'Chiudi Pagamenti' : <><CreditCard size={18} className="inline mr-2" /> Gestione Pagamenti</>}
                        </button>

                        <button 
                            onClick={() => {
                                if (!companyName || companyName === 'TimbroSmart') {
                                    alert('Per favore, imposta prima il Nome Azienda nelle Impostazioni');
                                    setShowSettings(true);
                                } else {
                                    setShowUsers(!showUsers);
                                }
                            }} 
                            style={{ 
                                flex: '1 1 auto', 
                                minWidth: 'max-content',
                                opacity: (!companyName || companyName === 'TimbroSmart') ? 0.7 : 1
                            }} 
                            className={`btn ${showUsers ? 'btn-primary' : 'btn-secondary'}`}
                        >
                            {showUsers ? 'Chiudi Dipendenti' : '👥 Gestione Dipendenti'}
                        </button>
                        <button onClick={() => setShowCalendar(!showCalendar)} style={{ flex: '1 1 auto', minWidth: 'max-content' }} className={`btn ${showCalendar ? 'btn-primary' : 'btn-secondary'}`}>
                            {showCalendar ? 'Chiudi Calendario' : <><Calendar size={18} className="inline mr-2" /> Calendario Aziendale</>}
                        </button>
                        <button onClick={() => setShowLicense(!showLicense)} style={{ flex: '1 1 auto', minWidth: 'max-content' }} className={`btn ${showLicense ? 'btn-primary' : 'btn-secondary'}`}>
                            {showLicense ? 'Chiudi Licenza' : <><Key size={18} className="inline mr-2" /> Gestione Licenza</>}
                        </button>
                        <button onClick={() => setShowSettings(!showSettings)} style={{ flex: '1 1 auto', minWidth: 'max-content' }} className={`btn ${showSettings ? 'btn-primary' : 'btn-secondary'}`}>
                            {showSettings ? 'Chiudi Settings' : <><Settings size={18} className="inline mr-2" /> Impostazioni</>}
                        </button>

                        <button onClick={handleLogout} style={{ flex: '1 1 auto', minWidth: 'max-content' }} className="btn btn-danger">
                            <LogOut size={18} className="inline mr-2" /> Esci
                        </button>
                    </div>
                </div>

                {/* Settings Section */}
                {showSettings && (
                    <div className="mb-8 animate-slide-up">
                        <div className="card">
                            <h3 className="mb-4">⚙️ Impostazioni Admin</h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                                <div>
                                    <label className="label">Nome Azienda</label>
                                    <form onSubmit={handleUpdateCompanyName} style={{ display: 'flex', gap: '1rem' }}>
                                        <input
                                            type="text"
                                            placeholder="Nome Azienda..."
                                            value={newCompanyName}
                                            onChange={(e) => setNewCompanyName(e.target.value)}
                                        />
                                        <button type="submit" className="btn btn-primary">
                                            Aggiorna
                                        </button>
                                    </form>
                                </div>

                                <div>
                                    <label className="label">Cambia Password Admin</label>
                                    <form onSubmit={handleUpdatePassword} style={{ display: 'flex', gap: '1rem' }}>
                                        <input
                                            type="text"
                                            placeholder="Nuovo Codice..."
                                            value={newAdminCode}
                                            onChange={(e) => setNewAdminCode(e.target.value)}
                                        />
                                        <button type="submit" className="btn btn-primary">
                                            Salva
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payments Management Section */}
                {showPayments && (
                    <PaymentsManagement users={users} />
                )}

                {/* Calendar Section */}
                {showCalendar && (
                    <AdminCalendar users={users} />
                )}

                {/* License Section */}
                {showLicense && (
                    <LicenseManagement />
                )}


                {/* Users Management Section */}
                {showUsers && (
                    <div className="mb-8 animate-slide-up">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                             <h3 style={{ margin: 0 }}><Users size={20} className="inline mr-2" /> Gestione Dipendenti & Matricole</h3>
                            <button 
                                onClick={() => setShowAddUser(!showAddUser)} 
                                className="btn btn-primary"
                                style={{ padding: '8px 20px' }}
                            >
                                {showAddUser ? 'Annulla' : '+ Aggiungi Dipendente'}
                            </button>
                        </div>

                        {showAddUser && (
                            <div className="card mb-6" style={{ background: 'var(--surface-alt)', border: '1px solid var(--accent)' }}>
                                <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
                                    <div>
                                        <label className="label">Nome Completo</label>
                                        <input type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Es: Mario Rossi" required />
                                    </div>
                                    <div>
                                        <label className="label">Codice Matricola (Accesso)</label>
                                        <input type="text" value={newUserCode} onChange={e => setNewUserCode(e.target.value.toUpperCase())} placeholder="Es: MR001" required />
                                    </div>
                                    <div>
                                        <label className="label">Paga Oraria (€/h)</label>
                                        <input type="number" value={newUserWage} onChange={e => setNewUserWage(e.target.value)} required />
                                    </div>
                                    <button type="submit" className="btn btn-primary" disabled={creatingUser}>
                                        {creatingUser ? '...' : 'Salva Dipendente'}
                                    </button>
                                </form>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {users.map(u => (
                                <div key={u.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'var(--surface)' }}>
                                    <div>
                                        <div className="font-bold" style={{ fontSize: '1.1rem' }}>{u.name}</div>
                                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>Matricola: <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{u.code}</span></div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <label className="text-muted" style={{ fontSize: '0.8rem' }}>€/h</label>
                                            <input
                                                type="number"
                                                defaultValue={u.hourlyWage || 7}
                                                onBlur={(e) => {
                                                    const val = e.target.value;
                                                    if (parseFloat(val) !== u.hourlyWage) {
                                                        handleUpdateWage(u.id, val);
                                                    }
                                                }}
                                                style={{ width: '60px', textAlign: 'right', fontWeight: 'bold', padding: '4px' }}
                                            />
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteUser(u.id)}
                                            style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                                            title="Elimina Dipendente"
                                        >
                                            <Clock size={32} color="var(--accent)" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }} className="mb-8">
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ background: 'var(--accent-light)', padding: '16px', borderRadius: '16px', fontSize: '2rem' }}>
                            <Clock size={32} color="var(--accent)" />
                        </div>
                        <div>
                            <p className="text-muted font-medium mb-1">Ore Totali (Periodo)</p>
                            <h2 style={{ margin: 0, color: 'var(--accent)' }}>{summary.totalHours.toFixed(2)} h</h2>
                        </div>
                    </div>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ background: 'var(--success-bg)', padding: '16px', borderRadius: '16px', fontSize: '2rem' }}>
                            <DollarSign size={32} color="var(--success)" />
                        </div>
                        <div>
                            <p className="text-muted font-medium mb-1">Stipendio Stimato</p>
                            <h2 style={{ margin: 0, color: 'var(--success)' }}>€ {summary.totalSalary.toFixed(2)}</h2>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="card mb-8 animate-slide-up">
                     <h3 className="mb-4"><BarChart3 size={20} className="inline mr-2" /> Statistiche Ore (Periodo)</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        {isMounted && (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <BarChart data={summary.userSummaries}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis
                                    dataKey="name"
                                    stroke="var(--text-secondary)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="var(--text-secondary)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    unit="h"
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--surface)',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border)',
                                        boxShadow: 'var(--shadow-lg)'
                                    }}
                                    cursor={{ fill: 'var(--surface-alt)' }}
                                />
                                <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
                                    {summary.userSummaries.map((_entry, index: number) => (
                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--accent)' : 'var(--accent-dark)'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
                </div>

                {/* Filters & Table Section */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

                    {/* Filters Header */}
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--surface-alt)' }}>
                        <form onSubmit={handleFilter} style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1 }}>
                                <div>
                                    <label className="label">Dal</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        style={{ minWidth: '150px' }}
                                    />
                                </div>
                                <div>
                                    <label className="label">Al</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        style={{ minWidth: '150px' }}
                                    />
                                </div>
                                <div style={{ minWidth: '200px', flex: 1 }}>
                                    <label className="label">Filtra per Dipendente</label>
                                    <select
                                        value={selectedUserId}
                                        onChange={(e) => setSelectedUserId(e.target.value)}
                                    >
                                        <option value="">Tutti i dipendenti</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.8rem' }}>
                                <button type="submit" className="btn btn-primary">
                                    Filtra Risultati
                                </button>
                                <button type="button" onClick={handleReset} className="btn btn-ghost">
                                    Reset
                                </button>
                                <button type="button" onClick={handleExport} className="btn btn-success" disabled={entries.length === 0}>
                                    📥 Export CSV
                                </button>
                                <button type="button" onClick={handleExportPDF} className="btn btn-secondary" disabled={entries.length === 0} style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                                    📄 PDF Busta Paga
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Table */}
                    <div className="table-container" style={{ borderRadius: 0, boxShadow: 'none', border: 'none' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Data / Ora</th>
                                    <th>Dipendente</th>
                                    <th>Matricola</th>
                                    <th>Stato</th>
                                    <th>Azioni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((entry) => (
                                    <tr key={entry.id}>
                                        <td>
                                            <div className="font-medium">{new Date(entry.timestamp).toLocaleDateString()}</div>
                                            <div className="text-muted" style={{ fontSize: '0.85rem' }}>{new Date(entry.timestamp).toLocaleTimeString()}</div>
                                        </td>
                                        <td>
                                            <div className="font-bold">{entry.user.name}</div>
                                        </td>
                                        <td>
                                            <span style={{ background: 'var(--surface-alt)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                                                {entry.user.code}
                                            </span>
                                        </td>
                                        <td>
                                            {entry.type === 'IN' ? (
                                                <span className="status-badge status-in">▶ ENTRATA</span>
                                            ) : (
                                                <span className="status-badge status-out">⏹ USCITA</span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                {entry.hasPhoto ? (
                                                    <button
                                                        onClick={() => handleOpenPhoto(entry.id)}
                                                        className="btn btn-secondary"
                                                        disabled={loadingPhoto}
                                                        style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                                                    >
                                                        {loadingPhoto ? '...' : '📸 Foto'}
                                                    </button>
                                                ) : (
                                                    <span className="text-muted" style={{ padding: '0 10px', fontSize: '0.85rem' }}>No Foto</span>
                                                )}
                                                <button
                                                    onClick={() => handleEditClick(entry)}
                                                    className="btn btn-ghost"
                                                    style={{ color: 'var(--accent)', padding: '8px 12px' }}
                                                    title="Modifica Orario"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(entry.id)}
                                                    className="btn btn-ghost"
                                                    style={{ color: 'var(--danger)', padding: '8px 12px' }}
                                                    title="Elimina"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {entries.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '4rem', textAlign: 'center' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📭</div>
                                            <p className="text-muted">Nessuna attività trovata per i filtri selezionati.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        {loading && (
                            <div style={{ padding: '4rem', textAlign: 'center' }}>
                                <div className="text-muted">Caricamento dati in corso...</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Photo Modal */}
                {selectedPhoto && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.8)',
                            zIndex: 1000,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '2rem',
                            backdropFilter: 'blur(5px)'
                        }}
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <div style={{ position: 'relative', maxWidth: '1000px', width: '100%' }}>
                            <img
                                src={selectedPhoto}
                                alt="Prova lavoro"
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    borderRadius: '12px',
                                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                                    border: '1px solid white'
                                }}
                            />
                            <button
                                onClick={() => setSelectedPhoto(null)}
                                style={{
                                    position: 'absolute',
                                    top: '-40px',
                                    right: '0',
                                    background: 'transparent',
                                    color: 'white',
                                    border: 'none',
                                    fontSize: '2rem',
                                    cursor: 'pointer'
                                }}
                            >
                                ✕ Chiudi
                            </button>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {editingEntry && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.8)',
                            zIndex: 1000,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '1rem',
                            backdropFilter: 'blur(5px)'
                        }}
                    >
                        <div className="card animate-slide-up" style={{ width: '100%', maxWidth: '400px' }}>
                            <h3 className="mb-4">✏️ Modifica Timbratura</h3>
                            <p className="text-muted mb-4">
                                Stai modificando l&apos;orario per <strong>{editingEntry.user.name}</strong>
                            </p>

                            <div className="mb-4">
                                <label className="label">Nuova Data e Ora</label>
                                <input
                                    type="datetime-local"
                                    className="pill-input"
                                    style={{ textAlign: 'left' }}
                                    value={editTimestamp}
                                    onChange={(e) => setEditTimestamp(e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setEditingEntry(null)}
                                    className="btn btn-secondary"
                                >
                                    Annulla
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="btn btn-primary"
                                >
                                    Salva Modifiche
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="text-center mt-10" style={{ marginTop: '4rem', opacity: 0.5, fontSize: '0.85rem' }}>
                    TimbroSmart cosmonet.info &copy; {new Date().getFullYear()}
                </div>
            </div>
        </main>
    );
}
