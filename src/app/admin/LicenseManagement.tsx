'use client';
import { useState, useEffect } from 'react';

export default function LicenseManagement() {
    const [serialKey, setSerialKey] = useState('');
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/admin/license');
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/admin/license', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serialKey: serialKey })
            });


            if (res.ok) {
                const data = await res.json();
                alert(data.message || 'Fantastico! Il piano è stato attivato.');
                setSerialKey('');
                // Forza un aggiornamento immediato dello stato locale
                if (data.newPlan) {
                    setStatus((prev: any) => ({ ...prev, currentPlan: data.newPlan, status: 'ACTIVE' }));
                }
                fetchStatus();
                // Opzionale: ricarica la pagina per aggiornare l'header
                window.location.reload();
            } else {
                const data = await res.json();
                alert(data.error || 'Errore durante l\'attivazione');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card mb-8 animate-slide-up" style={{ background: 'linear-gradient(145deg, var(--surface), var(--surface-alt))', border: '1px solid var(--accent-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '2rem' }}>💎</div>
                <div>
                    <h3 style={{ margin: 0 }}>Gestione Licenza & Piani</h3>
                    <p className="text-muted" style={{ fontSize: '0.9rem' }}>Attiva le funzionalità avanzate del tuo ecosistema TimbroSmart.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div className="card" style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--border)' }}>
                    <h4 className="mb-4">Attivazione Rapida</h4>
                    <form onSubmit={handleSubmit}>
                        <label className="label">Codice Seriale (XXXX-XXXX-XXXX-XXXX)</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input 
                                type="text" 
                                value={serialKey} 
                                onChange={e => {
                                    // Auto-format: CAPITALS and Hyphens
                                    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                                    setSerialKey(val);
                                }}
                                placeholder="INSERISCI SERIALE..."
                                style={{ 
                                    fontSize: '1.2rem', 
                                    textAlign: 'center', 
                                    letterSpacing: '4px', 
                                    padding: '1rem',
                                    background: 'var(--surface)',
                                    border: '2px solid var(--accent)',
                                    borderRadius: '12px',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                                }}
                                required
                            />
                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
                                {loading ? 'Verifica in corso...' : '✨ Attiva Piano Ora'}
                            </button>
                        </div>
                    </form>
                    <p style={{ fontSize: '0.8rem', marginTop: '1rem', textAlign: 'center' }} className="text-muted">
                        Il piano verrà aggiornato istantaneamente dopo la convalida del codice.
                    </p>
                </div>

                <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Status Attuale</div>
                    {status ? (
                        <>
                            <div style={{ 
                                fontSize: '2.5rem', 
                                fontWeight: 900, 
                                color: status.currentPlan === 'FREE' ? 'var(--text-secondary)' : status.currentPlan === 'PRO' ? 'var(--accent)' : '#d97706',
                                textShadow: '0 0 20px rgba(59, 130, 246, 0.2)'
                            }}>
                                {status.currentPlan} PLAN
                            </div>
                            
                            {status.status && status.status === 'ACTIVE' && (
                                <div style={{ marginTop: '1rem', padding: '6px 12px', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>
                                    ✓ LICENZA ATTIVA
                                </div>
                            )}

                            <div style={{ marginTop: '1.5rem', width: '100%', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                    <span className="text-muted">Dispositivi:</span>
                                    <span>Illimitati</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                    <span className="text-muted">Supporto:</span>
                                    <span>{status.currentPlan === 'ENTERPRISE' ? 'Prioritario 24/7' : 'Standard'}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="animate-pulse text-muted">Sincronizzazione...</div>
                    )}
                </div>
            </div>
        </div>
    );
}
