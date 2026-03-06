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
                alert('Seriale inviato! Verrà convalidato a breve.');
                setSerialKey('');
                fetchStatus();
            } else {
                const data = await res.json();
                alert(data.error || 'Errore durante l\'invio');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card mb-8 animate-slide-up">
            <h3 className="mb-4">🔑 Gestione Licenza Pro/Enterprise</h3>
            <p className="text-muted mb-6">Inserisci il tuo codice seriale per sbloccare le funzionalità avanzate.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div>
                    <form onSubmit={handleSubmit}>
                        <label className="label">Codice Seriale</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <input 
                                type="text" 
                                value={serialKey} 
                                onChange={e => setSerialKey(e.target.value)}
                                placeholder="XXXX-XXXX-XXXX-XXXX"
                                style={{ flex: 1, letterSpacing: '2px', textTransform: 'uppercase' }}
                                required
                            />
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? '...' : 'Attiva'}
                            </button>
                        </div>
                    </form>
                </div>

                <div style={{ background: 'var(--surface-alt)', padding: '1.5rem', borderRadius: '12px' }}>
                    <h4 className="mb-2">Stato Abbonamento</h4>
                    {status ? (
                        <div>
                            <div className="mb-2">Piano Attuale: <strong style={{ color: 'var(--accent)', fontSize: '1.2rem' }}>{status.currentPlan || 'FREE'}</strong></div>
                            {status.status && status.status !== 'NONE' && (
                                <div style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
                                    Ultima Richiesta: <span className="status-badge" style={{ 
                                        background: status.status === 'PENDING' ? '#fef3c7' : '#d1fae5', 
                                        color: status.status === 'PENDING' ? '#92400e' : '#065f46', 
                                        padding: '4px 10px', 
                                        borderRadius: '6px',
                                        fontWeight: 600
                                    }}>
                                        {status.status}
                                    </span>
                                    <div className="text-muted mt-2">Seriale: {status.serialKey}</div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-muted italic">Recupero informazioni...</p>
                    )}
                </div>

            </div>
        </div>
    );
}
