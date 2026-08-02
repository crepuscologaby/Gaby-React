// api/chiedi-ai.ts
// Endpoint "dietro le quinte" su Vercel: riceve la domanda dell'utente,
// la trasforma in embedding, recupera SOLO i pezzi di conoscenza pertinenti
// da Supabase (ricerca per similarità = RAG), li manda a Gemini insieme
// alla domanda, e restituisce una risposta STRUTTURATA (per il popup),
// non più un semplice testo.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseServer } from "./_lib/supabaseAdmin";
import { creaEmbedding, generaRispostaStrutturata, coloreCasuale } from "./_lib/gemini";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ errore: "Metodo non consentito" });
  }

  const { domanda } = req.body;

  if (!domanda || typeof domanda !== "string") {
    return res.status(400).json({ errore: "Manca la domanda" });
  }

  try {
    // 1) Trasformiamo la domanda in un embedding (taskType RETRIEVAL_QUERY,
    //    diverso da quello usato per indicizzare la conoscenza: migliora il recupero)
    const embeddingDomanda = await creaEmbedding(domanda, "RETRIEVAL_QUERY");

    // 2) Recuperiamo SOLO i pezzi di conoscenza più pertinenti (RAG),
    //    invece di prendere tutta la tabella come prima.
    const { data: risultati, error: erroreRicerca } = await supabaseServer.rpc(
      "match_ai_conoscenza",
      {
        query_embedding: embeddingDomanda,
        num_risultati: 5,
        soglia: 0.5,
      }
    );

    if (erroreRicerca) {
      return res.status(500).json({ errore: "Errore nella ricerca: " + erroreRicerca.message });
    }

    const pezzi = risultati || [];
    const contestoTestuale = pezzi.map((p: any, i: number) => `[${i + 1}] ${p.contenuto}`).join("\n---\n");

    // Se tra i risultati c'è un'immagine pertinente, la mostriamo nel popup
    const immaginePertinente = pezzi.find((p: any) => p.tipo === "immagine" && p.immagine_url);

    // 3) Costruiamo il prompt per Gemini, chiedendo un output JSON strutturato
    const prompt = `Sei un assistente esperto sulla nazionale italiana di calcio.
Rispondi alla domanda dell'utente usando SOLO le informazioni fornite qui sotto.
Se non trovi la risposta nelle informazioni, dillo chiaramente nel campo "descrizione" invece di inventare.

INFORMAZIONI DISPONIBILI:
${contestoTestuale || "(nessuna informazione pertinente trovata)"}

DOMANDA DELL'UTENTE:
${domanda}

Regole per la risposta:
- "titolo": breve, ad effetto, massimo 8 parole.
- "datiPrincipali": array di dati chiave (es. anni, numeri, nomi). Se non ci sono dati numerici/puntuali pertinenti, restituisci un array vuoto [].
- "descrizione": 2-4 frasi discorsive in italiano.`;

    const rispostaStrutturata = await generaRispostaStrutturata(prompt);

    // 4) Restituiamo tutto pronto per il popup
    return res.status(200).json({
      colore: coloreCasuale(),
      titolo: rispostaStrutturata.titolo,
      datiPrincipali: rispostaStrutturata.datiPrincipali,
      descrizione: rispostaStrutturata.descrizione,
      immagineUrl: immaginePertinente ? immaginePertinente.immagine_url : null,
    });
  } catch (erroreGemini: any) {
    console.error(erroreGemini);
    return res.status(500).json({ errore: "Errore nel contattare l'assistente: " + erroreGemini.message });
  }
}
