'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, Calendar, Wallet } from 'lucide-react';

interface DashboardUser {
    id: number;
    name: string;
    code: string;
    profileImage?: string;
}

export default function Dashboard() {
    const [user, setUser] = useState<DashboardUser | null>(null);
    const [status, setStatus] = useState('LOADING'); // IN, OUT, LOADING
    const [lastEntry, setLastEntry] = useState<{ timestamp: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const stored = localStorage.getItem('user_meta');
        if (!stored) {
            router.push('/');
            return;
        }
        const parsedUser = JSON.parse(stored);
        setUser(parsedUser);
        fetchStatus(parsedUser.id);
    }, []);

    const fetchStatus = async (userId: number) => {
        try {
            const res = await fetch(`/api/status?userId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setStatus(data.status); // IN or OUT
                setLastEntry(data.lastEntry);
            } else {
                console.warn('Status fetch failed:', res.status);
                setStatus('OUT'); 
            }
        } catch (e) {
            console.error(e);
            setStatus('OUT');
        }
    };

    const handleNativeClock = async (type: 'IN' | 'OUT', file: File) => {
        if (!user) return;
        setLoading(true);

        try {
            const compressedFile = await new Promise<File>((resolve) => {
                const img = new Image();
                img.src = URL.createObjectURL(file);
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 300;
                    const scaleSize = MAX_WIDTH / img.width;
                    if (scaleSize < 1) {
                        canvas.width = MAX_WIDTH;
                        canvas.height = img.height * scaleSize;
                    } else {
                        canvas.width = img.width;
                        canvas.height = img.height;
                    }
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob((blob) => {
                        if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                        else resolve(file);
                    }, 'image/jpeg', 0.5);
                };
                img.onerror = () => resolve(file);
            });

            const formData = new FormData();
            formData.append('userId', user.id.toString());
            formData.append('type', type);
            formData.append('image', compressedFile);

            const res = await fetch('/api/clock', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                await fetchStatus(user.id);
            } else {
                alert('Errore timbratura');
            }
        } catch {
            alert('Errore di connessione');
        } finally {
            setLoading(false);
            const input = document.getElementById('cameraInput') as HTMLInputElement;
            if (input) input.value = '';
        }
    };

    const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !user) return;
        const file = e.target.files[0];

        try {
            const base64Image = await new Promise<string>((resolve) => {
                const img = new Image();
                img.src = URL.createObjectURL(file);
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_SIZE = 150;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7)); 
                };
            });

            const res = await fetch('/api/user/upload-profile-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, image: base64Image }),
            });

            if (res.ok) {
                const updatedUser = { ...user, profileImage: base64Image };
                setUser(updatedUser);
                localStorage.setItem('user_meta', JSON.stringify({
                    name: updatedUser.name,
                    role: (updatedUser as any).role,
                    id: updatedUser.id,
                    profileImage: base64Image
                })); 
            } else {
                alert('Errore caricamento foto');
            }
        } catch (e) {
            console.error(e);
            alert('Errore durante il caricamento');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user_meta');
        router.push('/');
    };

    if (!user) return null;

    return (
        <div className="bg-surface font-body text-on-surface min-h-screen">
            {/* TopAppBar */}
            <header className="w-full top-0 sticky z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-6 h-16 shadow-sm">
                <div className="flex flex-col">
                    <span className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold">TimbroSmart</span>
                    <h1 className="font-headline font-bold text-lg text-on-surface leading-none">Dashboard</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button className="relative text-slate-500 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">notifications</span>
                        <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
                    </button>
                    {/* User Profile */}
                    <div className="relative group cursor-pointer" onClick={() => document.getElementById('profileInput')?.click()}>
                        <input type="file" accept="image/*" id="profileInput" className="hidden" onChange={handleProfileUpload} />
                        <div className="w-9 h-9 rounded-full bg-surface-container-high border-2 border-surface-variant flex items-center justify-center overflow-hidden shadow-sm group-hover:border-primary transition-colors">
                            {user.profileImage ? (
                                <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-bold text-sm text-secondary">{user.name.charAt(0)}</span>
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-[10px]">edit</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="pb-28 max-w-4xl mx-auto px-4 md:px-6 pt-6">
                {/* Hero Greeting */}
                <div className="mb-6 animate-slide-up">
                    <h2 className="font-headline text-3xl font-extrabold text-on-surface">
                        Ciao, <span className="text-primary">{user.name.split(' ')[0]}</span>
                    </h2>
                    <p className="text-secondary font-medium">Ecco il tuo stato lavorativo attuale.</p>
                </div>

                {/* Status Hero Card */}
                <div className="mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
                    {status === 'LOADING' ? (
                        <div className="bg-surface-container-low p-8 rounded-3xl flex items-center justify-center min-h-[160px]">
                            <span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span>
                        </div>
                    ) : status === 'IN' ? (
                        <div className="bg-gradient-to-br from-tertiary to-tertiary-container text-on-tertiary border border-tertiary-fixed-dim/20 rounded-3xl p-8 relative overflow-hidden shadow-[0_12px_32px_rgba(0,110,46,0.15)] flex flex-col justify-center min-h-[160px]">
                            {/* Decorative element */}
                            <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                            
                            <div className="relative z-10">
                                <p className="font-label text-xs uppercase tracking-widest font-bold opacity-80 mb-1">Stato Attuale</p>
                                <h3 className="font-headline text-4xl font-extrabold tracking-tight mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-4xl">work</span> Al Lavoro
                                </h3>
                                {lastEntry && (
                                    <p className="opacity-90 font-medium">Entrato alle {new Date(lastEntry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-8 relative shadow-sm flex flex-col justify-center min-h-[160px]">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center">
                                    <span className="material-symbols-outlined text-2xl">bed</span>
                                </div>
                                <div>
                                    <p className="font-label text-xs uppercase tracking-widest font-bold text-secondary mb-1">Stato Attuale</p>
                                    <h3 className="font-headline text-3xl font-extrabold text-on-surface">Non al Lavoro</h3>
                                </div>
                            </div>
                            <p className="text-secondary font-medium ml-16">Sei in pausa o hai terminato il turno.</p>
                        </div>
                    )}
                </div>

                {/* Main Actions Bento Grid */}
                {status !== 'LOADING' && (
                    <div className="grid grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
                        
                        {/* Hidden Input for Camera */}
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            id="cameraInput"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    handleNativeClock(status === 'OUT' ? 'IN' : 'OUT', e.target.files[0]);
                                }
                            }}
                            disabled={loading}
                        />

                        {/* Big Timbra Button (Takes full width if needed? No, let's make it span 2 columns) */}
                        <div className="col-span-2">
                            {status === 'OUT' ? (
                                <button
                                    onClick={() => document.getElementById('cameraInput')?.click()}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-tertiary to-tertiary-container text-white p-6 rounded-2xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                                    <Camera size={28} />
                                    <span className="font-headline text-xl font-bold tracking-wide">
                                        {loading ? 'Attendere...' : 'Timbra ENTRATA'}
                                    </span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => document.getElementById('cameraInput')?.click()}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-error to-error-container text-white p-6 rounded-2xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                                    <Camera size={28} />
                                    <span className="font-headline text-xl font-bold tracking-wide">
                                        {loading ? 'Attendere...' : 'Timbra USCITA'}
                                    </span>
                                </button>
                            )}
                        </div>

                        {/* Secondary Actions */}
                        <Link href="/dashboard/calendar" className="bg-surface-container-lowest border border-outline-variant/20 p-5 rounded-2xl flex flex-col items-start gap-4 hover:bg-surface-container-low active:scale-95 transition-all shadow-sm group">
                            <div className="p-3 bg-primary/10 text-primary rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-on-surface">Calendario</h4>
                                <p className="text-xs text-secondary mt-1">Richieste ferie/permessi</p>
                            </div>
                        </Link>

                        <Link href="/dashboard/history" className="bg-surface-container-lowest border border-outline-variant/20 p-5 rounded-2xl flex flex-col items-start gap-4 hover:bg-surface-container-low active:scale-95 transition-all shadow-sm group">
                            <div className="p-3 bg-secondary/10 text-secondary rounded-xl group-hover:bg-secondary group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-[24px]">history</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-on-surface">Storico</h4>
                                <p className="text-xs text-secondary mt-1">Timbrature passate</p>
                            </div>
                        </Link>
                        
                        <Link href="/dashboard/payments" className="col-span-2 bg-gradient-to-r from-surface-container-lowest to-surface-container-low border border-outline-variant/20 p-5 rounded-2xl flex items-center gap-4 hover:shadow-md active:scale-[0.98] transition-all shadow-sm group">
                            <div className="p-3 bg-orange-100 text-orange-600 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                <Wallet size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-on-surface text-lg">Buste Paga & Pagamenti</h4>
                                <p className="text-sm text-secondary">Visualizza lo storico dei compensi</p>
                            </div>
                            <span className="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </Link>

                    </div>
                )}
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-2 pb-6 pt-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-[#c3c6d6]/20 shadow-[0_-12px_32px_rgba(23,28,31,0.06)] z-50 rounded-t-2xl">
                <div onClick={() => { if (user) { setStatus('LOADING'); fetchStatus(user.id); } }} className="cursor-pointer flex flex-col items-center justify-center bg-[#e4e9ed] text-primary rounded-xl px-3 py-1 transition-transform duration-300 active:scale-95">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
                    <span className="font-label text-[10px] sm:text-[11px] font-bold">Home</span>
                </div>
                <Link href="/dashboard/calendar" className="flex flex-col items-center justify-center text-slate-500 hover:text-primary px-2 py-1 transition-transform duration-300 active:scale-95">
                    <span className="material-symbols-outlined">event_note</span>
                    <span className="font-label text-[10px] sm:text-[11px] font-medium">Ferie</span>
                </Link>
                <Link href="/dashboard/history" className="flex flex-col items-center justify-center text-slate-500 hover:text-primary px-2 py-1 transition-transform duration-300 active:scale-95">
                    <span className="material-symbols-outlined">history</span>
                    <span className="font-label text-[10px] sm:text-[11px] font-medium">Storico</span>
                </Link>
                <Link href="/dashboard/payments" className="flex flex-col items-center justify-center text-slate-500 hover:text-primary px-2 py-1 transition-transform duration-300 active:scale-95">
                    <span className="material-symbols-outlined">account_balance_wallet</span>
                    <span className="font-label text-[10px] sm:text-[11px] font-medium">Paga</span>
                </Link>
                <div onClick={handleLogout} className="cursor-pointer flex flex-col items-center justify-center text-slate-500 hover:text-primary px-2 py-1 transition-transform duration-300 active:scale-95">
                    <span className="material-symbols-outlined">logout</span>
                    <span className="font-label text-[10px] sm:text-[11px] font-medium">Esci</span>
                </div>
            </nav>
        </div>
    );
}
