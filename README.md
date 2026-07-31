# Gaby React

Progetto React + TypeScript con:
- una sezione **Treni** (dati da transport.opendata.ch)
- una sezione **AI** privata (Q&A con testo, immagini, PDF)
- dati salvati su un database SQL (Supabase)

## 📁 Struttura del progetto

```
gaby-react/
├── index.html          <- l'unica pagina HTML "vera" del sito
├── package.json        <- elenco delle librerie usate
├── .env.example         <- esempio delle chiavi segrete da configurare
├── src/
│   ├── main.tsx          <- punto di partenza del codice
│   ├── App.tsx           <- gestisce le pagine (Home, Treni, AI)
│   ├── index.css         <- stili globali (Tailwind)
│   ├── components/
│   │   └── Navbar.tsx    <- barra di navigazione in alto
│   ├── pages/
│   │   ├── HomePage.tsx  <- pagina iniziale
│   │   ├── TreniPage.tsx <- sezione treni (da completare)
│   │   └── AiPage.tsx    <- sezione AI (da completare)
│   └── lib/
│       └── supabaseClient.ts <- connessione al database
```

## 🚀 Come avviarlo sul tuo computer (prima volta)

1. **Installa Node.js** (se non ce l'hai già): scaricalo da [nodejs.org](https://nodejs.org) (versione LTS)

2. **Apri il terminale** dentro la cartella del progetto

3. **Installa le librerie** necessarie (scarica tutto quello scritto in package.json):
   ```
   npm install
   ```

4. **Crea il tuo file `.env`**:
   - copia `.env.example` e rinominalo `.env`
   - vai su [supabase.com](https://supabase.com), crea un progetto gratuito
   - copia URL e chiave "anon" da Project Settings > API dentro il tuo `.env`

5. **Avvia il progetto in modalità sviluppo**:
   ```
   npm run dev
   ```
   Poi apri nel browser l'indirizzo che appare nel terminale (di solito `http://localhost:5173`)

## 🌍 Come mettere il sito online (deploy su Vercel)

1. Carica questo progetto su GitHub (crea un nuovo repository)
2. Vai su [vercel.com](https://vercel.com), accedi con GitHub
3. Clicca "New Project", scegli il tuo repository
4. Nella sezione "Environment Variables" aggiungi le stesse variabili del tuo `.env`
5. Clicca "Deploy" — in un paio di minuti il sito sarà online, gratuitamente

## ✅ Cosa funziona già in questo scheletro

- Navigazione tra 3 pagine: Home, Treni, AI (ancora vuote, le riempiremo nei prossimi step)
- Tailwind CSS configurato e funzionante
- Connessione a Supabase pronta (basta inserire le chiavi nel `.env`)

## 🔜 Prossimi step

- Costruire davvero la sezione Treni (chiamata API + visualizzazione risultati)
- Costruire la sezione AI (chat con upload immagini/PDF)
- Applicare lo stile visivo definitivo ispirato a deda.com
