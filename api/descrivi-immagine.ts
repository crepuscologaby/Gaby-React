// api/descrivi-immagine.ts
// Il FILE viene caricato dal browser direttamente su Supabase Storage
// (bucket "ai-media"), NON passa da qui: così evitiamo il limite di
// dimensione del corpo delle funzioni Vercel (circa 4.5 MB).
// Questo endpoint riceve solo l'URL pubblico dell'immagine già caricata,
// chiede a Gemini di descriverla, e salva la descrizione (con embedding)
// come nuova riga di conoscenza collegata a quell'immagine.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseServer } from "./_lib/supabaseAdmin.js";
import { creaEmbedding, descriviImmagine } from "./_lib/gemini.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ errore: "Metodo non consentito" });
  }

  const { immagineUrl, nomeFile, didascalia } = req.body;

  if (!immagineUrl || typeof immagineUrl !== "string") {
    return res.status(400).json({ errore: "Manca immagineUrl" });
  }

  try {
    // 1) Scarichiamo i byte dell'immagine dal suo URL pubblico su Supabase Storage
    const rispostaFile = await fetch(immagineUrl);
    if (!rispostaFile.ok) {
      return res.status(400).json({ errore: "Impossibile leggere l'immagine caricata" });
    }
    const arrayBuffer = await rispostaFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = rispostaFile.headers.get("content-type") || "image/jpeg";

    // 2) Chiediamo a Gemini di descrivere l'immagine
    const descrizione = await descriviImmagine(base64, mimeType, didascalia);

    // 3) Il "contenuto" cercabile è la didascalia (se c'è) + la descrizione generata
    const contenuto = didascalia ? `${didascalia}\n\n${descrizione}` : descrizione;
    const embedding = await creaEmbedding(contenuto);

    const { error } = await supabaseServer.from("ai_conoscenza").insert({
      contenuto,
      tipo: "immagine",
      immagine_url: immagineUrl,
      nome_file: nomeFile || null,
      embedding,
    });

    if (error) {
      return res.status(500).json({ errore: "Errore nel salvataggio: " + error.message });
    }

    return res.status(200).json({ ok: true, descrizione });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ errore: err.message });
  }
}
