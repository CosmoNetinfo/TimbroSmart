<div align="center">
  <img src="public/icons/app-icon-nobg.png" alt="TimbroSmart Logo" width="120" />
</div>

<h1 align="center">TimbroSmart</h1>
<p align="center"><strong>Elevate Time Management (SaaS Ready)</strong></p>

---

## 📋 Descrizione
**TimbroSmart** è una Progressive Web App (PWA) avanzata, progettata in stile *Glassmorphism* moderno, per la gestione delle presenze e della contabilità aziendale. 
Ideata per operare come un SaaS (Software as a Service) multi-tenant, permette alle aziende di gestire i propri dipendenti, e a quest'ultimi di tracciare orari con prove fotografiche e calcolare i guadagni in tempo reale.

## 🚀 Funzionalità Principali

### 🏢 Categorie di Utenti (Multi-Level)
- **Super Amministratore (License Manager)**: Strumento segreto per la generazione e gestione delle licenze SaaS (FREE, PRO, ENTERPRISE).
- **Amministratore Aziendale (Admin)**: Creazione dipendenti, monitoraggio timbrature in tempo reale, statistiche, esportazione PDF/Excel e gestione buste paga/versamenti.
- **Dipendente**: Timbratura geolocalizzata rapida, visualizzazione calendario e storico pagamenti.

### 💎 Design Premium (UI/UX)
- Interfaccia **Glassmorphism** moderna: sfondi sfocati, transizioni fluide ed estetica al neon (Tema Azure/Blue). 
- Completamente vettoriale (Lucide Icons) e ottimizzato sia per schermi desktop che per il mobile (PWA).

### 🔐 Sicurezza e SaaS
- **Firebase Auth + Firestore**: Gestione sicura delle sessioni (JWT storage via Cookie per prevenire colli di bottiglia e cold-boot lenti).
- **Controllo Accessi Rigoroso**: Impossibile registrarsi senza una chiave di licenza valida generata dal Super Admin.
- Timbrature bloccate e verificate fotograficamente.

### 💻 Pannello Amministratore (Admin)
- **Dashboard Statistica**: Grafici interattivi (Bar Charts) del carico di lavoro.
- **Calendario Integrato**: Panoramica visiva mensile delle presenze del team.
- **Esportazione**: Generazione istantanea di PDF professionali (Busta Paga) e CSV.

### 📱 Portale Dipendenti
- Auto-Login persistente (PWA).
- Azioni veloci: "Entra" / "Esci" con fotocamera integrata.
- Calcolo automatico del guadagno in base al monte ore settimanale/mensile.

## 🛠️ Stack Tecnologico
*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router, React 19)
*   **Linguaggio**: TypeScript & JSX
*   **Backend & DB**: [Firebase](https://firebase.google.com/) (Firestore, Storage, Admin SDK)
*   **Styling**: CSS Modules & Variabili Native
*   **Visualizzazione Dati**: [Recharts](https://recharts.org/)
*   **Esportazioni**: JSPDF & AutoTable
*   **Hosting**: [Vercel](https://vercel.com/) 

## � Installazione PWA (Senza Store)
Essendo una Web App Progressiva, non richiede l'App Store o Google Play:
1. **iOS (Safari)**: Apri il link -> Condividi -> "Aggiungi alla schermata Home".
2. **Android (Chrome)**: Apri il link -> Menu (3 puntini) -> "Aggiungi a schermata Home".

---
*Sviluppato con passione per i team che vogliono semplificare la burocrazia aziendale.*
