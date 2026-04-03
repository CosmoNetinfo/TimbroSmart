# 🔑 Credenziali di Test - TimbroSmart

Questo file contiene tutti i codici necessari per testare le funzionalità della piattaforma, gestire i diversi livelli di licenza e accedere ai pannelli amministrativi.

---

## 👥 1. Accesso Admin (Login)
Usa questi codici nella pagina di login principale per accedere direttamente al pannello Admin dell'azienda corrispondente.

| Livello Piano | Codice Segreto (Login) | Note |
| :--- | :--- | :--- |
| **FREE** | `ADMIN_BASE` | Limiti attivi (max 3-5 dipendenti) |
| **PRO** | `ADMIN_PRO` | Funzioni Contabilità e PDF sbloccate |
| **ENTERPRISE** | `ADMIN_ENT` | **Full Access**: BI Hub, Export Center, Branding |

---

## 🎫 2. Codici Seriali (Upgrade Licenza)
Usa questi codici nella sezione **Admin > Gestione Licenza** per simulare l'attivazione di un nuovo abbonamento di 12 mesi.

| Piano da Attivare | Codice Seriale | Validità |
| :--- | :--- | :--- |
| **FREE** | `BASE-7788-9900-TSMT` | 12 Mesi |
| **PRO** | `PROO-1122-3344-TSMT` | 12 Mesi |
| **ENTERPRISE** | `ENTR-5566-7788-TSMT` | 12 Mesi |

---

## 🛠️ Note per lo Sviluppatore
- Gli account sopra indicati sono stati inizializzati via script. 
- In caso di reset del database, rieseguire lo script `seed-admin.js`.
- Per testare le funzioni Enterprise, si raccomanda l'uso di `ADMIN_ENT`.

---

<div align="center">
  <p>© 2026 TimbroSmart - Ambiente di Test e QA</p>
</div>
