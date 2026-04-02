'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Register() {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, code }),
            });

            if (res.ok) {
                // Auto login
                const user = await res.json();
                localStorage.setItem('user_meta', JSON.stringify({ 
                    name: user.name, 
                    role: user.role,
                    id: user.id,
                    profileImage: user.profileImage || ''
                }));
                router.push('/dashboard');
            } else {
                const data = await res.json();
                setError(data.error || 'Registrazione fallita');
            }
        } catch {
            setError('Errore di connessione');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl shadow-xl border border-slate-100 overflow-hidden animate-slide-up">
                
                <div className="p-8 text-center bg-[#f6fafe] border-b border-surface-container">
                    <div className="flex justify-center mb-4">
                        <div className="bg-primary-container p-3 rounded-2xl shadow-sm text-on-primary-container">
                            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
                        </div>
                    </div>
                    <h1 className="font-headline text-3xl font-extrabold text-on-surface mb-2">
                        Registrazione
                    </h1>
                    <p className="font-body text-secondary text-sm">
                        Crea il tuo profilo dipendente
                    </p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-secondary mb-1">Nome Completo</label>
                            <input
                                type="text"
                                placeholder="es. Mario Rossi"
                                className="w-full rounded-xl border-outline-variant p-4 text-on-surface focus:ring-primary focus:border-primary transition-all bg-surface-container-lowest"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-secondary mb-1">Codice Personale</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none material-symbols-outlined">key</span>
                                <input
                                    type="text"
                                    placeholder="Scegli un codice segreto"
                                    className="w-full rounded-xl border-outline-variant p-4 pl-12 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-surface-container-lowest"
                                    required
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    autoCapitalize="none"
                                />
                            </div>
                            <p className="text-xs text-secondary mt-2 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">info</span>
                                Usa questo codice per fare il login la prossima volta.
                            </p>
                        </div>

                        {error && (
                            <div className="p-4 rounded-xl bg-error-container text-on-error-container text-sm font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined">error</span>
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="w-full py-4 mt-4 rounded-xl bg-primary text-white font-bold tracking-wide active:scale-95 transition-all shadow-md shadow-primary/20 flex justify-center items-center gap-2 hover:bg-primary/90"
                            disabled={loading}
                        >
                            {loading ? (
                                <><span className="material-symbols-outlined animate-spin">refresh</span> Creazione...</>
                            ) : (
                                <><span className="material-symbols-outlined">person_add</span> Crea Account</>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link href="/" className="text-sm font-medium text-secondary hover:text-primary transition-colors flex items-center justify-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">arrow_back</span> Torna al Login
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
