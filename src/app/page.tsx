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
          id: user.id
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
    <main className="purple-login-container">

      {/* 1. Icon Header */}
      <div className="icon-box animate-fade-in" style={{ background: 'transparent' }}>
        <img src="/logo-timbrosmart.png" alt="TimbroSmart Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>


      {/* 2. Text Content */}
      <h1 className="login-title animate-fade-in" style={{ animationDelay: '0.1s' }}>
        {isRegister ? 'Registrati' : 'Login'}
      </h1>
      <p className="login-subtitle animate-fade-in" style={{ animationDelay: '0.2s' }}>
        {isRegister ? 'Crea il tuo account dipendente' : 'Pocula d\'entervi timbro cartelino'}
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
            placeholder={isRegister ? "Scegli il tuo codice segreto:" : "Codice accesso:"}
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

      {/* 4. Footer & Toggle */}
      <div className="helper-text animate-fade-in" style={{ animationDelay: '0.4s', marginTop: '1.5rem', cursor: 'pointer' }} onClick={() => { setIsRegister(!isRegister); setError(''); }}>
        {isRegister ? 'Hai già un account? Accedi' : 'Non hai un codice? Registrati'}
      </div>

      {!isRegister && (
        <Link href="/help" className="helper-text animate-fade-in" style={{ animationDelay: '0.5s', marginTop: '0.5rem', display: 'block', fontSize: '0.8rem', opacity: 0.7 }}>
          Hai bisogno di aiuto?
        </Link>
      )}

    </main>
  );
}
