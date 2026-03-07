import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <main className="container animate-fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <div className="glass card" style={{ padding: '2rem' }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-primary)', marginBottom: '1.5rem', textDecoration: 'none', gap: '8px' }}>
                    <ArrowLeft size={20} /> Torna alla Home
                </Link>
                
                <h1 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Privacy Policy - TimbroSmart</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Ultimo aggiornamento: 7 Marzo 2026</p>

                <section style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>1. Titolare del Trattamento</h2>
                    <p>Il titolare del trattamento dei dati è **Cosmonet**.</p>
                </section>

                <section style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>2. Tipologia di Dati Raccolti</h2>
                    <p>TimbroSmart raccoglie i seguenti dati:</p>
                    <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                        <li>Nome e Cognome del dipendente.</li>
                        <li>Codice identificativo aziendale.</li>
                        <li>Log di timbratura (data, ora, coordinate GPS se attivate, foto della timbratura).</li>
                        <li>Foto del profilo.</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>3. Finalità del Trattamento</h2>
                    <p>I dati vengono raccolti esclusivamente per finalità di gestione del personale, timbratura oraria e calcolo della produttività aziendale.</p>
                </section>

                <section style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>4. Conservazione dei Dati</h2>
                    <p>I dati sono conservati su server protetti situati all'interno della **Comunità Europea (Region: europe-west3 - Francoforte)** per la durata del contratto di servizio.</p>
                </section>

                <section style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>5. Sicurezza dei Dati</h2>
                    <p>Tutte le comunicazioni avvengono tramite protocollo criptato HTTPS e i dati sono protetti da Policy di sicurezza Firebase (Firestore Rules).</p>
                </section>

                <section style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>6. Diritti dell&apos;interessato</h2>
                    <p>Ai sensi del GDPR (Regolamento UE 2016/679), l&apos;interessato ha il diritto di:</p>
                    <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                        <li>Accedere ai propri dati.</li>
                        <li>Richiedere la rettifica o la cancellazione.</li>
                        <li>Opporsi al trattamento per motivi legittimi.</li>
                    </ul>
                </section>

                <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    Per richieste relative alla privacy: <strong>cosmonetinfo85@gmail.com</strong>
                </div>
            </div>
        </main>
    );
}
