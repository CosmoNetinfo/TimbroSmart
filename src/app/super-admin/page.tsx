'use client';
import { useState, useEffect } from 'react';
import { Trash2, Plus, Search, ShieldCheck, ArrowLeft, RefreshCw, FileSpreadsheet, AlertCircle, CheckCircle, Send } from 'lucide-react';
import Link from 'next/link';

interface MasterKey {
    id: string;
    plan: string;
    isActive: boolean;
    adminCode?: string;
    createdAt: string;
    companyInfo?: {
        id: string;
        name: string;
        licenseExpiry: string | null;
        licenseActivatedAt: string | null;
    } | null;
}

export default function SuperAdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [keys, setKeys] = useState<MasterKey[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewForm, setShowNewForm] = useState(false);
    const [newKey, setNewKey] = useState({ serialKey: '', adminCode: '', plan: 'PRO', isActive: true });
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [view, setView] = useState<'LICENSES' | 'ORDERS'>('LICENSES');
    const [orders, setOrders] = useState<any[]>([]);

    // Auto-nasconde i messaggi di successo dopo 3 secondi
    useEffect(() => {
        if (successMsg) {
            const timer = setTimeout(() => setSuccessMsg(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMsg]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'TSMT_2026') {
            setIsAuthenticated(true);
            fetchKeys();
            fetchOrders();
        } else {
            alert('Password errata!');
        }
    };

    const fetchKeys = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const res = await fetch(`/api/super-admin/licenses?secret=TSMT_2026`);
            if (res.ok) {
                const data = await res.json();
                setKeys(Array.isArray(data) ? data : []);
            } else {
                const errData = await res.json().catch(() => ({ error: res.statusText }));
                setErrorMsg(`Errore ${res.status}: ${errData.error || 'Impossibile recuperare le licenze'}`);
            }
        } catch (e) {
            setErrorMsg('Errore di connessione al server.');
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        try {
            const res = await fetch(`/api/super-admin/orders?secret=TSMT_2026`);
            if (res.ok) {
                const data = await res.json();
                setOrders(data || []);
            }
        } catch (e) {
            console.error('Fetch orders error:', e);
        }
    };

    const handleToggleActive = async (key: MasterKey) => {
        try {
            const res = await fetch('/api/super-admin/licenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    secret: 'TSMT_2026',
                    serialKey: key.id,
                    plan: key.plan,
                    isActive: !key.isActive
                })
            });
            if (res.ok) {
                fetchKeys();
            } else {
                const errorData = await res.json();
                alert(`Errore aggiornamento: ${errorData.error || res.statusText}`);
            }
        } catch {
            alert('Errore di connessione durante l\'aggiornamento');
        }
    };

    const handleDelete = async (serialKey: string) => {
        if (!confirm('Eliminare definitivamente questa chiave?')) return;
        try {
            const res = await fetch(`/api/super-admin/licenses?secret=TSMT_2026&serialKey=${serialKey}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchKeys();
            } else {
                const errorData = await res.json();
                alert(`Errore eliminazione: ${errorData.error || res.statusText}`);
            }
        } catch {
            alert('Errore di connessione durante l\'eliminazione');
        }
    };

    const handleDeleteOrder = async (orderId: string) => {
        if (!confirm('Eliminare questa richiesta ordine?')) return;
        try {
            const res = await fetch(`/api/super-admin/orders?secret=TSMT_2026&orderId=${orderId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchOrders();
            }
        } catch {
            alert('Errore di connessione');
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/super-admin/licenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    secret: 'TSMT_2026',
                    ...newKey
                })
            });
            if (res.ok) {
                setShowNewForm(false);
                setNewKey({ serialKey: '', adminCode: '', plan: 'PRO', isActive: true });
                fetchKeys();
                setSuccessMsg('Licenza generata con successo');
            } else {
                const errorData = await res.json();
                alert(`Errore creazione: ${errorData.error || res.statusText}`);
            }
        } catch {
            alert('Errore di connessione durante la creazione');
        }
    };

    const handleFulfillOrder = (order: any) => {
        setNewKey({
            serialKey: `PRO-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-TSMT`,
            adminCode: `ADM-PRO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            plan: 'PRO',
            isActive: true
        });
        setShowNewForm(true);
        // Suggeriamo di inviare i dati via WhatsApp dopo il salvataggio
    };

    const filteredKeys = keys.filter(k => 
        k.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        k.plan.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isAuthenticated) {
        return (
            <main className="min-h-screen bg-surface-container-lowest flex items-center justify-center p-4 font-inter">
                <div className="w-full max-w-md animate-fade-in">
                    <div className="bg-white border border-outline-variant/20 rounded-[32px] p-8 shadow-2xl shadow-primary/5">
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                                <ShieldCheck className="text-primary w-8 h-8" />
                            </div>
                            <h2 className="font-headline text-2xl font-extrabold text-on-surface">Super Admin</h2>
                            <p className="text-secondary text-sm">Accesso Riservato al Sistema</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors">
                                    <ShieldCheck size={20} />
                                </div>
                                <input 
                                    type="password" 
                                    className="w-full h-14 pl-12 pr-4 bg-surface-container-low border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl transition-all outline-none text-on-surface font-bold tracking-widest placeholder:tracking-normal placeholder:font-normal" 
                                    placeholder="Master Password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                                Entra nel Pannello
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-outline-variant/10 text-center">
                            <p className="text-[11px] text-secondary/60 uppercase tracking-widest">TimbroSmart Security Module v2.0</p>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-surface-container-lowest pb-20 font-inter text-on-surface">
            {/* Header / Nav */}
            <header className="bg-white/80 backdrop-blur-md border-b border-outline-variant/10 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="p-2 hover:bg-surface-container-low rounded-xl transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="font-headline text-xl font-extrabold text-on-surface flex items-center gap-2">
                                <ShieldCheck className="text-primary" size={24} />
                                {view === 'LICENSES' ? 'License Manager' : 'Gestione Ordini'}
                            </h1>
                            <p className="text-[10px] text-secondary uppercase tracking-widest font-bold opacity-60">Ambiente di Produzione</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <nav className="bg-surface-container-low p-1 rounded-xl flex gap-1 mr-2">
                            <button 
                                onClick={() => setView('LICENSES')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'LICENSES' ? 'bg-white shadow-sm text-primary' : 'text-secondary hover:text-on-surface'}`}
                            >
                                Licenze
                            </button>
                            <button 
                                onClick={() => { setView('ORDERS'); fetchOrders(); }}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'ORDERS' ? 'bg-white shadow-sm text-primary' : 'text-secondary hover:text-on-surface'}`}
                            >
                                Ordini {orders.length > 0 && <span className="ml-1 bg-primary/10 px-1.5 rounded text-[10px]">{orders.length}</span>}
                            </button>
                        </nav>
                        
                        <button 
                            onClick={view === 'LICENSES' ? fetchKeys : fetchOrders} 
                            className="p-3 bg-surface-container-low hover:bg-surface-container rounded-xl transition-colors text-secondary"
                            title="Aggiorna dati"
                        >
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        </button>

                        {view === 'LICENSES' && (
                            <button 
                                onClick={() => setShowNewForm(true)} 
                                className="h-11 px-5 bg-primary text-white font-bold rounded-xl shadow-md shadow-primary/10 hover:shadow-lg transition-all flex items-center gap-2 text-sm"
                            >
                                <Plus size={18} /> Nuova Chiave
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 py-8 animate-fade-in">
                {/* Status Messages */}
                {errorMsg && (
                    <div className="mb-6 animate-slide-up bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium">
                        <AlertCircle size={20} /> {errorMsg}
                    </div>
                )}
                {successMsg && (
                    <div className="mb-6 animate-slide-up bg-green-50 border border-green-100 p-4 rounded-2xl flex items-center gap-3 text-green-700 text-sm font-medium">
                        <CheckCircle size={20} /> {successMsg}
                    </div>
                )}

                {view === 'LICENSES' ? (
                    <>
                        {/* Stats Bento Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                            <div className="bg-white border border-outline-variant/10 p-6 rounded-[24px] shadow-sm">
                                <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-1 opacity-60">Chiavi Totali</p>
                                <h3 className="text-3xl font-headline font-black text-on-surface">{keys.length}</h3>
                            </div>
                            <div className="bg-white border border-outline-variant/10 p-6 rounded-[24px] shadow-sm">
                                <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-1 opacity-60">Attive</p>
                                <h3 className="text-3xl font-headline font-black text-green-600">{keys.filter(k => k.isActive).length}</h3>
                            </div>
                            <div className="bg-white border border-outline-variant/10 p-6 rounded-[24px] shadow-sm">
                                <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-1 opacity-60">Piani PRO+</p>
                                <h3 className="text-3xl font-headline font-black text-primary">{keys.filter(k => k.plan !== 'FREE').length}</h3>
                            </div>
                        </div>

                        {/* Search & Toolbar */}
                        <div className="bg-white border border-outline-variant/10 p-4 rounded-[20px] shadow-sm mb-6 flex flex-col sm:flex-row gap-4 items-center">
                            <div className="relative flex-grow w-full">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary opacity-50" />
                                <input 
                                    type="text" 
                                    className="w-full h-12 pl-12 pr-4 bg-surface-container-low rounded-xl outline-none focus:ring-2 ring-primary/20 transition-all text-sm" 
                                    placeholder="Cerca per codice o piano..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Keys List */}
                        <div className="bg-white border border-outline-variant/10 rounded-[28px] shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-surface-container-low border-b border-outline-variant/10">
                                        <tr>
                                            <th className="text-left py-5 px-6 text-[10px] font-bold text-secondary uppercase tracking-widest">Serial Key</th>
                                            <th className="text-left py-5 px-6 text-[10px] font-bold text-secondary uppercase tracking-widest">Admin Code</th>
                                            <th className="text-left py-5 px-6 text-[10px] font-bold text-secondary uppercase tracking-widest">Piano</th>
                                            <th className="text-center py-5 px-6 text-[10px] font-bold text-secondary uppercase tracking-widest">Stato</th>
                                            <th className="text-left py-5 px-6 text-[10px] font-bold text-secondary uppercase tracking-widest">Creazione</th>
                                            <th className="text-right py-5 px-6 text-[10px] font-bold text-secondary uppercase tracking-widest">Azioni</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant/5">
                                        {loading && (
                                            <tr>
                                                <td colSpan={6} className="py-20 text-center">
                                                    <RefreshCw className="animate-spin inline-block mr-2 text-primary" />
                                                    <span className="text-sm text-secondary font-medium">Caricamento in corso...</span>
                                                </td>
                                            </tr>
                                        )}
                                        {!loading && filteredKeys.map((k) => (
                                            <tr key={k.id} className="hover:bg-surface-container-low/50 transition-colors group">
                                                <td className="py-4 px-6">
                                                    <div className="font-mono text-sm font-bold text-on-surface tracking-wider mb-1">{k.id}</div>
                                                    {k.companyInfo?.name && (
                                                        <div className="text-[10px] text-primary font-bold flex items-center gap-1">
                                                            <CheckCircle size={10} /> {k.companyInfo.name}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <code className="text-primary text-xs font-bold leading-none bg-primary/5 px-2 py-1 rounded">
                                                        {k.adminCode || 'N/D'}
                                                    </code>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                                                        k.plan === 'PRO' ? 'bg-blue-100 text-blue-700' :
                                                        k.plan === 'ENTERPRISE' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {k.plan}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <button 
                                                        onClick={() => handleToggleActive(k)}
                                                        className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                                                            k.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                        }`}
                                                    >
                                                        {k.isActive ? 'Attiva' : 'Disattiva'}
                                                    </button>
                                                </td>
                                                <td className="py-4 px-6 text-[11px] text-secondary font-medium whitespace-nowrap">
                                                    <div>C: {new Date(k.createdAt).toLocaleDateString()}</div>
                                                    {k.companyInfo?.licenseExpiry && (
                                                        <div className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                                                            <AlertCircle size={10} /> Exp: {new Date(k.companyInfo.licenseExpiry).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <button 
                                                            onClick={() => {
                                                                const text = `Ecco i tuoi codici TimbroSmart:\n\nSerial Key: ${k.id}\nAdmin Code: ${k.adminCode}\nPiano: ${k.plan}\n\nAccedi qui: https://timbrosmart.vercel.app/`;
                                                                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                                            }} 
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Invia WhatsApp"
                                                        >
                                                            <Send size={18} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(k.id)} 
                                                            className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                                            title="Elimina"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bg-white border border-outline-variant/10 rounded-[28px] shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-surface-container-low border-b border-outline-variant/10">
                                        <tr>
                                            <th className="text-left py-5 px-6 text-[10px] font-bold text-secondary uppercase tracking-widest">Azienda</th>
                                            <th className="text-left py-5 px-6 text-[10px] font-bold text-secondary uppercase tracking-widest">Contatto</th>
                                            <th className="text-left py-5 px-6 text-[10px] font-bold text-secondary uppercase tracking-widest">Piano</th>
                                            <th className="text-left py-5 px-6 text-[10px] font-bold text-secondary uppercase tracking-widest">Data Invio</th>
                                            <th className="text-right py-5 px-6 text-[10px] font-bold text-secondary uppercase tracking-widest">Azioni</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant/5">
                                        {orders.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-20 text-center">
                                                    <p className="text-secondary font-medium">Nessuna richiesta ordine pendente</p>
                                                </td>
                                            </tr>
                                        )}
                                        {orders.map((o) => (
                                            <tr key={o.id} className="hover:bg-surface-container-low/30 transition-colors">
                                                <td className="py-4 px-6 text-sm font-extrabold text-on-surface">{o.companyName}</td>
                                                <td className="py-4 px-6 text-xs text-primary font-bold">{o.email}</td>
                                                <td className="py-4 px-6">
                                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${o.plan === 'PRO' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {o.plan}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-[11px] text-secondary font-medium">{new Date(o.createdAt).toLocaleString()}</td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => handleFulfillOrder(o)} className="h-9 px-4 bg-primary/10 text-primary text-[11px] font-bold rounded-lg hover:bg-primary hover:text-white transition-all">
                                                            Soddisfa
                                                        </button>
                                                        <button onClick={() => handleDeleteOrder(o.id)} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Simple Modal Layer */}
            {showNewForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm bg-on-surface/20 animate-fade-in">
                    <div className="bg-white border border-outline-variant/10 rounded-[32px] p-8 shadow-2xl w-full max-w-lg animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-headline text-xl font-extrabold">Genera Licenza</h3>
                            <button onClick={() => setShowNewForm(false)} className="p-2 hover:bg-surface-container-low rounded-full">
                                <Plus size={20} className="rotate-45" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary ml-1">Serial Key</label>
                                <div className="flex gap-2">
                                    <input type="text" className="flex-grow h-12 px-4 bg-surface-container-low rounded-xl outline-none font-mono text-sm border-2 border-transparent focus:border-primary transition-all" value={newKey.serialKey} onChange={e => setNewKey({...newKey, serialKey: e.target.value})} placeholder="PRO-..." required />
                                    <button 
                                        type="button" 
                                        className="w-12 h-12 bg-surface-container-low hover:bg-primary/10 rounded-xl flex items-center justify-center transition-colors text-primary"
                                        onClick={() => setNewKey({
                                            ...newKey, 
                                            serialKey: `${newKey.plan}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-TSMT`,
                                            adminCode: `ADM-${newKey.plan}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
                                        })}
                                    >
                                        <RefreshCw size={18} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary ml-1">Admin Code</label>
                                <input type="text" className="w-full h-12 px-4 bg-surface-container-low rounded-xl outline-none font-mono text-sm border-2 border-transparent focus:border-primary transition-all" value={newKey.adminCode} onChange={e => setNewKey({...newKey, adminCode: e.target.value})} placeholder="ADM-..." required />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary ml-1">Piano Abbonamento</label>
                                <select className="w-full h-12 px-4 bg-surface-container-low rounded-xl outline-none text-sm border-2 border-transparent focus:border-primary appearance-none cursor-pointer" value={newKey.plan} onChange={e => setNewKey({...newKey, plan: e.target.value})}>
                                    <option value="PRO">PRO (€4.99/12m)</option>
                                    <option value="ENTERPRISE">ENTERPRISE (€9.99/12m)</option>
                                    <option value="FREE">FREE (Omaggio)</option>
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowNewForm(false)} className="flex-grow h-12 bg-surface-container-low text-secondary font-bold rounded-xl hover:bg-surface-container transition-all">Annulla</button>
                                <button type="submit" className="flex-grow h-12 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/10 transition-all">Genera Ora</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
