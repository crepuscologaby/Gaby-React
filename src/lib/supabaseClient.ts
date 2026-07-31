// Questo file crea UNA SOLA VOLTA la connessione a Supabase (il nostro DB SQL + storage),
// e poi la "esporta" così qualsiasi altro file del progetto può importarla e usarla
// senza doverla ricreare ogni volta.

import { createClient } from "@supabase/supabase-js";

// import.meta.env.NOME_VARIABILE legge le variabili d'ambiente definite nel file .env
// (vedi .env.example per capire quali servono e dove trovarle su supabase.com)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Piccolo controllo: se le variabili non sono impostate, avvisiamo subito con un errore chiaro
// invece di avere un errore criptico più avanti nel codice.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Mancano le variabili VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Controlla il tuo file .env"
  );
}

// createClient crea l'oggetto che useremo per fare query al database, es:
// supabase.from("nome_tabella").select("*")
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
