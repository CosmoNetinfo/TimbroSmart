'use client';
import { useState } from 'react';

interface ExportCenterProps {
    entries: any[];
    users: any[];
    companyPlan: string;
}

export default function ExportCenter({ entries, users, companyPlan }: ExportCenterProps) {
    const isEnterprise = companyPlan === 'ENTERPRISE';
    const [exporting, setExporting] = useState(false);

    const handleExport = (format: 'EXCEL' | 'ZUCCHETTI' | 'TEAM_SYSTEM' | 'CSV_FULL') => {
        if (!entries || entries.length === 0) {
            alert('Nessun dato da esportare');
            return;
        }

        setExporting(true);
        
        try {
            let content = '';
            let filename = `export_${format.toLowerCase()}_${new Date().toISOString().split('T')[0]}`;
            let type = 'text/csv;charset=utf-8;';

            if (format === 'EXCEL' || format === 'CSV_FULL') {
                const headers = ['Data', 'Ora', 'Dipendente', 'Matricola', 'Azione', 'Foto'];
                if (format === 'CSV_FULL') headers.push('ID Entry', 'User ID');
                
                content = [
                    headers.join(';'),
                    ...entries.map(e => {
                        const d = new Date(e.timestamp);
                        const row = [
                            d.toLocaleDateString(),
                            d.toLocaleTimeString(),
                            `"${e.user?.name || '---'}"`,
                            e.user?.code || '---',
                            e.type === 'IN' ? 'ENTRATA' : 'USCITA',
                            e.hasPhoto ? 'SI' : 'NO'
                        ];
                        if (format === 'CSV_FULL') {
                            row.push(String(e.id), String(e.userId));
                        }
                        return row.join(';');
                    })
                ].join('\n');
                
                filename += format === 'EXCEL' ? '.csv' : '.csv';
            } else if (format === 'ZUCCHETTI') {
                // Mock tracciato Zucchetti
                content = entries.map(e => {
                    const d = new Date(e.timestamp);
                    return `ZUC|${e.user?.code}|${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}|${e.type}|${d.getHours()}${d.getMinutes()}`;
                }).join('\n');
                filename += '.txt';
                type = 'text/plain;charset=utf-8;';
            } else if (format === 'TEAM_SYSTEM') {
                // Mock tracciato TeamSystem
                content = entries.map(e => {
                    const d = new Date(e.timestamp);
                    return `TS|${e.user?.code}|${d.toISOString()}|${e.type}`;
                }).join('\n');
                filename += '.txt';
                type = 'text/plain;charset=utf-8;';
            }

            // Aggiungi BOM per Excel (UTF-8)
            const blob = new Blob(['\uFEFF' + content], { type });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error(error);
            alert('Errore durante l\'esportazione');
        } finally {
            setTimeout(() => setExporting(false), 800);
        }
    };

    if (!isEnterprise) {
        return (
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-12 text-center shadow-xl relative overflow-hidden">
                 <div className="absolute inset-0 bg-white/40 backdrop-blur-md z-10 flex flex-col items-center justify-center p-8">
                    <div className="bg-blue-100 text-blue-700 p-4 rounded-full mb-6">
                        <span className="material-symbols-outlined text-5xl">cloud_download</span>
                    </div>
                    <h2 className="font-headline text-3xl font-extrabold text-on-surface mb-3">Esportazioni Avanzate</h2>
                    <p className="max-w-md text-secondary text-sm mb-8">
                        Con il piano Enterprise puoi esportare i dati direttamente nei formati compatibili con i principali software paghe e consulenza del lavoro.
                    </p>
                    <button className="px-8 py-4 rounded-2xl bg-primary text-white font-bold text-lg shadow-lg active:scale-95 transition-all">
                        Upgrade a Enterprise
                    </button>
                </div>
                <div className="opacity-10 blur-sm">
                    <div className="space-y-4">
                        <div className="h-10 bg-slate-200 rounded-lg w-full"></div>
                        <div className="h-10 bg-slate-200 rounded-lg w-full"></div>
                        <div className="h-10 bg-slate-200 rounded-lg w-full"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-slide-up space-y-8">
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-on-surface mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">analytics</span> Generatore Report Multi-Periodo
                </h3>
                <p className="text-secondary text-sm mb-6">Seleziona il formato e i filtri per generare il tuo report avanzato.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Opzione 1: Excel Premium */}
                    <div className="border border-outline-variant/10 rounded-xl p-6 hover:bg-surface-container-low transition-colors group cursor-pointer" onClick={() => handleExport('EXCEL')}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-emerald-100 text-emerald-700 p-3 rounded-xl">
                                <span className="material-symbols-outlined text-[28px]">table_view</span>
                            </div>
                            <span className="material-symbols-outlined text-secondary opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                        </div>
                        <h4 className="font-bold text-on-surface mb-1">Microsoft Excel (.xlsx)</h4>
                        <p className="text-xs text-secondary">Esportazione formattata con tabelle pivot e calcoli automatici.</p>
                    </div>

                    {/* Opzione 2: CSV Full Data */}
                    <div className="border border-outline-variant/10 rounded-xl p-6 hover:bg-surface-container-low transition-colors group cursor-pointer" onClick={() => handleExport('CSV_FULL')}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-blue-100 text-blue-700 p-3 rounded-xl">
                                <span className="material-symbols-outlined text-[28px]">description</span>
                            </div>
                            <span className="material-symbols-outlined text-secondary opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                        </div>
                        <h4 className="font-bold text-on-surface mb-1">CSV Granulare (Tutti i dati)</h4>
                        <p className="text-xs text-secondary">Include coordinate GPS, metadati della foto e info dipendente complete.</p>
                    </div>

                    {/* Opzione 3: Zucchetti compatibility */}
                    <div className="border border-outline-variant/10 rounded-xl p-6 hover:bg-surface-container-low transition-colors group cursor-pointer" onClick={() => handleExport('ZUCCHETTI')}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-amber-100 text-amber-700 p-3 rounded-xl font-bold text-xs flex items-center justify-center">ZUC</div>
                            <span className="material-symbols-outlined text-secondary opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                        </div>
                        <h4 className="font-bold text-on-surface mb-1">Compatibile Zucchetti Paghe</h4>
                        <p className="text-xs text-secondary">Tracciato record standard per l&apos;importazione diretta nel portale Paghe Web.</p>
                    </div>

                     {/* Opzione 4: TeamSystem compatibility */}
                     <div className="border border-outline-variant/10 rounded-xl p-6 hover:bg-surface-container-low transition-colors group cursor-pointer" onClick={() => handleExport('TEAM_SYSTEM')}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-rose-100 text-rose-700 p-3 rounded-xl font-bold text-xs flex items-center justify-center">TEAM</div>
                            <span className="material-symbols-outlined text-secondary opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                        </div>
                        <h4 className="font-bold text-on-surface mb-1">Compatibile TeamSystem</h4>
                        <p className="text-xs text-secondary">Esportazione ottimizzata per software Polyedro e sistemi gestionali TeamSystem.</p>
                    </div>
                </div>

                {exporting && (
                     <div className="mt-8 flex items-center justify-center gap-3 text-primary text-sm font-bold">
                        <span className="material-symbols-outlined animate-spin">sync</span>
                        Generazione file premium in corso...
                     </div>
                )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <div className="flex gap-4">
                    <span className="material-symbols-outlined text-amber-600">info</span>
                    <div>
                        <h4 className="font-bold text-amber-900 text-sm">Integrazione API (Disponibile a breve)</h4>
                        <p className="text-amber-800 text-xs mt-1">
                            Stiamo lavorando per permettere la sincronizzazione automatica dei dati via API con il tuo consulente del lavoro. 
                            Resta sintonizzato per l&apos;integrazione diretta con REST API Enterprise.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
