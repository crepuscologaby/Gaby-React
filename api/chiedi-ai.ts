// api/chiedi-ai.ts
// Endpoint "dietro le quinte" su Vercel: riceve la domanda dell'utente,
// recupera le informazioni salvate su Supabase, le manda a Google Gemini
// insieme alla domanda, e restituisce la risposta al sito.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Creiamo qui un client Supabase "lato server" (diverso da quello del sito,
// che gira nel browser) usando le stesse variabili d'ambiente
const supabase = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.VITE_SUPABASE_ANON_KEY as string
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Accettiamo solo richieste POST (l'utente manda la domanda nel "corpo" della richiesta)
  if (req.method !== "POST") {
    return res.status(405).json({ errore: "Metodo non consentito" });
  }

  // La domanda scritta dall'utente, mandata dal frontend
  const { domanda } = req.body;

  if (!domanda || typeof domanda !== "string") {
    return res.status(400).json({ errore: "Manca la domanda" });
  }

  // 1) Recuperiamo tutte le informazioni salvate finora su Supabase
  const { data: conoscenza, error: erroreSupabase } = await supabase
    .from("ai_conoscenza")
    .select("contenuto");

  if (erroreSupabase) {
    return res.status(500).json({ errore: "Errore nel leggere i dati: " + erroreSupabase.message });
  }

  // Uniamo tutte le informazioni in un unico testo, che daremo in pasto a Gemini
  const contestoTestuale = (conoscenza || [])
    .map((riga) => riga.contenuto)
    .join("\n---\n");

  // 2) Costruiamo il prompt: diciamo a Gemini di rispondere SOLO usando queste informazioni
  const prompt = `Sei un assistente esperto sulla nazionale italiana di calcio.
Rispondi alla domanda dell'utente usando SOLO le informazioni fornite qui sotto.
Se non trovi la risposta nelle informazioni, dillo chiaramente invece di inventare.

INFORMAZIONI DISPONIBILI:
${contestoTestuale}

DOMANDA DELL'UTENTE:
${domanda}

Rispondi in italiano, in modo chiaro e sintetico.`;

  try {
    // 3) Chiamiamo l'API gratuita di Google Gemini
    const rispostaGemini = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const datiRisposta = await rispostaGemini.json();

    // Estraiamo il testo della risposta dalla struttura restituita da Gemini
    const testoRisposta =
      datiRisposta?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Non sono riuscito a generare una risposta.";

    return res.status(200).json({ risposta: testoRisposta });
  } catch (erroreGemini) {
    return res.status(500).json({ errore: "Errore nel contattare Gemini" });
  }
}