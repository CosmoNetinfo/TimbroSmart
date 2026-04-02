'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, HelpCircle, CreditCard } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Check for existing session
  useEffect(() => {
    const stored = localStorage.getItem('user_meta');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user && user.role) {
          router.replace(user.role === 'ADMIN' ? '/admin' : '/dashboard');
        }
      } catch {
        localStorage.removeItem('user_meta');
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegister ? '/api/register' : '/api/login';
    const body = isRegister ? { name, code } : { code };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const user = await res.json();
        localStorage.setItem('user_meta', JSON.stringify({ 
          name: user.name, 
          role: user.role,
          id: user.id,
          profileImage: user.profileImage || ''
        }));
        router.push(user.role === 'ADMIN' ? '/admin' : '/dashboard');
      } else {
        const data = await res.json();
        setError(data.error || 'Operazione fallita');
        setLoading(false);
      }
    } catch {
      setError('Errore di connessione');
      setLoading(false);
    }
  };

  const handleFreePlanRequest = () => {
    const whatsappUrl = 'https://wa.me/393517064080?text=Salve,%20vorrei%20richiedere%20una%20chiave%20per%20il%20piano%20FREE%20di%20TimbroSmart.%0ANome%20Azienda:';
    window.open(whatsappUrl, '_blank');
  };

  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl shadow-xl border border-slate-100 overflow-hidden animate-slide-up">
        
        <div className="p-8 text-center bg-[#f6fafe] border-b border-surface-container">
            <div className="flex justify-center mb-4">
              <div className="bg-primary-container p-3 rounded-2xl shadow-sm text-on-primary-container">
                  <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>fingerprint</span>
              </div>
            </div>
            <h1 className="font-headline text-3xl font-extrabold text-on-surface mb-2">
              {isRegister ? 'Registrati' : 'Bentornato'}
            </h1>
            <p className="font-body text-secondary text-sm">
              {isRegister ? 'Crea il tuo account dipendente' : 'Accedi al sistema di timbratura digitale'}
            </p>
        </div>

        <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
                {isRegister && (
                    <div>
                        <label className="block text-sm font-bold text-secondary mb-1">Nome e Cognome</label>
                        <input
                        type="text"
                        placeholder="Mario Rossi"
                        className="w-full rounded-xl border-outline-variant p-4 text-on-surface focus:ring-primary focus:border-primary transition-all bg-surface-container-lowest"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required={isRegister}
                        />
                    </div>
                )}
                <div>
                    <label className="block text-sm font-bold text-secondary mb-1">Codice Segreto</label>
                    <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/60 pointer-events-none material-symbols-outlined text-[22px] transition-colors group-focus-within:text-primary">key</span>
                        <input
                        type="password"
                        placeholder={isRegister ? "Scegli un codice" : "Inserisci il tuo codice"}
                        className="w-full rounded-2xl border-2 border-outline-variant/30 px-4 py-4 pl-14 text-on-surface focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all bg-white shadow-sm"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                        autoCapitalize="none"
                        />
                    </div>
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
                    <><span className="material-symbols-outlined animate-spin">refresh</span> Attendi...</>
                ) : (
                    <>{isRegister ? 'Registrati' : 'Accedi'} <span className="material-symbols-outlined ml-1">arrow_forward</span></>
                )}
                </button>
            </form>
        </div>
      </div>

      <div className="w-full max-w-md mt-6 space-y-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
        
        {/* FREE PLAN */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 text-center transition-transform hover:-translate-y-1">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary-container">work</span>
            <span className="font-bold text-primary-container">Piano FREE</span>
          </div>
          <p className="text-sm text-secondary mb-4">Fino a 3 dipendenti gratis.</p>
          <button 
            onClick={handleFreePlanRequest}
            className="w-full py-3 rounded-xl border-2 border-primary-container/20 text-primary-container font-bold hover:bg-primary-container/10 transition-colors flex justify-center items-center gap-2"
          >
            <Mail size={16} /> Richiedi Ora
          </button>
        </div>

        {/* PRO PLAN */}
        <div className="bg-[#fff9ed] border border-orange-200 rounded-2xl p-5 text-center shadow-lg relative transition-transform hover:-translate-y-1">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">CONSIGLIATO</span>
          <div className="flex items-center justify-center gap-2 mb-2 mt-2">
            <span className="material-symbols-outlined text-orange-600">star</span>
            <span className="font-bold text-orange-600 text-lg">Piano PRO</span>
          </div>
          <p className="text-sm text-orange-800 mb-2">Dipendenti illimitati, Export Avanzato, Gestione Pagamenti.</p>
          <div className="mb-4">
             <span className="text-2xl font-extrabold text-orange-600">€4,99</span>
             <span className="text-xs text-orange-800 opacity-70 ml-1">Una tantum</span>
          </div>
          <a
            href="https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=stephenkingitaly@gmail.com&item_name=TimbroSmart%20PRO&amount=4.99&currency_code=EUR&return=https://timbrosmart.vercel.app/payment-success" 
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white font-bold hover:shadow-orange-500/30 hover:shadow-lg transition-all flex justify-center items-center gap-2"
          >
            <CreditCard size={18} /> Attiva Subito
          </a>
        </div>

        {/* ENTERPRISE */}
         <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 text-center transition-transform hover:-translate-y-1">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="material-symbols-outlined text-purple-600">apartment</span>
            <span className="font-bold text-purple-600">Piano ENTERPRISE</span>
          </div>
          <p className="text-sm text-purple-800 mb-2">White-label Logo & Assistenza 24/7.</p>
          <div className="mb-4">
             <span className="text-xl font-bold text-purple-600">€9,99</span>
             <span className="text-xs text-purple-800 opacity-70 ml-1">Una tantum</span>
          </div>
          <a  
            href="https://wa.me/393517064080?text=Salve,%20vorrei%20informazioni%20per%20il%20piano%20ENTERPRISE." 
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-xl border border-purple-300 text-purple-700 font-bold hover:bg-purple-100 transition-colors flex justify-center items-center"
          >
            Contattaci
          </a>
        </div>
        
      </div>

      <div className="mt-8 text-center pb-8">
        <a href="https://wa.me/393517064080" target="_blank" rel="noopener noreferrer" className="flex justify-center items-center gap-2 text-secondary hover:text-primary transition-colors text-sm mb-4">
          <HelpCircle size={14} /> Password dimenticata o Info?
        </a>
        <a href="/privacy" className="text-xs font-medium text-slate-400 hover:text-slate-600">
          Privacy Policy
        </a>
      </div>
    </main>
  );
}
