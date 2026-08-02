// api/leggi-pdf.ts
// Come per le immagini: il PDF viene caricato dal browser direttamente
// su Supabase Storage (bucket "ai-media"). Qui riceviamo solo l'URL,
// estraiamo il testo, lo spezziamo in blocchi (per embedding migliori
// e per non superare i limiti di lunghezza) e salviamo una riga per blocco.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import pdfParse from "pdf-parse";
import { supabaseServer } from "./_lib/supabaseAdmin";
import { creaEmbedding } from "./_lib/gemini";

function spezzaTesto(testo: string, dimensioneBlocco = 1500): string[] {
  const pulito = testo.replace(/\s+/g, " ").trim();
  const blocchi: string[] = [];
  for (let i = 0; i < pulito.length; i += dimensioneBlocco) {
    blocchi.push(pulito.slice(i, i + dimensioneBlocco));
  }
  return blocchi.filter((b) => b.length > 0);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ errore: "Metodo non consentito" });
  }

  const { pdfUrl, nomeFile } = req.body;

  if (!pdfUrl || typeof pdfUrl !== "string") {
    return res.status(400).json({ errore: "Manca pdfUrl" });
  }

  try {
    // 1) Scarichiamo il PDF dall'URL pubblico su Supabase Storage
    const rispostaFile = await fetch(pdfUrl);
    if (!rispostaFile.ok) {
      return res.status(400).json({ errore: "Impossibile leggere il PDF caricato" });
    }
    const arrayBuffer = await rispostaFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2) Estraiamo il testo
    const estratto = await pdfParse(buffer);
    const blocchi = spezzaTesto(estratto.text);

    if (blocchi.length === 0) {
      return res.status(400).json({ errore: "Non è stato trovato testo leggibile nel PDF" });
    }

    // 3) Per ogni blocco: embedding + salvataggio come riga separata
    let salvati = 0;
    for (const blocco of blocchi) {
      const embedding = await creaEmbedding(blocco);
      const { error } = await supabaseServer.from("ai_conoscenza").insert({
        contenuto: blocco,
        tipo: "pdf",
        nome_file: nomeFile || null,
        embedding,
      });
      if (error) throw error;
      salvati++;
    }

    return res.status(200).json({ ok: true, blocchiSalvati: salvati });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ errore: err.message });
  }
}
