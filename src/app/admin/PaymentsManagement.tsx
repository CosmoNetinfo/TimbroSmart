'use client';
import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Payment {
    id: string | number;
    amount: number;
    paymentDate: string;
    periodStart: string;
    periodEnd: string;
    notes?: string;
    userId: string | number;
    user: {
        name: string;
        code: string;
    };
}

interface User {
    id: string | number;
    name: string;
    code: string;
}

interface PaymentsManagementProps {
    users: User[];
}

export default function PaymentsManagement({ users }: PaymentsManagementProps) {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);

    // Form state
    const [selectedUserId, setSelectedUserId] = useState('');
    const [amount, setAmount] = useState('');
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');
    const [notes, setNotes] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchAllPayments();
    }, []);

    // Auto-calculate amount when userId and period changes
    useEffect(() => {
        const calculateAmount = async () => {
            if (!selectedUserId || !periodStart || !periodEnd) return;

            try {
                const res = await fetch(`/api/history?userId=${selectedUserId}`);
                if (res.ok) {
                    const data = await res.json();
                    
                    const entries = Array.isArray(data) ? data : (data.entries ?? []);
                    const hourlyWage = Array.isArray(data) ? 7.0 : (data.hourlyWage ?? 7.0);

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const sorted = [...entries].sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                    let totalEuros = 0;
                    const startBoundary = new Date(periodStart + 'T00:00:00');
                    const endBoundary = new Date(periodEnd + 'T23:59:59');

                    for (let i = 0; i < sorted.length; i++) {
                        const current = sorted[i];
                        const next = sorted[i + 1];

                        if (current.type === 'IN' && next && next.type === 'OUT') {
                            const start = new Date(current.timestamp);
                            if (start >= startBoundary && start <= endBoundary) {
                                const end = new Date(next.timestamp);
                                const diff = end.getTime() - start.getTime();
                                const hours = Math.max(0, diff / (1000 * 60 * 60));
                                totalEuros += hours * hourlyWage;
                            }
                            i++; // skip next since it's OUT
                        }
                    }

                    setAmount(totalEuros.toFixed(2));
                }
            } catch (error) {
                console.error("Error calculating amount:", error);
            }
        };

        const timerId = setTimeout(() => {
            calculateAmount();
        }, 300);

        return () => clearTimeout(timerId);
    }, [selectedUserId, periodStart, periodEnd]);

    const fetchAllPayments = async () => {
        setLoading(true);
        try {
            const allPayments: Payment[] = [];
            for (const user of users) {
                const res = await fetch(`/api/payments?userId=${user.id}`);
                if (res.ok) {
                    const data = await res.json();
                    allPayments.push(...data.payments.map((p: Payment) => ({
                        ...p,
                        user: { name: user.name, code: user.code }
                    })));
                }
            }
            allPayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
            setPayments(allPayments);
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId || !amount || !periodStart || !periodEnd) {
            alert('Compila tutti i campi obbligatori');
            return;
        }

        try {
            const res = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedUserId,
                    amount: parseFloat(amount),
                    periodStart,
                    periodEnd,
                    paymentDate,
                    notes: notes || null
                })
            });

            if (res.ok) {
                alert('Pagamento registrato con successo!');
                setShowAddForm(false);
                setSelectedUserId('');
                setAmount('');
                setPeriodStart('');
                setPeriodEnd('');
                setNotes('');
                setPaymentDate(new Date().toISOString().split('T')[0]);
                fetchAllPayments();
            } else {
                alert('Errore durante la registrazione del pagamento');
            }
        } catch {
            alert('Errore di connessione');
        }
    };

    const handleDeletePayment = async (paymentId: string | number) => {
        if (!confirm('Sei sicuro di voler eliminare questo pagamento?')) return;

        try {
            const res = await fetch(`/api/payments?paymentId=${paymentId}`, { method: 'DELETE' });

            if (res.ok) {
                alert('Pagamento eliminato');
                fetchAllPayments();
            } else {
                alert('Errore durante l\'eliminazione');
            }
        } catch {
            alert('Errore di connessione');
        }
    };

    const handleDownloadPDF = (payment: Payment) => {
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(18);
        doc.setTextColor(0, 86, 210);
        doc.setFont("helvetica", "bold");
        doc.text("CEDOLINO PAGAMENTO", 105, 20, { align: "center" });
        
        doc.setDrawColor(200);
        doc.line(20, 25, 190, 25);
        
        // Info Box
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.setFont("helvetica", "normal");
        doc.text("Dipendente:", 20, 35);
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.text(String(payment.user.name), 20, 42);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Matricola: ${payment.user.code}`, 20, 48);
        
        doc.text("Data Emissione:", 140, 35);
        doc.setFont("helvetica", "bold");
        doc.text(formatDate(payment.paymentDate), 140, 42);
        
        // Table of Details
        autoTable(doc, {
            startY: 60,
            head: [['Descrizione', 'Dettagli']],
            body: [
                ['Periodo di Riferimento', `${formatDate(payment.periodStart)} - ${formatDate(payment.periodEnd)}`],
                ['Metodo', 'Bonifico Bancario'],
                ['Note', payment.notes || 'Nessuna nota'],
                ['Stato', 'SALDATO']
            ],
            theme: 'striped',
            headStyles: { fillColor: [0, 86, 210] }
        });
        
        // Final Amount
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("TOTALE NETTO", 140, finalY);
        doc.setFontSize(22);
        doc.setTextColor(20, 150, 80);
        doc.text(formatCurrency(payment.amount), 140, finalY + 10);
        
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("TimbroSmart - Generato automaticamente", 105, 280, { align: "center" });
        
        doc.save(`cedolino_${payment.user.code}_${payment.paymentDate}.pdf`);
    };

    const handleExportExcel = () => {
        if (payments.length === 0) return;
        
        const headers = ['Data Pagamento', 'Dipendente', 'Matricola', 'Importo', 'Periodo Inizio', 'Periodo Fine', 'Note'];
        const csvContent = [
            headers.join(';'),
            ...payments.map(p => [
                p.paymentDate,
                `"${p.user.name}"`,
                p.user.code,
                p.amount.toString().replace('.', ','),
                p.periodStart,
                p.periodEnd,
                `"${p.notes || ''}"`
            ].join(';'))
        ].join('\n');
        
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `report_pagamenti_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR'
        }).format(value);
    };

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-tertiary/10 text-tertiary p-3 rounded-xl">
                        <span className="material-symbols-outlined text-[28px]">euro</span>
                    </div>
                    <div>
                        <p className="text-secondary text-xs font-bold uppercase tracking-wider">Totale Pagato</p>
                        <h2 className="font-headline text-2xl font-extrabold text-tertiary">{formatCurrency(totalPaid)}</h2>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleExportExcel}
                        disabled={payments.length === 0}
                        className="px-5 py-3 rounded-xl border border-outline-variant text-secondary font-bold active:scale-95 transition-all flex items-center gap-2 hover:bg-surface-container-low disabled:opacity-40"
                    >
                        <span className="material-symbols-outlined text-[20px]">table_view</span>
                        Esporta Excel
                    </button>
                    <button 
                        onClick={() => setShowAddForm(!showAddForm)} 
                        className="px-5 py-3 rounded-xl bg-primary text-white font-bold active:scale-95 transition-all shadow-md shadow-primary/20 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[20px]">{showAddForm ? 'close' : 'add'}</span>
                        {showAddForm ? 'Annulla' : 'Nuovo Pagamento'}
                    </button>
                </div>
            </div>

            {/* Add Payment Form */}
            {showAddForm && (
                <div className="bg-surface-container-lowest border border-primary/20 rounded-2xl p-6 mb-6 shadow-sm animate-slide-up">
                    <h4 className="font-bold text-on-surface mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">receipt_long</span> Registra Pagamento
                    </h4>
                    <form onSubmit={handleAddPayment} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-secondary mb-1">Dipendente *</label>
                                <select 
                                    value={selectedUserId} 
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    required
                                    title="Seleziona dipendente"
                                    className="w-full rounded-lg border-outline-variant px-3 py-2.5 text-sm bg-white"
                                >
                                    <option value="">Seleziona dipendente</option>
                                    {users.filter(u => u.id !== 1).map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} ({user.code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-secondary mb-1">Importo (€) *</label>
                                <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Calcolato automaticamente" required className="w-full rounded-lg border-outline-variant px-3 py-2.5 text-sm bg-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-secondary mb-1">Data Pagamento *</label>
                                <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required className="w-full rounded-lg border-outline-variant px-3 py-2.5 text-sm bg-white" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-secondary mb-1">Periodo Dal *</label>
                                <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required className="w-full rounded-lg border-outline-variant px-3 py-2.5 text-sm bg-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-secondary mb-1">Periodo Al *</label>
                                <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} required className="w-full rounded-lg border-outline-variant px-3 py-2.5 text-sm bg-white" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-secondary mb-1">Note (opzionale)</label>
                            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Note aggiuntive..." rows={2} className="w-full rounded-lg border-outline-variant px-3 py-2.5 text-sm bg-white resize-vertical" />
                        </div>
                        <button type="submit" className="px-6 py-3 rounded-xl bg-tertiary text-white font-bold active:scale-95 transition-all flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px]">save</span> Salva Pagamento
                        </button>
                    </form>
                </div>
            )}

            {/* Payments List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span>
                </div>
            ) : payments.length === 0 ? (
                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-12 text-center shadow-sm">
                    <span className="material-symbols-outlined text-5xl text-secondary mb-3">account_balance_wallet</span>
                    <h4 className="font-bold text-on-surface text-lg mb-1">Nessun pagamento</h4>
                    <p className="text-secondary text-sm">Clicca su &quot;Nuovo Pagamento&quot; per registrare il primo.</p>
                </div>
            ) : (
                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-surface-container-low border-b border-outline-variant/20">
                                    <th className="text-left px-5 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Data</th>
                                    <th className="text-left px-5 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Dipendente</th>
                                    <th className="text-left px-5 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Periodo</th>
                                    <th className="text-left px-5 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Importo</th>
                                    <th className="text-left px-5 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Note</th>
                                    <th className="text-left px-5 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Azioni</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10">
                                {payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-surface-container-low transition-colors">
                                        <td className="px-5 py-3 font-medium text-on-surface">{formatDate(payment.paymentDate)}</td>
                                        <td className="px-5 py-3">
                                            <p className="font-bold text-on-surface">{payment.user.name}</p>
                                            <p className="text-xs text-secondary">{payment.user.code}</p>
                                        </td>
                                        <td className="px-5 py-3 text-xs">
                                            <span className="text-on-surface">{formatDate(payment.periodStart)}</span>
                                            <span className="text-secondary mx-1">→</span>
                                            <span className="text-on-surface">{formatDate(payment.periodEnd)}</span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="font-extrabold text-tertiary text-base">{formatCurrency(payment.amount)}</span>
                                        </td>
                                        <td className="px-5 py-3 text-secondary text-xs max-w-[200px] truncate">
                                            {payment.notes || <span className="opacity-40">—</span>}
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex gap-1">
                                               <button
                                                   onClick={() => handleDownloadPDF(payment)}
                                                   className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                                                   title="Scarica Cedolino PDF"
                                               >
                                                   <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                                               </button>
                                               <button
                                                   onClick={() => handleDeletePayment(payment.id)}
                                                   className="p-1.5 rounded-lg hover:bg-error/10 text-error transition-colors"
                                                   title="Elimina"
                                               >
                                                   <span className="material-symbols-outlined text-[18px]">delete</span>
                                               </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
