'use client';
import { useState, useEffect } from 'react';
import { Key, Save, Trash2, Plus, Search, ShieldCheck, ArrowLeft, RefreshCw, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';

interface MasterKey {
    id: string;
    plan: string;
    isActive: boolean;
    createdAt: string;
}

export default function SuperAdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [keys, setKeys] = useState<MasterKey[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewForm, setShowNewForm] = useState(false);
    const [newKey, setNewKey] = useState({ serialKey: '', plan: 'PRO', isActive: true });

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // In produzione questa password sarebbe in .env
        if (password === 'TSMT_2026') {
            setIsAuthenticated(true);
            fetchKeys();
        } else {
            alert('Password errata!');
        }
    };

    const fetchKeys = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/super-admin/licenses?secret=TSMT_2026`);
            if (res.ok) {
                const data = await res.json();
                setKeys(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
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
        } catch (e) {
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
        } catch (e) {
            alert('Errore di connessione durante l\'eliminazione');
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
                setNewKey({ serialKey: '', plan: 'PRO', isActive: true });
                fetchKeys();
            } else {
                const errorData = await res.json();
                alert(`Errore creazione: ${errorData.error || res.statusText}`);
            }
        } catch (e) {
            alert('Errore di connessione durante la creazione');
        }
    };

    const filteredKeys = keys.filter(k => 
        k.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        k.plan.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isAuthenticated) {
        return (
            <main className="mobile-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div className="card-solid animate-slide-up" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                    <ShieldCheck size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                    <h2 className="mb-6">Area Super Admin</h2>
                    <form onSubmit={handleLogin}>
                        <input 
                            type="password" 
                            className="custom-input mb-4" 
                            placeholder="Master Password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button type="submit" className="btn-glass-primary w-full shadow-lg">Accedi al Sistema</button>
                    </form>
                    <p className="mt-4 text-muted" style={{ fontSize: '0.8rem' }}>Riservato alla gestione interna licenze</p>
                </div>
            </main>
        );
    }

    return (
        <main className="mobile-container" style={{ maxWidth: '1000px', paddingBottom: '50px' }}>
            <div className="p-6 animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Link href="/admin" style={{ color: 'var(--text-primary)' }}><ArrowLeft /></Link>
                        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileSpreadsheet className="text-primary" /> License Manager
                        </h2>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={fetchKeys} className="btn-ghost" style={{ padding: '8px' }}><RefreshCw size={20} /></button>
                        <button onClick={() => setShowNewForm(true)} className="btn-glass-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                            <Plus size={18} className="mr-2 inline" /> Nuova Chiave
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="glass p-4 mb-6" style={{ borderRadius: '15px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flexGrow: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                        <input 
                            type="text" 
                            placeholder="Cerca per codice o piano..." 
                            className="custom-input" 
                            style={{ paddingLeft: '40px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                        Totale: <strong>{keys.length}</strong> licenze
                    </div>
                </div>

                {/* Table (Excel Style) */}
                <div className="glass" style={{ borderRadius: '15px', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '15px' }}>Codice Serial</th>
                                    <th style={{ textAlign: 'left', padding: '15px' }}>Piano</th>
                                    <th style={{ textAlign: 'center', padding: '15px' }}>Stato</th>
                                    <th style={{ textAlign: 'left', padding: '15px' }}>Data Creazione</th>
                                    <th style={{ textAlign: 'right', padding: '15px' }}>Azioni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>Caricamento dati...</td>
                                    </tr>
                                )}
                                {!loading && filteredKeys.map((k) => (
                                    <tr key={k.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="hover-row">
                                        <td style={{ padding: '15px', fontWeight: 600, fontFamily: 'monospace' }}>{k.id}</td>
                                        <td style={{ padding: '15px' }}>
                                            <span className={`badge ${k.plan}`}>
                                                {k.plan}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px', textAlign: 'center' }}>
                                            <button 
                                                onClick={() => handleToggleActive(k)}
                                                style={{ 
                                                    padding: '4px 12px', 
                                                    borderRadius: '20px', 
                                                    fontSize: '0.8rem',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    background: k.isActive ? '#dcfce7' : '#fee2e2',
                                                    color: k.isActive ? '#166534' : '#991b1b'
                                                }}
                                            >
                                                {k.isActive ? 'Attiva' : 'Disattivata'}
                                            </button>
                                        </td>
                                        <td style={{ padding: '15px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {new Date(k.createdAt).toLocaleDateString()} {new Date(k.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td style={{ padding: '15px', textAlign: 'right' }}>
                                            <button onClick={() => handleDelete(k.id)} className="btn-ghost" style={{ color: 'var(--danger)', padding: '5px' }}>
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal - Nuova Chiave */}
            {showNewForm && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                    <div className="card-solid animate-slide-up" style={{ width: '100%', maxWidth: '400px' }}>
                        <h3 className="mb-4">Genera Licenza Manuale</h3>
                        <form onSubmit={handleCreate}>
                            <div className="mb-4">
                                <label className="label">Serial Key (Manuale o Gen)</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input 
                                        type="text" 
                                        className="custom-input" 
                                        value={newKey.serialKey} 
                                        onChange={e => setNewKey({...newKey, serialKey: e.target.value})} 
                                        placeholder="ES. PRO-XYZ-TSMT" 
                                        required 
                                    />
                                    <button 
                                        type="button" 
                                        className="btn-ghost" 
                                        onClick={() => setNewKey({...newKey, serialKey: `${newKey.plan}-${Math.random().toString(36).substring(2, 7).toUpperCase()}-TSMT`})}
                                        title="Genera random"
                                    >
                                        <RefreshCw size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="label">Piano</label>
                                <select 
                                    className="custom-input" 
                                    value={newKey.plan}
                                    onChange={e => setNewKey({...newKey, plan: e.target.value})}
                                >
                                    <option value="FREE">FREE</option>
                                    <option value="PRO">PRO</option>
                                    <option value="ENTERPRISE">ENTERPRISE</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" onClick={() => setShowNewForm(false)} className="btn-glass-primary" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Annulla</button>
                                <button type="submit" className="btn-glass-primary">Salva Chiave</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .badge {
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    font-weight: bold;
                }
                .badge.FREE { background: #f3f4f6; color: #4b5563; }
                .badge.PRO { background: #dbeafe; color: #1e40af; }
                .badge.ENTERPRISE { background: #fef3c7; color: #92400e; }
                .hover-row:hover {
                    background: rgba(var(--primary-rgb), 0.05) !important;
                }
                th { 
                    color: var(--text-secondary); 
                    font-size: 0.8rem; 
                    text-transform: uppercase; 
                    letter-spacing: 0.05em; 
                    background: rgba(var(--primary-rgb), 0.05);
                }
                tr:nth-child(even) {
                    background: rgba(0,0,0,0.02);
                }
                input.custom-input:focus {
                    border-color: var(--primary);
                    box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.2);
                }
            `}</style>
        </main>
    );
}
