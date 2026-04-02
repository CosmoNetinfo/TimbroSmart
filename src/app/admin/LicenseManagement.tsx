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
        <>
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

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {/* FREE */}
                <div className={`bg-surface-container-lowest border rounded-2xl p-6 shadow-sm text-center ${status?.currentPlan === 'FREE' ? 'border-primary/40 ring-2 ring-primary/10' : 'border-outline-variant/20'}`}>
                    {status?.currentPlan === 'FREE' && (
                        <span className="inline-block bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">Piano Attuale</span>
                    )}
                    <h3 className="font-headline text-xl font-extrabold text-on-surface">FREE</h3>
                    <div className="mt-2 mb-4">
                        <span className="font-headline text-3xl font-extrabold text-on-surface">€0</span>
                    </div>
                    <ul className="text-xs text-secondary space-y-2 text-left">
                        <li className="flex items-center gap-2"><span className="material-symbols-outlined text-tertiary text-[16px]">check</span> Timbrature illimitate</li>
                        <li className="flex items-center gap-2"><span className="material-symbols-outlined text-tertiary text-[16px]">check</span> Fino a 5 dipendenti</li>
                        <li className="flex items-center gap-2"><span className="material-symbols-outlined text-tertiary text-[16px]">check</span> Export CSV</li>
                        <li className="flex items-center gap-2 opacity-40"><span className="material-symbols-outlined text-[16px]">close</span> Gestione Pagamenti</li>
                        <li className="flex items-center gap-2 opacity-40"><span className="material-symbols-outlined text-[16px]">close</span> Export PDF Busta Paga</li>
                    </ul>
                </div>

                {/* PRO */}
                <div className={`bg-surface-container-lowest border rounded-2xl p-6 shadow-sm text-center relative ${status?.currentPlan === 'PRO' ? 'border-primary/40 ring-2 ring-primary/10' : 'border-outline-variant/20'}`}>
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-full shadow-md">Consigliato</span>
                    {status?.currentPlan === 'PRO' && (
                        <span className="inline-block bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3 mt-2">Piano Attuale</span>
                    )}
                    <h3 className="font-headline text-xl font-extrabold text-primary mt-2">PRO</h3>
                    <div className="mt-2 mb-1">
                        <span className="font-headline text-3xl font-extrabold text-on-surface">€4,99</span>
                        <span className="text-secondary text-xs font-bold ml-1">ogni 12 mesi</span>
                    </div>
                    <p className="text-[10px] text-secondary mb-4 font-bold">Prezzo totale per un anno</p>
                    <ul className="text-xs text-secondary space-y-2 text-left">
                        <li className="flex items-center gap-2"><span className="material-symbols-outlined text-tertiary text-[16px]">check</span> Tutto del piano FREE</li>
                        <li className="flex items-center gap-2"><span className="material-symbols-outlined text-tertiary text-[16px]">check</span> Dipendenti illimitati</li>
                        <li className="flex items-center gap-2"><span className="material-symbols-outlined text-tertiary text-[16px]">check</span> Gestione Pagamenti</li>
                        <li className="flex items-center gap-2"><span className="material-symbols-outlined text-tertiary text-[16px]">check</span> Export PDF Busta Paga</li>
                        <li className="flex items-center gap-2"><span className="material-symbols-outlined text-tertiary text-[16px]">check</span> Calendario Aziendale</li>
                    </ul>
                </div>

                {/* ENTERPRISE */}
                <div className={`bg-surface-container-lowest border rounded-2xl p-6 shadow-sm text-center ${status?.currentPlan === 'ENTERPRISE' ? 'border-amber-400/40 ring-2 ring-amber-400/10' : 'border-outline-variant/20'}`}>
                    {status?.currentPlan === 'ENTERPRISE' && (
                        <span className="inline-block bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">Piano Attuale</span>
                    )}
                    <h3 className="font-headline text-xl font-extrabold text-amber-600">ENTERPRISE</h3>
                    <div className="mt-2 mb-1">
                        <span className="font-headline text-3xl font-extrabold text-on-surface">€9,99</span>
                        <span className="text-secondary text-xs font-bold ml-1">ogni 12 mesi</span>
                    </div>
                    <p className="text-[10px] text-secondary mb-4 font-bold">Prezzo totale per un anno</p>
                    <ul className="text-xs text-secondary space-y-2 text-left">
                        <li className="flex items-center gap-2"><span className="material-symbols-outlined text-tertiary text-[16px]">check</span> Tutto del piano PRO</li>
                        <li className="flex items-center gap-2"><span className="material-symbols-outlined text-tertiary text-[16px]">check</span> Supporto Prioritario 24/7</li>
                        <li className="flex items-center gap-2"><span className="material-symbols-outlined text-tertiary text-[16px]">check</span> Multi-sede</li>
                        <li className="flex items-center gap-2"><span className="material-symbols-outlined text-tertiary text-[16px]">check</span> Account Manager dedicato</li>
                        <li className="flex items-center gap-2"><span className="material-symbols-outlined text-tertiary text-[16px]">check</span> API Personalizzate</li>
                    </ul>
                </div>
            </div>
        </>
    );
}
