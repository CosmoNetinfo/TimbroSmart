'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  UserCheck, 
  FileText, 
  TrendingUp, 
  Smartphone, 
  ChevronDown, 
  Check, 
  ArrowRight, 
  ExternalLink,
  ShieldCheck,
  Star,
  Users,
  Award,
  Lock,
  Camera,
  Calendar,
  Wallet,
  Bell,
  LogOut,
  RefreshCw
} from 'lucide-react';

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState('08:30:00');
  const [mockStatus, setMockStatus] = useState<'OUT' | 'IN'>('OUT');
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState([
    { name: "Luigi Bianchi", time: "08:45:12", type: "IN", location: "Milano Centro" },
    { name: "Sofia Neri", time: "08:30:45", type: "IN", location: "Milano Centro" },
  ]);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMockTimbratura = () => {
    if (isScanning) return;
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const newType = mockStatus === 'OUT' ? 'IN' : 'OUT';
      setMockStatus(newType);
      
      const now = new Date().toLocaleTimeString('it-IT');
      setLogs(prev => [
        { name: "Mario Rossi", time: now, type: newType, location: "Milano Centro (12m)" },
        ...prev.slice(0, 2)
      ]);
    }, 1500);
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const features = [
    {
      icon: <MapPin className="text-primary w-6 h-6" />,
      title: "Geolocalizzazione GPS",
      desc: "Limita dove i dipendenti possono timbrare creando raggi d'azione intelligenti intorno a uffici, cantieri o sedi temporanee.",
      badge: "Geofencing"
    },
    {
      icon: <UserCheck className="text-tertiary w-6 h-6" />,
      title: "Validazione Fotografica AI",
      desc: "Scatto della foto obbligatorio alla timbratura per prevenire frodi, con salvataggio sicuro su server protetti europei.",
      badge: "Sicurezza"
    },
    {
      icon: <FileText className="text-emerald-500 w-6 h-6" />,
      title: "Buste Paga Automatiche",
      desc: "Calcolo istantaneo delle ore lavorate e dei compensi, pronti per l'esportazione verso il consulente in CSV o PDF.",
      badge: "Automazione"
    },
    {
      icon: <TrendingUp className="text-purple-500 w-6 h-6" />,
      title: "Business Intelligence",
      desc: "Analizza l'andamento del lavoro con grafici dinamici, monitora costi aziendali e ore totali in tempo reale.",
      badge: "Statistiche"
    },
    {
      icon: <Smartphone className="text-amber-500 w-6 h-6" />,
      title: "Installabile come PWA",
      desc: "Veloce e leggera. Installala su iOS e Android in pochi secondi direttamente dal browser, senza passare dagli store.",
      badge: "Mobile"
    },
    {
      icon: <ShieldCheck className="text-indigo-500 w-6 h-6" />,
      title: "Conformità GDPR / Privacy",
      desc: "I dati sono custoditi in totale sicurezza in server all'interno dell'UE (Francoforte), in piena conformità con le leggi sulla privacy.",
      badge: "GDPR"
    }
  ];

  const pricing = [
    {
      name: "FREE",
      price: "€0",
      period: "per sempre",
      desc: "La soluzione ideale per micro-aziende e professionisti.",
      features: [
        "Fino a 3 dipendenti",
        "Timbratura base IN / OUT",
        "Report mensili standard",
        "Supporto via email"
      ],
      cta: "Inizia Gratis",
      href: "/login",
      color: "border-slate-200 bg-white text-on-surface",
      buttonColor: "bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/30"
    },
    {
      name: "PRO",
      price: "€4,99",
      period: "all'anno",
      desc: "Ottimizza la gestione per l'intero organico aziendale.",
      features: [
        "Dipendenti illimitati",
        "Export Avanzato CSV",
        "Calcolo stipendi orari",
        "Storico attività illimitato",
        "Backup cloud giornaliero"
      ],
      cta: "Attiva PRO con PayPal",
      href: "https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=stephenkingitaly@gmail.com&item_name=TimbroSmart%20PRO&amount=4.99&currency_code=EUR&return=https://timbrosmart.vercel.app/payment-success",
      recommended: true,
      color: "border-orange-500 bg-[#fffcf5] text-on-surface shadow-xl relative",
      buttonColor: "bg-[#0070ba] hover:bg-[#005ea6] text-white shadow-md shadow-primary/20"
    },
    {
      name: "ENTERPRISE",
      price: "€9,99",
      period: "all'anno",
      desc: "Il massimo della sicurezza e personalizzazione per la tua azienda.",
      features: [
        "Tutto del piano PRO",
        "Logo aziendale personalizzato",
        "Colori di branding su misura",
        "Geofencing GPS obbligatorio",
        "Validazione fotografica AI",
        "Assistenza dedicata 24/7"
      ],
      cta: "Richiedi Informazioni",
      href: "https://wa.me/393517064080?text=Salve,%20vorrei%20informazioni%20per%20il%20piano%20ENTERPRISE.",
      color: "border-purple-300 bg-purple-50/50 text-on-surface",
      buttonColor: "bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20"
    }
  ];

  const faqs = [
    {
      q: "Cos'è una PWA e come si installa TimbroSmart?",
      a: "TimbroSmart è una Progressive Web App (PWA). Questo significa che puoi installarla direttamente sul tuo iPhone o telefono Android aprendo il sito su Safari o Chrome, premendo su 'Condividi' o 'Opzioni' e cliccando su 'Aggiungi alla schermata Home'. Si comporterà esattamente come un'app nativa!"
    },
    {
      q: "Come funziona il controllo della Geolocalizzazione GPS?",
      a: "Nel piano Enterprise, l'amministratore può impostare le coordinate GPS esatte della sede aziendale (es. cantiere o ufficio) e un raggio massimo in metri. Il dipendente non potrà effettuare la timbratura se si trova al di fuori dell'area stabilita dall'azienda."
    },
    {
      q: "Quali dati vengono salvati per la privacy?",
      a: "Raccogliamo solo i dati strettamente necessari alla gestione del lavoro: nome, cognome, codice dipendente, gli orari di timbratura, la foto scattata al momento dell'ingresso/uscita (se abilitata) e le coordinate GPS. Tutti i dati sono ospitati su server super sicuri in Germania (UE) in piena conformità GDPR."
    },
    {
      q: "Come avviene il pagamento e l'attivazione dei piani PRO o Enterprise?",
      a: "Puoi attivare il piano PRO pagando comodamente via PayPal. Al completamento del pagamento verrai reindirizzato a una pagina di successo dove compilerai i dettagli aziendali. Entro pochi minuti riceverai il Serial Key e il Codice Amministratore per attivare la piattaforma."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-body text-slate-900 scroll-smooth antialiased">
      
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between p-4 md:px-8">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-xl text-white">
              <span className="material-symbols-outlined text-2xl font-bold flex items-center justify-center" style={{ fontVariationSettings: "'FILL' 1" }}>fingerprint</span>
            </div>
            <span className="font-headline font-extrabold text-xl tracking-tight text-slate-900">TimbroSmart</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">Funzioni</a>
            <a href="#pricing" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">Prezzi</a>
            <a href="#faq" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">FAQ</a>
            <a href="https://wa.me/393517064080" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">Contatti</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-md shadow-primary/10 hover:bg-primary/95 transition-all">
              Area Riservata
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100 pt-16 pb-20 md:pt-24 md:pb-28">
        {/* Floating background shapes */}
        <div className="absolute right-0 top-0 -z-10 h-[500px] w-[500px] rounded-full bg-blue-100/40 blur-3xl translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute left-0 bottom-0 -z-10 h-[400px] w-[400px] rounded-full bg-purple-100/30 blur-3xl -translate-x-1/3 translate-y-1/3"></div>

        <div className="mx-auto max-w-7xl px-4 md:px-8 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-bold text-primary mb-6 border border-blue-100">
            <Award className="w-3.5 h-3.5" />
            Il sistema di timbratura smart n.1 in Italia
          </div>
          
          <h1 className="font-headline text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl max-w-4xl mx-auto leading-tight">
            La timbratura digitale, <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">geolocalizzata</span> e intelligente.
          </h1>

          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto font-medium">
            Gestisci turni, geofencing GPS, rilevazione fotografica e report buste paga in tempo reale. Tutto integrato in un'app installabile sul telefono in 2 secondi.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/login" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-primary text-white font-extrabold shadow-lg shadow-primary/25 hover:bg-primary/95 transition-all flex items-center justify-center gap-2">
              Prova Gratis Ora <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-extrabold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              Scopri di più
            </a>
          </div>

          {/* Social Proof */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-6 text-slate-400 text-sm font-semibold">
            <span className="flex items-center gap-1"><Users className="w-4 h-4 text-slate-400" /> +500 Dipendenti Attivi</span>
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
            <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Valutazione 4.9/5</span>
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Conforme GDPR 2026</span>
          </div>

          {/* App Preview Mockup */}
          <div className="mt-16 bg-white rounded-3xl p-4 md:p-6 shadow-2xl border border-slate-200 max-w-5xl mx-auto relative group overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-950 rounded-2xl p-6 md:p-10 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-955/40 via-slate-950 to-slate-950 z-0 pointer-events-none"></div>
              
              {/* Left Side: Simulated Admin Dashboard */}
              <div className="lg:col-span-7 z-10 text-left space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="font-headline font-bold text-slate-200 text-sm tracking-wide">Pannello Amministratore (Live)</span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                    Piano Enterprise
                  </span>
                </div>

                <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Ultimi ingressi del team</span>
                    <span className="font-semibold text-slate-300">Tempo Reale</span>
                  </div>
                  
                  <div className="space-y-2">
                    {logs.map((log, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-950/60 border border-slate-850 p-2.5 rounded-xl text-xs hover:border-slate-800 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-primary-container/20 border border-primary/20 flex items-center justify-center font-bold text-primary uppercase">
                            {log.name.substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-200">{log.name}</p>
                            <p className="text-[10px] text-slate-500">GPS: {log.location}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            log.type === 'IN' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {log.type === 'IN' ? 'ENTRATA' : 'USCITA'}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1 font-semibold">{log.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900/60 border border-slate-800/60 p-3 rounded-xl">
                    <p className="text-slate-500">Copertura GPS</p>
                    <p className="text-base font-extrabold text-slate-200 mt-0.5">100% Validata</p>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800/60 p-3 rounded-xl">
                    <p className="text-slate-500">Tasso di Presenza</p>
                    <p className="text-base font-extrabold text-slate-200 mt-0.5">98.4% Ottimo</p>
                  </div>
                </div>
              </div>

              {/* Right Side: Simulated Interactive Smartphone Terminal (100% Faithful Replica) */}
              <div className="lg:col-span-5 flex justify-center z-10">
                <div className="w-full max-w-[310px] bg-slate-900 rounded-[45px] p-3 border-[6px] border-slate-800 shadow-2xl relative overflow-hidden group/phone transition-transform duration-300 hover:scale-[1.02]">
                  
                  {/* Speaker Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-28 bg-slate-800 rounded-b-2xl z-20 flex items-center justify-center">
                    <div className="w-12 h-1 bg-slate-900 rounded-full"></div>
                  </div>

                  {/* Phone screen inner content */}
                  <div className="bg-[#f8f9fa] rounded-[34px] text-slate-950 relative min-h-[460px] flex flex-col justify-between overflow-hidden shadow-inner pt-5 select-none">
                    
                    {/* Active Scanning Overlay */}
                    {isScanning && (
                      <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-4 animate-fade-in text-white rounded-[32px]">
                        <div className="absolute inset-x-4 h-0.5 bg-primary shadow-lg shadow-primary/80 animate-bounce top-1/3"></div>
                        <div className="h-16 w-16 rounded-full border border-primary bg-primary/20 flex items-center justify-center text-primary mb-4 animate-pulse">
                          <Camera className="w-8 h-8" />
                        </div>
                        <h4 className="text-xs font-black tracking-widest text-primary uppercase animate-pulse">Scansione AI e GPS...</h4>
                        <p className="text-[9px] text-slate-400 mt-1.5 text-center font-medium max-w-[160px]">Validazione posizione in corso, attendere</p>
                      </div>
                    )}

                    {/* Header bar */}
                    <div>
                      {/* Status Bar */}
                      <div className="flex justify-between items-center text-[9px] text-slate-500 px-4 mb-2 font-bold">
                        <span>{currentTime.substring(0, 5)}</span>
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[10px]">signal_cellular_alt</span>
                          <span className="material-symbols-outlined text-[10px]">wifi</span>
                          <span className="material-symbols-outlined text-[10px]">battery_5_bar</span>
                        </div>
                      </div>

                      {/* TopAppBar */}
                      <header className="bg-white border-b border-slate-200/60 px-4 py-2.5 flex items-center justify-between shadow-sm">
                        <div className="flex flex-col text-left">
                          <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400">
                            TimbroSmart
                          </span>
                          <h1 className="font-bold text-sm text-slate-800 leading-none">Dashboard</h1>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="relative text-slate-400">
                            <Bell className="w-4 h-4 text-slate-500" />
                            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                          </button>
                          {/* Profile image avatar mockup */}
                          <div className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-black text-slate-650 text-xs overflow-hidden shadow-sm">
                            M
                          </div>
                        </div>
                      </header>
                    </div>

                    {/* Phone Body Scrollable Content */}
                    <div className="px-3.5 pt-3.5 pb-20 flex-1 overflow-y-auto space-y-4 max-h-[340px]">
                      {/* Greeting */}
                      <div className="text-left animate-slide-up">
                        <h2 className="text-xl font-black text-slate-900">
                          Ciao, <span className="text-primary">Mario</span>
                        </h2>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Ecco il tuo stato lavorativo attuale.</p>
                      </div>

                      {/* Status Hero Card */}
                      <div className="animate-slide-up">
                        {mockStatus === 'IN' ? (
                          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl p-4 text-left relative overflow-hidden shadow-[0_8px_20px_rgba(16,185,129,0.15)]">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                            <p className="text-[9px] uppercase tracking-widest font-extrabold text-white/80 mb-0.5">Stato Attuale</p>
                            <h3 className="text-xl font-black tracking-tight flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-xl">work</span> Al Lavoro
                            </h3>
                            <p className="text-[9px] text-white/90 font-bold mt-1.5">Entrato alle {currentTime.substring(0, 5)}</p>
                          </div>
                        ) : (
                          <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0">
                              <span className="material-symbols-outlined text-lg">bed</span>
                            </div>
                            <div>
                              <p className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 mb-0.5">Stato Attuale</p>
                              <h3 className="text-sm font-black text-slate-800 leading-none">Non al Lavoro</h3>
                              <p className="text-[9px] text-slate-500 font-semibold mt-1">Sei in pausa o hai terminato il turno.</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Main Actions Bento Grid */}
                      <div className="grid grid-cols-2 gap-2.5">
                        {/* Big Timbra Camera Button */}
                        <div className="col-span-2">
                          {mockStatus === 'OUT' ? (
                            <button
                              onClick={handleMockTimbratura}
                              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-3.5 px-4 rounded-xl shadow-md active:scale-[0.97] transition-all flex items-center justify-center gap-1.5"
                            >
                              <Camera className="w-4 h-4" />
                              <span className="text-xs font-black uppercase tracking-wider">Timbra ENTRATA</span>
                            </button>
                          ) : (
                            <button
                              onClick={handleMockTimbratura}
                              className="w-full bg-gradient-to-r from-rose-500 to-red-650 hover:from-rose-600 hover:to-red-700 text-white py-3.5 px-4 rounded-xl shadow-md active:scale-[0.97] transition-all flex items-center justify-center gap-1.5"
                            >
                              <Camera className="w-4 h-4" />
                              <span className="text-xs font-black uppercase tracking-wider">Timbra USCITA</span>
                            </button>
                          )}
                        </div>

                        {/* Secondary Actions */}
                        <div className="bg-white border border-slate-200/80 p-3 rounded-xl flex flex-col items-start gap-2.5 shadow-sm text-left">
                          <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-[10px] leading-none">Calendario</h4>
                            <p className="text-[8px] text-slate-400 mt-1 font-medium">Ferie e permessi</p>
                          </div>
                        </div>

                        <div className="bg-white border border-slate-200/80 p-3 rounded-xl flex flex-col items-start gap-2.5 shadow-sm text-left">
                          <div className="p-1.5 bg-slate-50 text-slate-600 rounded-lg">
                            <span className="material-symbols-outlined text-sm font-bold">history</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-[10px] leading-none">Storico</h4>
                            <p className="text-[8px] text-slate-400 mt-1 font-medium">Timbrature passate</p>
                          </div>
                        </div>

                        {/* Payments block */}
                        <div className="col-span-2 bg-gradient-to-r from-white to-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-3 shadow-sm text-left">
                          <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg flex-shrink-0">
                            <Wallet className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-800 text-[10px] leading-none">Buste Paga & Pagamenti</h4>
                            <p className="text-[8px] text-slate-450 mt-1 font-medium">Visualizza lo storico dei compensi</p>
                          </div>
                          <span className="material-symbols-outlined text-[12px] text-slate-400">arrow_forward</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Nav Bar Replica */}
                    <nav className="absolute bottom-0 left-0 w-full flex justify-around items-center px-1 pb-3 pt-2 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.03)] z-20 rounded-b-[32px]">
                      <div className="flex flex-col items-center justify-center text-primary cursor-pointer px-2">
                        <span className="material-symbols-outlined text-base font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
                        <span className="text-[8px] font-extrabold leading-none mt-0.5">Home</span>
                      </div>
                      <div className="flex flex-col items-center justify-center text-slate-400 cursor-pointer px-2">
                        <span className="material-symbols-outlined text-base">event_note</span>
                        <span className="text-[8px] font-semibold leading-none mt-0.5">Ferie</span>
                      </div>
                      <div className="flex flex-col items-center justify-center text-slate-400 cursor-pointer px-2">
                        <span className="material-symbols-outlined text-base">history</span>
                        <span className="text-[8px] font-semibold leading-none mt-0.5">Storico</span>
                      </div>
                      <div className="flex flex-col items-center justify-center text-slate-400 cursor-pointer px-2">
                        <span className="material-symbols-outlined text-base">account_balance_wallet</span>
                        <span className="text-[8px] font-semibold leading-none mt-0.5">Paga</span>
                      </div>
                      <div className="flex flex-col items-center justify-center text-slate-400 cursor-pointer px-2">
                        <span className="material-symbols-outlined text-base">logout</span>
                        <span className="text-[8px] font-semibold leading-none mt-0.5">Esci</span>
                      </div>
                    </nav>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-20 md:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-label text-xs uppercase tracking-widest text-primary font-bold mb-2">FUNZIONALITÀ</h2>
            <p className="font-headline text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Tutto ciò di cui hai bisogno per la gestione del personale.
            </p>
            <p className="mt-4 text-slate-500 font-medium">
              Elimina i vecchi badge fisici. Gestisci e valida gli accessi dei tuoi collaboratori da un unico pannello amministrativo moderno e intuitivo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="group bg-slate-50 border border-slate-100 hover:border-blue-200 rounded-3xl p-8 hover:shadow-xl transition-all duration-300">
                <div className="bg-white rounded-2xl p-4 w-fit shadow-md group-hover:scale-110 transition-transform mb-6">
                  {f.icon}
                </div>
                <span className="inline-block text-[10px] uppercase tracking-wider font-extrabold text-primary bg-blue-50 px-2.5 py-0.5 rounded-full mb-3">
                  {f.badge}
                </span>
                <h3 className="font-headline text-xl font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Geofencing & PWA Showcase */}
      <section className="py-20 md:py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute right-0 bottom-0 -z-10 h-[500px] w-[500px] rounded-full bg-blue-900/20 blur-3xl"></div>
        
        <div className="mx-auto max-w-7xl px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 uppercase tracking-widest mb-4 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              <Lock className="w-3.5 h-3.5" /> Funzione Enterprise
            </span>
            <h2 className="font-headline text-3xl font-extrabold tracking-tight sm:text-4xl leading-tight">
              Geofencing GPS: Timbra solo dove consentito.
            </h2>
            <p className="mt-4 text-slate-400 leading-relaxed font-medium">
              Grazie al modulo GPS avanzato, definisci l'esatta posizione di uffici o cantieri temporanei. I tuoi dipendenti potranno timbrare solo se si trovano fisicamente all'interno del raggio autorizzato.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-500/20 p-1.5 rounded-lg text-blue-400 mt-1">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white">Raggio configurabile in metri</h4>
                  <p className="text-sm text-slate-400">Imposta precisione e distanza per ciascuna area lavorativa.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-500/20 p-1.5 rounded-lg text-blue-400 mt-1">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white">Previene timbrature extra-ufficio</h4>
                  <p className="text-sm text-slate-400">Ottimo per dipendenti dislocati sul territorio o cantieri edili.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center">
            {/* Interactive Mockup Circle */}
            <div className="w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] rounded-full border-4 border-dashed border-blue-500/30 flex items-center justify-center relative animate-pulse">
              <div className="w-[200px] h-[200px] rounded-full bg-blue-500/10 border-2 border-blue-500/40 flex items-center justify-center relative">
                <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/50">
                  <MapPin className="w-6 h-6" />
                </div>
                <span className="absolute -top-6 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">SEDE AZIENDA</span>
              </div>
              {/* Pulsing indicator of a user */}
              <div className="absolute top-10 right-10 bg-emerald-500 text-white p-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-md shadow-emerald-500/30">
                <Check className="w-3.5 h-3.5" /> Dipendente Autorizzato
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-28 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-label text-xs uppercase tracking-widest text-primary font-bold mb-2">ABBONAMENTI</h2>
            <p className="font-headline text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Piani trasparenti, adatti ad ogni esigenza.
            </p>
            <p className="mt-4 text-slate-500 font-medium">
              Scegli il piano ideale per la tua impresa. Nessun costo nascosto, cancelli quando vuoi.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {pricing.map((p, i) => (
              <div key={i} className={`flex flex-col border-2 rounded-3xl p-8 transition-transform hover:-translate-y-1 ${p.color}`}>
                {p.recommended && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md">
                    CONSIGLIATO
                  </span>
                )}
                
                <div className="mb-6">
                  <h3 className="font-headline text-lg font-extrabold text-slate-900 mb-2">{p.name}</h3>
                  <p className="text-slate-500 text-sm min-h-[40px]">{p.desc}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900">{p.price}</span>
                    <span className="text-sm font-semibold text-slate-500">/ {p.period}</span>
                  </div>
                </div>

                <div className="h-px bg-slate-200/60 mb-6"></div>

                <ul className="space-y-4 flex-1 mb-8">
                  {p.features.map((f, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <a 
                  href={p.href}
                  className={`w-full py-4 rounded-xl font-bold text-center transition-all ${p.buttonColor}`}
                >
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-20 md:py-28 bg-white">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center mb-16">
            <h2 className="font-label text-xs uppercase tracking-widest text-primary font-bold mb-2">SUPPORTO</h2>
            <p className="font-headline text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Domande Frequenti
            </p>
            <p className="mt-4 text-slate-500 font-medium">
              Tutto quello che c'è da sapere sul funzionamento di TimbroSmart.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden transition-all">
                  <button 
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                  >
                    <span className="font-headline font-bold text-slate-900 text-base md:text-lg">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-primary' : ''}`} />
                  </button>
                  
                  {isOpen && (
                    <div className="px-6 pb-6 pt-0 text-slate-600 text-sm md:text-base leading-relaxed border-t border-slate-200/50 animate-slide-down">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-12 md:py-16 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-primary p-2 rounded-xl text-white">
                  <span className="material-symbols-outlined text-2xl font-bold flex items-center justify-center" style={{ fontVariationSettings: "'FILL' 1" }}>fingerprint</span>
                </div>
                <span className="font-headline font-extrabold text-xl tracking-tight text-white">TimbroSmart</span>
              </div>
              <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-6">
                TimbroSmart è una soluzione innovativa creata da Cosmonet per semplificare e rendere intelligente la timbratura e la gestione delle ore lavorative.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-sm text-slate-200 uppercase tracking-wider mb-4">Collegamenti</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="text-slate-400 hover:text-white transition-colors">Funzionalità</a></li>
                <li><a href="#pricing" className="text-slate-400 hover:text-white transition-colors">Prezzi</a></li>
                <li><a href="#faq" className="text-slate-400 hover:text-white transition-colors">FAQ</a></li>
                <li><Link href="/login" className="text-slate-400 hover:text-white transition-colors">Area Accedi</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm text-slate-200 uppercase tracking-wider mb-4">Contatti & Supporto</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="mailto:cosmonetinfo85@gmail.com" className="text-slate-400 hover:text-white transition-colors">cosmonetinfo85@gmail.com</a></li>
                <li><a href="https://wa.me/393517064080" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1">WhatsApp Support <ExternalLink className="w-3.5 h-3.5" /></a></li>
                <li><Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="h-px bg-slate-800 my-8"></div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-medium">
            <p>© 2026 Cosmonet - TimbroSmart. Tutti i diritti riservati.</p>
            <p>Codice Fiscale / P.IVA Cosmonet | Ospitato su Server Sicuri UE</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
