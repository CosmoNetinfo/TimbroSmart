'use client';
import { useState, useEffect } from 'react';

export default function LicenseManagement() {
    const [serialKey, setSerialKey] = useState('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (data.newPlan) {
                    setStatus((prev: any) => ({ ...prev, currentPlan: data.newPlan, status: 'ACTIVE' }));
                }
                fetchStatus();
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Activation Form */}
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 shadow-sm">
                <h4 className="font-bold text-on-surface mb-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">vpn_key</span> Attivazione Rapida
                </h4>
                <p className="text-secondary text-xs mb-4">Inserisci il codice seriale per attivare o aggiornare il tuo piano.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-secondary mb-1">Codice Seriale</label>
                        <input 
                            type="text" 
                            value={serialKey} 
                            onChange={e => {
                                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                                setSerialKey(val);
                            }}
                            placeholder="XXXX-XXXX-XXXX-XXXX"
                            className="w-full rounded-xl border-2 border-primary/30 px-4 py-3 text-center text-lg font-mono tracking-[4px] bg-white focus:ring-primary focus:border-primary"
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm active:scale-95 transition-all shadow-md shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[20px]">verified</span>
                        {loading ? 'Verifica in corso...' : 'Attiva Piano'}
                    </button>
                </form>
                <p className="text-xs text-secondary text-center mt-3 opacity-60">
                    Il piano viene aggiornato istantaneamente dopo la convalida.
                </p>
            </div>

            {/* Status Display */}
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
                <p className="text-[10px] uppercase tracking-[3px] font-bold text-secondary mb-2">Status Attuale</p>
                
                {status ? (
                    <>
                        <h2 className={`font-headline text-4xl font-extrabold ${
                            status.currentPlan === 'FREE' ? 'text-secondary' : 
                            status.currentPlan === 'PRO' ? 'text-primary' : 
                            'text-amber-600'
                        }`}>
                            {status.currentPlan}
                        </h2>
                        <p className="text-xs text-secondary font-medium mt-1">PLAN</p>
                        
                        {status.status && status.status === 'ACTIVE' && (
                            <div className="mt-4 inline-flex items-center gap-1.5 bg-tertiary/10 text-tertiary px-4 py-1.5 rounded-full text-xs font-bold">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                LICENZA ATTIVA
                            </div>
                        )}

                        <div className="mt-6 w-full border-t border-outline-variant/20 pt-4 space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-secondary">Dispositivi</span>
                                <span className="font-bold text-on-surface">Illimitati</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-secondary">Supporto</span>
                                <span className="font-bold text-on-surface">{status.currentPlan === 'ENTERPRISE' ? 'Prioritario 24/7' : 'Standard'}</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center gap-2 text-secondary">
                        <span className="material-symbols-outlined animate-spin text-xl">refresh</span>
                        <span className="text-sm">Sincronizzazione...</span>
                    </div>
                )}
            </div>
        </div>
    );
}
