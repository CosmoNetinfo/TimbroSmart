'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Calendar, Wallet, LogOut, Home } from 'lucide-react';
import { applyBranding } from '@/lib/utils/branding';
import Link from 'next/link';

interface Payment {
    id: number;
    amount: number;
    paymentDate: string;
    periodStart: string;
    periodEnd: string;
    notes?: string;
}

interface User {
    id: number;
    name: string;
    code: string;
    role: string;
}

export default function PaymentsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalEarned, setTotalEarned] = useState(0);
    const [companySettings, setCompanySettings] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const stored = localStorage.getItem('user_meta');
        if (!stored) {
            router.push('/');
            return;
        }
        try {
            const parsedUser = JSON.parse(stored);
            setUser(parsedUser);
            fetchPayments(parsedUser.id);
            fetchCompanySettings();
        } catch {
            router.push('/');
        }
    }, [router]);

    const fetchCompanySettings = async () => {
        try {
            const res = await fetch('/api/company/public-settings');
            if (res.ok) {
                const data = await res.json();
                setCompanySettings(data);
                applyBranding(data.primaryColor);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchPayments = async (userId: number) => {
        try {
            const res = await fetch(`/api/payments?userId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setPayments(data.payments);
                const total = data.payments.reduce((sum: number, p: Payment) => sum + p.amount, 0);
                setTotalEarned(total);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    const handleLogout = () => {
        localStorage.removeItem('user_meta');
        router.push('/');
    };

    if (!user) return null;

    return (
        <div className="bg-surface font-body text-on-surface min-h-screen pb-28">
            
            {/* TopAppBar */}
            <header className="w-full top-0 sticky z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-6 h-16 shadow-sm border-b border-outline-variant/20">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex flex-col">
                        <span className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold">
                            {companySettings?.name || 'TimbroSmart'}
                        </span>
                        <h1 className="font-headline font-bold text-lg text-on-surface leading-none">Buste Paga</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 md:px-6 pt-6">
                
                {/* Total Earned Card */}
                <div className="mb-8 animate-slide-up">
                    <div className="bg-gradient-to-br from-tertiary to-tertiary-container text-on-tertiary rounded-3xl p-6 relative overflow-hidden shadow-md flex flex-col min-h-[140px]">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2"></div>
                        <p className="font-label text-xs uppercase tracking-widest font-bold opacity-80 mb-2">Totale Guadagnato Finora</p>
                        
                        <div className="flex items-end gap-4 mt-auto">
                            <div>
                                <h2 className="font-headline text-4xl font-extrabold tracking-tight">
                                    {formatCurrency(totalEarned)}
                                </h2>
                                <p className="opacity-90 font-medium text-sm mt-1">{payments.length} {payments.length === 1 ? 'pagamento ricevuto' : 'pagamenti ricevuti'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payments List */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span>
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-8 text-center shadow-sm">
                            <span className="material-symbols-outlined text-4xl text-secondary mb-2">account_balance_wallet</span>
                            <h3 className="font-bold text-lg text-on-surface mb-1">Nessun pagamento</h3>
                            <p className="text-secondary text-sm">Non hai ancora ricevuto pagamenti.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {payments.map((payment, index) => (
                                <div 
                                    key={payment.id} 
                                    className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow animate-slide-up relative overflow-hidden group"
                                    style={{ animationDelay: `${(index + 1) * 100}ms` }}
                                >
                                    {/* Left accent bar */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-tertiary group-hover:bg-primary transition-colors"></div>

                                    <div className="flex justify-between items-start mb-4 pl-2">
                                        <div>
                                            <h3 className="font-headline text-2xl font-extrabold text-on-surface">
                                                {formatCurrency(payment.amount)}
                                            </h3>
                                            <p className="text-secondary font-medium text-sm flex items-center gap-1 mt-1">
                                                <span className="material-symbols-outlined text-[16px]">task_alt</span>
                                                Pagato il {formatDate(payment.paymentDate)}
                                            </p>
                                        </div>
                                        <div className="bg-tertiary/10 text-tertiary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                            Saldato
                                        </div>
                                    </div>

                                    <div className="bg-surface-container-low rounded-xl p-3 flex flex-col gap-2 pl-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-semibold text-secondary">Periodo d'opera</span>
                                            <span className="font-bold text-on-surface flex items-center gap-1">
                                                {formatDate(payment.periodStart)} 
                                                <span className="material-symbols-outlined text-[14px] text-secondary/50">arrow_forward</span> 
                                                {formatDate(payment.periodEnd)}
                                            </span>
                                        </div>
                                        {payment.notes && (
                                            <div className="pt-2 mt-2 border-t border-outline-variant/20">
                                                <p className="text-sm text-secondary flex items-start gap-1">
                                                    <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5 text-primary">chat</span>
                                                    <span className="italic">"{payment.notes}"</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-2 pb-6 pt-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-[#c3c6d6]/20 shadow-[0_-12px_32px_rgba(23,28,31,0.06)] z-50 rounded-t-2xl">
                <Link href="/dashboard" className="cursor-pointer flex flex-col items-center justify-center text-slate-500 hover:text-primary px-2 py-1 transition-transform duration-300 active:scale-95">
                    <Home size={22} />
                    <span className="font-label text-[10px] sm:text-[11px] font-medium">Home</span>
                </Link>
                <Link href="/dashboard/calendar" className="flex flex-col items-center justify-center text-slate-500 hover:text-primary px-2 py-1 transition-transform duration-300 active:scale-95">
                    <Calendar size={22} />
                    <span className="font-label text-[10px] sm:text-[11px] font-medium">Ferie</span>
                </Link>
                <Link href="/dashboard/history" className="flex flex-col items-center justify-center text-slate-500 hover:text-primary px-2 py-1 transition-transform duration-300 active:scale-95">
                    <Clock size={22} />
                    <span className="font-label text-[10px] sm:text-[11px] font-medium">Storico</span>
                </Link>
                <div className="flex flex-col items-center justify-center bg-primary/10 text-primary rounded-xl px-4 py-1 transition-transform duration-300 active:scale-95">
                    <Wallet size={22} />
                    <span className="font-label text-[10px] sm:text-[11px] font-bold">Paga</span>
                </div>
                <div onClick={handleLogout} className="cursor-pointer flex flex-col items-center justify-center text-slate-500 hover:text-primary px-2 py-1 transition-transform duration-300 active:scale-95">
                    <LogOut size={22} />
                    <span className="font-label text-[10px] sm:text-[11px] font-medium">Esci</span>
                </div>
            </nav>
        </div>
    );
}
