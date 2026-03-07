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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '0.8rem' }}>
            <p style={{ fontSize: '1rem', margin: 0, fontWeight: 700, color: 'var(--primary)' }}>
              Piano FREE - Base
            </p>
          </div>
          <p style={{ fontSize: '0.85rem', marginBottom: '1rem', opacity: 0.8 }}>
            Gestisci fino a <strong>3 dipendenti</strong> gratuitamente.
          </p>
          
          <button 
            type="button"
            onClick={handleFreePlanRequest}
            className="btn-glass-primary"
            style={{ 
              height: '45px', 
              fontSize: '0.9rem', 
              display: 'flex', 
              gap: '10px',
              background: 'rgba(14, 165, 233, 0.1)',
              border: '1px solid var(--primary)',
              boxShadow: 'none',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            <Mail size={18} /> Richiedi Piano FREE
          </button>
        </div>

        {/* --- Box Piano PRO (PayPal) --- */}
        <div 
          className="animate-fade-in" 
          style={{ 
            animationDelay: '0.5s', 
            marginBottom: '1rem', 
            padding: '1.2rem', 
            background: 'rgba(240, 192, 64, 0.08)', 
            borderRadius: '24px', 
            border: '1px solid rgba(240, 192, 64, 0.3)',
            position: 'relative',
            zIndex: 50,
            textAlign: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '0.8rem' }}>
            <span style={{ background: '#f0c040', color: '#000', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold' }}>CONSIGLIATO</span>
            <p style={{ fontSize: '1rem', margin: 0, fontWeight: 700, color: '#f0c040' }}>
              Piano PRO - Illimitato
            </p>
          </div>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.2rem 0', fontSize: '0.85rem', textAlign: 'left', opacity: 0.9 }}>
            <li style={{ marginBottom: '6px' }}>✅ Dipendenti <strong>Illimitati</strong></li>
            <li style={{ marginBottom: '6px' }}>✅ Export PDF & Report avanzati</li>
            <li style={{ marginBottom: '6px' }}>✅ Gestione pagamenti integrata</li>
          </ul>

          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>€4,99</span>
            <span style={{ fontSize: '0.8rem', opacity: 0.6 }}> una tantum</span>
          </div>
          
          <a
            href="https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=stephenkingitaly@gmail.com&item_name=TimbroSmart%20PRO&amount=4.99&currency_code=EUR&return=https://timbrosmart.vercel.app/payment-success" 
            target="_blank"
            rel="noopener noreferrer"
            className="btn-glass-primary"
            style={{ 
              height: '55px', 
              fontSize: '0.95rem', 
              display: 'flex', 
              gap: '10px',
              background: '#0ea5e9',
              boxShadow: '0 10px 20px rgba(14, 165, 233, 0.3)',
              cursor: 'pointer',
              width: '100%',
              textDecoration: 'none',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Image src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" alt="PayPal" width={24} height={15} />
            Attiva PRO
          </a>
        </div>

        {/* --- Box Piano ENTERPRISE --- */}
        <div 
          className="animate-fade-in" 
          style={{ 
            animationDelay: '0.6s', 
            marginBottom: '1rem', 
            padding: '1.2rem', 
            background: 'rgba(168, 85, 247, 0.08)', 
            borderRadius: '24px', 
            border: '1px solid rgba(168, 85, 247, 0.3)',
            position: 'relative',
            zIndex: 50,
            textAlign: 'center'
          }}
        >
          <p style={{ fontSize: '1rem', margin: '0 0 0.8rem 0', fontWeight: 700, color: '#a855f7' }}>
            Piano ENTERPRISE
          </p>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.2rem 0', fontSize: '0.85rem', textAlign: 'left', opacity: 0.9 }}>
            <li style={{ marginBottom: '6px' }}>✅ Tutto il piano PRO</li>
            <li style={{ marginBottom: '6px' }}>✅ <strong>White-label</strong> (Tuo Logo)</li>
            <li style={{ marginBottom: '6px' }}>✅ Supporto 24/7 & API</li>
          </ul>

          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>€9,99</span>
            <span style={{ fontSize: '0.8rem', opacity: 0.6 }}> una tantum</span>
          </div>
          
          <a
            href="https://wa.me/393517064080?text=Salve,%20vorrei%20informazioni%20per%20il%20piano%20ENTERPRISE." 
            target="_blank"
            rel="noopener noreferrer"
            className="btn-glass-primary"
            style={{ 
              height: '50px', 
              fontSize: '0.9rem', 
              display: 'flex', 
              gap: '10px',
              background: 'transparent',
              border: '1px solid #a855f7',
              cursor: 'pointer',
              width: '100%',
              textDecoration: 'none',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            Contattaci per Enterprise
          </a>
        </div>

        <a href="https://wa.me/393517064080?text=Salve,%20ho%20bisogno%20di%20assistenza%20o%20ho%20dimenticato%20il%20codice." target="_blank" rel="noopener noreferrer" className="helper-text" style={{ fontSize: '0.85rem', opacity: 0.6, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '1rem' }}>
          <HelpCircle size={14} /> Hai bisogno di aiuto o hai dimenticato il codice?
        </a>

        <div style={{ marginTop: '2rem', marginBottom: '1rem' }}>
          <a href="/privacy" style={{ fontSize: '0.75rem', opacity: 0.4, color: 'var(--text-primary)', textDecoration: 'none' }}>
            Privacy Policy
          </a>
        </div>
      </div>

    </main>
  );
}
