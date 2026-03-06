# Guida al Deploy (Vercel)

TimbroSmart è configurato per funzionare al meglio su **Vercel**. Segui questi passaggi per pubblicare l'app.

## 1. Caricamento su GitHub
Prima di tutto, carica il codice su un repository privato GitHub:
1. Crea un nuovo repository su [github.com/new](https://github.com/new).
2. Nel terminale (nella cartella `l:\TimbroSmart`):
   ```bash
   git remote add origin https://github.com/tuo-utente/timbrosmart.git
   git branch -M main
   git push -u origin main
   ```

## 2. Configurazione su Vercel
1. Vai su [vercel.com](https://vercel.com) e importa il repository.
2. **Environment Variables**: Questo è il passaggio più importante. Devi copiare tutte le chiavi dal tuo `.env.local` attuale e incollarle nelle impostazioni del progetto su Vercel:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `FIREBASE_PROJECT_ID` (lo stesso di sopra)
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (assicurati di includere `"-----BEGIN PRIVATE KEY-----\n..."`)

## 3. Dominio e PWA
- Vercel ti assegnerà un URL `.vercel.app`.
- Per testare la PWA su Android, apri l'URL in Chrome su mobile e clicca su "Aggiungi a schermata Home".

---

# Strategia di Test (SaaS & Multi-tenancy)

Per verificare che tutto funzioni correttamente, ti suggerisco questo flusso di test:

### Passo 1: Registrazione Admin (Nuova Azienda)
1. Vai alla pagina di Registrazione.
2. Crea un account Admin spuntando "Registra Nuova Azienda".
3. Verifica che verrai reindirizzato al Dashboard Admin e che il piano sia **FREE**.

### Passo 2: Limiti Piano FREE
1. Dal pannello Admin, aggiungi nuovi dipendenti (Workers).
2. Dopo il 3° dipendente, prova ad aggiungerne un 4°. 
3. Dovresti ricevere un messaggio di blocco: *"Limite raggiunto per il piano FREE"*.

### Passo 3: Funzioni PRO Gated
1. Prova a cliccare su **Gestione Pagamenti** o **Export PDF**.
2. Dovrebbe apparire un avviso che ti invita a passare al piano PRO.

### Passo 4: Sblocco tramite Seriale
1. Vai in **Gestione Licenza**.
2. Inserisci un codice seriale (es. `PRO-TEST-2024`).
3. Lo stato passerà a **PENDING**. 
4. *(Per simulare l'approvazione, dovrai cambiare manualmente il campo `plan` dell'azienda in `PRO` nella console di Firebase).*
5. Una volta approvato, verifica che le funzioni PDF e Pagamenti si sblocchino.

### Passo 5: Test Offline (Timbro)
1. Entra come Worker su uno smartphone.
2. Spegni il Wi-Fi/Dati.
3. Effettua una timbratura. L'interfaccia dovrebbe mostrare successo (i dati sono salvati localmente).
4. Riattiva internet e verifica nella console Firebase che la timbratura sia stata sincronizzata.
