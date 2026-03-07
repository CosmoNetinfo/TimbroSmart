'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, HelpCircle } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Check for existing session - we rely on the middleware for redirects mostly,
  // but we can check if a 'user' exists for UI state.
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
  }, []);


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
        // Store only non-sensitive metadata for UI personalization
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
    <main className="azure-login-container">

      {/* 1. Icon Header */}
      <div className="animate-fade-in" style={{ marginBottom: '0.2rem' }}>
        <Image 
          src="/icons/app-icon-nobg.png" 
          alt="TimbroSmart Logo" 
          width={100} 
          height={100} 
          priority
          style={{ objectFit: 'contain' }}
        />
      </div>


      {/* 2. Text Content */}
      <h1 className="login-title animate-fade-in" style={{ animationDelay: '0.1s' }}>
        {isRegister ? 'Registrati' : 'Login'}
      </h1>
      <p className="login-subtitle animate-fade-in" style={{ animationDelay: '0.2s' }}>
        {isRegister ? 'Crea il tuo account dipendente' : 'Accedi al sistema di timbratura digitale'}
      </p>

      {/* 3. Form */}
      <form onSubmit={handleSubmit} style={{ width: '100%' }} className="animate-fade-in">

        {isRegister && (
          <div className="input-group" style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Nome e Cognome:"
              className="custom-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={isRegister}
            />
          </div>
        )}

        <div className="input-group">
          <input
            type="text"
            placeholder={isRegister ? "Scegli un codice (es. 1234):" : "Inserisci il tuo codice segreto:"}
            className="custom-input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            autoCapitalize="none"
          />
        </div>

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {/* Main Submit Button */}
        <button
          type="submit"
          className="btn-glass-primary"
          disabled={loading}
        >
          {loading ? 'Attendi...' : (isRegister ? 'Conferma Registrazione' : 'Entra')}
        </button>

      </form>

      {/* 4. Footer & Helper */}
      <div className="animate-fade-in" style={{ animationDelay: '0.4s', marginTop: '1.5rem', textAlign: 'center', width: '100%' }}>
        
        {/* Nuovo Box Piano FREE - Messo in evidenza con priorità di click */}
        <div 
          className="animate-fade-in" 
          style={{ 
            animationDelay: '0.4s', 
            marginBottom: '1rem', 
            padding: '1.2rem', 
            background: 'rgba(14, 165, 233, 0.08)', 
            borderRadius: '24px', 
            border: '1px dashed rgba(14, 165, 233, 0.3)',
            position: 'relative',
            zIndex: 50
          }}
        >
          <p style={{ fontSize: '0.9rem', marginBottom: '1rem', opacity: 0.9, fontWeight: 600 }}>
            Non hai ancora un codice azienda?
          </p>
          
          <button 
            type="button"
            onClick={handleFreePlanRequest}
            className="btn-glass-primary"
            style={{ 
              height: '55px', 
              fontSize: '0.95rem', 
              display: 'flex', 
              gap: '10px',
              background: 'linear-gradient(90deg, #0ea5e9 0%, #2563eb 100%)',
              boxShadow: '0 10px 20px rgba(14, 165, 233, 0.3)',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            <Mail size={18} /> Richiedi Piano FREE Gratis
          </button>

          <div style={{ marginTop: '1rem', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
            <p style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '4px' }}>Oppure scrivici su WhatsApp:</p>
            <a 
              href="https://wa.me/393517064080" 
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', cursor: 'pointer' }}
            >
              +39 351 706 4080
            </a>
          </div>
        </div>

        <a href="https://wa.me/393517064080?text=Salve,%20ho%20bisogno%20di%20assistenza%20o%20ho%20dimenticato%20il%20codice." target="_blank" rel="noopener noreferrer" className="helper-text" style={{ fontSize: '0.85rem', opacity: 0.6, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '1rem' }}>
          <HelpCircle size={14} /> Hai bisogno di aiuto o hai dimenticato il codice?
        </a>
      </div>

    </main>
  );
}
