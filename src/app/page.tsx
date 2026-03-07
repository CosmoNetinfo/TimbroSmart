'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

  return (
    <main className="azure-login-container">

      {/* 1. Icon Header */}
      <div className="icon-box animate-fade-in" style={{ background: 'transparent', width: '80px', height: '80px' }}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
          {/* Base del Timbro / Goccia Tech */}
          <path d="M20 40C20 23.4315 33.4315 10 50 10C66.5685 10 80 23.4315 80 40C80 56.5685 60 90 50 90C40 90 20 56.5685 20 40Z" fill="url(#azureGrad)" />
          {/* Quadrante Orologio Smart */}
          <circle cx="50" cy="40" r="18" stroke="white" strokeWidth="4" />
          <path d="M50 30V40L60 40" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {/* Effetto Vetro / Riflesso */}
          <path d="M70 30C75 35 75 45 70 50" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />
          <defs>
            <linearGradient id="azureGrad" x1="50" y1="10" x2="50" y2="90" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0ea5e9" />
              <stop offset="1" stopColor="#2563eb" />
            </linearGradient>
          </defs>
        </svg>
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
      <div className="animate-fade-in" style={{ animationDelay: '0.4s', marginTop: '2rem', textAlign: 'center', width: '100%' }}>
        
        {/* Nuovo Box Piano FREE - Messo in evidenza */}
        <div style={{ marginBottom: '2rem', padding: '1.2rem', background: 'rgba(14, 165, 233, 0.1)', borderRadius: '20px', border: '1px dashed rgba(14, 165, 233, 0.3)' }}>
          <p style={{ fontSize: '0.85rem', marginBottom: '0.8rem', opacity: 0.9, fontWeight: 600 }}>Cerca il tuo codice azienda o</p>
          <a 
            href="mailto:cosmonetinfo85@gmail.com?subject=TIMBROSMART%20-%20Richiesta%20Chiave%20Piano%20FREE&body=Salve,%20vorrei%20richiedere%20una%20chiave%20per%20il%20piano%20FREE%20di%20TimbroSmart.%0A%0ANome%20Azienda:%20"
            className="btn-glass-secondary"
            style={{ textDecoration: 'none', height: '45px', fontSize: '0.85rem', width: 'auto', display: 'inline-flex', padding: '0 20px' }}
          >
            Richiedi Piano FREE Gratis
          </a>
          <p style={{ fontSize: '0.75rem', marginTop: '1rem', opacity: 0.6 }}>
            Oppure scrivi a: <strong style={{ color: 'var(--primary)' }}>cosmonetinfo85@gmail.com</strong>
          </p>
        </div>

        <Link href="/help" className="helper-text" style={{ fontSize: '0.8rem', opacity: 0.6, textDecoration: 'none' }}>
          Hai bisogno di aiuto o hai dimenticato il codice?
        </Link>
      </div>

    </main>
  );
}
