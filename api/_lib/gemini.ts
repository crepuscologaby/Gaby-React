// api/_lib/gemini.ts
// Funzioni condivise per parlare con Gemini (embedding + generazione).
// I file che iniziano con "_" NON diventano endpoint pubblici su Vercel:
// sono solo codice condiviso importato dagli altri file in /api.

// Riprova automaticamente le chiamate a Gemini quando il modello è
// temporaneamente sovraccarico (503) o si superano i limiti di frequenza (429),
// invece di mostrare subito un errore all'utente.
async function fetchGeminiConRiprovi(url: string, opzioni: RequestInit, tentativi = 3): Promise<any> {
  for (let tentativo = 1; tentativo <= tentativi; tentativo++) {
    const risposta = await fetch(url, opzioni);
    const dati = await risposta.json();

    const codiceErrore = dati?.error?.code;
    const puoRiprovare = codiceErrore === 503 || codiceErrore === 429;

    if (!puoRiprovare || tentativo === tentativi) {
      return dati;
    }

    const attesaMs = 1000 * tentativo; // 1s, 2s, 3s...
    await new Promise((resolve) => setTimeout(resolve, attesaMs));
  }
}

const CHIAVE_GEMINI = process.env.GEMINI_API_KEY as string;
const MODELLO_TESTO = "gemini-flash-latest"; // stesso modello che usavi già
// text-embedding-004 è stato dismesso da Google: il modello attuale è gemini-embedding-001.
// NOTA: il parametro outputDimensionality (per chiedere un vettore ridotto a 768)
// è attualmente ignorato dall'API di Google (bug noto) e continua a restituire
// il vettore completo a 3072 dimensioni. Invece di inseguirlo, usiamo direttamente
// i 3072 e la colonna del database è configurata di conseguenza (vector(3072)).
const MODELLO_EMBEDDING = "gemini-embedding-001";

/**
 * Trasforma un testo in un vettore numerico (3072 dimensioni).
 * taskType va messo a "RETRIEVAL_DOCUMENT" quando si indicizza conoscenza
 * e a "RETRIEVAL_QUERY" quando si interpreta la domanda dell'utente:
 * migliora sensibilmente la qualità del recupero (RAG).
 */
export async function creaEmbedding(
  testo: string,
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" = "RETRIEVAL_DOCUMENT"
): Promise<number[]> {
  const dati = await fetchGeminiConRiprovi(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODELLO_EMBEDDING}:embedContent?key=${CHIAVE_GEMINI}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text: testo }] },
        embedContentConfig: { taskType },
      }),
    }
  );

  if (!dati?.embedding?.values) {
    throw new Error("Gemini non ha restituito un embedding valido: " + JSON.stringify(dati));
  }

  return dati.embedding.values as number[];
}

// Schema che obblighiamo Gemini a rispettare per la risposta strutturata
// (così il frontend riceve sempre lo stesso "shape" di dati per il popup).
const SCHEMA_RISPOSTA = {
  type: "object",
  properties: {
    titolo: { type: "string" },
    datiPrincipali: {
      type: "array",
      items: {
        type: "object",
        properties: {
          etichetta: { type: "string" },
          valore: { type: "string" },
        },
        required: ["etichetta", "valore"],
      },
    },
    descrizione: { type: "string" },
  },
  required: ["titolo", "datiPrincipali", "descrizione"],
};

/**
 * Chiede a Gemini una risposta in JSON strutturato (titolo, dati, descrizione),
 * pronta per essere mostrata nel popup colorato.
 */
export async function generaRispostaStrutturata(prompt: string) {
  const dati = await fetchGeminiConRiprovi(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODELLO_TESTO}:generateContent?key=${CHIAVE_GEMINI}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: SCHEMA_RISPOSTA,
        },
      }),
    }
  );

  const testoJson = dati?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!testoJson) {
    throw new Error("Gemini non ha restituito una risposta valida: " + JSON.stringify(dati));
  }

  return JSON.parse(testoJson) as {
    titolo: string;
    datiPrincipali: { etichetta: string; valore: string }[];
    descrizione: string;
  };
}

/**
 * Chiede a Gemini di descrivere un'immagine (in italiano), a partire
 * dai suoi byte in base64. Il testo restituito è quello che verrà
 * indicizzato/embeddato come "contenuto" della riga in ai_conoscenza.
 */
export async function descriviImmagine(base64: string, mimeType: string, didascalia?: string) {
  const dati = await fetchGeminiConRiprovi(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODELLO_TESTO}:generateContent?key=${CHIAVE_GEMINI}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: mimeType, data: base64 } },
              {
                text:
                  "Descrivi questa immagine in italiano, in modo dettagliato, per un'AI che risponde a domande sulla nazionale italiana di calcio." +
                  (didascalia ? ` Contesto fornito da chi ha caricato l'immagine: ${didascalia}` : ""),
              },
            ],
          },
        ],
      }),
    }
  );

  const descrizione = dati?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!descrizione) {
    throw new Error("Gemini non ha descritto l'immagine: " + JSON.stringify(dati));
  }

  return descrizione as string;
}

// Colori tra cui scegliere a caso per lo sfondo del popup (stile Deda/insights)
const COLORI_POPUP = ["#E8590C", "#2B8A3E", "#1864AB", "#862E9C", "#C92A2A", "#0B7285", "#5F3DC4"];

export function coloreCasuale(): string {
  return COLORI_POPUP[Math.floor(Math.random() * COLORI_POPUP.length)];
}