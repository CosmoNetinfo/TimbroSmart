'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';

export default function PaymentSuccessPage() {
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/orders/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyName, email, plan: 'PRO' }),
            });

            if (res.ok) {
                setSubmitted(true);
            } else {
                const data = await res.json();
                setError(data.error || 'Errore durante l\'invio della richiesta');
            }
        } catch (err) {
            setError('Errore di connessione');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <main className="mobile-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '2rem' }}>
                <div className="card-solid animate-slide-up" style={{ textAlign: 'center', width: '100%' }}>
                    <CheckCircle size={64} color="var(--success)" style={{ marginBottom: '1.5rem', margin: '0 auto' }} />
                    <h2 style={{ marginBottom: '1rem' }}>Richiesta Inviata!</h2>
                    <p style={{ marginBottom: '2rem', opacity: 0.8 }}>
                        Grazie! Abbiamo ricevuto i dati della tua azienda. 
                        Ti invieremo il **Serial Key** e l'**Admin Code** via email/WhatsApp entro breve.
                    </p>
                    <Link href="/" className="btn-glass-primary" style={{ textDecoration: 'none' }}>
                        Torna alla Home
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="mobile-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
            <div className="card-solid animate-slide-up" style={{ width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ background: 'rgba(34, 197, 94, 0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                        <CheckCircle size={40} color="var(--success)" />
                    </div>
                    <h2 style={{ marginBottom: '0.5rem' }}>Pagamento Completato!</h2>
                    <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                        Inserisci i dettagli della tua azienda per generare la licenza PRO.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="input-group" style={{ marginBottom: '1.2rem' }}>
                        <label className="label">Nome Azienda</label>
                        <input
                            type="text"
                            placeholder="Es: Cosmonet Srl"
                            className="custom-input"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="label">Email di contatto (o WhatsApp)</label>
                        <input
                            type="text"
                            placeholder="Es: info@azienda.it o +39..."
                            className="custom-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {error && <div className="error-box">{error}</div>}

                    <button type="submit" className="btn-glass-primary" disabled={loading}>
                        {loading ? 'Invio in corso...' : (
                            <>
                                <Send size={20} /> Invia Dati Azienda
                            </>
                        )}
                    </button>
                </form>

                <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '1.5rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', opacity: 0.6 }}>
                    <ArrowLeft size={16} /> Torna alla Home
                </Link>
            </div>
        </main>
    );
}
