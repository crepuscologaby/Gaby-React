// api/salva-info.ts
// Sostituisce l'insert diretto che facevi dal browser (handleSalvaInfo).
// Il motivo: per fare RAG serve calcolare l'embedding del testo PRIMA
// di salvarlo, e questo richiede la chiave Gemini, che non deve mai
// stare nel codice del browser. Quindi ora il salvataggio passa da qui.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseServer } from "./_lib/supabaseAdmin";
import { creaEmbedding } from "./_lib/gemini";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ errore: "Metodo non consentito" });
  }

  const { contenuto } = req.body;

  if (!contenuto || typeof contenuto !== "string" || !contenuto.trim()) {
    return res.status(400).json({ errore: "Manca il contenuto" });
  }

  try {
    const embedding = await creaEmbedding(contenuto);

    const { error } = await supabaseServer.from("ai_conoscenza").insert({
      contenuto,
      tipo: "testo",
      embedding,
    });

    if (error) {
      return res.status(500).json({ errore: "Errore nel salvataggio: " + error.message });
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ errore: err.message });
  }
}
