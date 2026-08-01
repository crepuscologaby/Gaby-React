// Funzione serverless "nativa" di Vercel (non richiede Next.js).
// Vercel riconosce automaticamente ogni file dentro /api come un endpoint:
// questo file diventerà disponibile all'indirizzo /api/treni

// Il prefisso "_" davanti a "_req" dice a Vercel/TypeScript "so che non lo uso,
// ma deve restare al suo posto" perché la piattaforma chiama sempre handler(req, res)
// in quest'ordine — se tolgo il primo parametro, "res" riceve per sbaglio "req".
export default async function handler(_req: any, res: any) {
  // Costruiamo l'URL corretto dell'API dei treni.
  // "from" e "to" sono le stazioni, "fields[]" dice all'API quali dati vogliamo indietro
  // (qui chiediamo esplicitamente la lista di fermate con orari previsti/reali).
  const params = new URLSearchParams({
    from: "Milano",
    to: "Bern",
  });
// Ogni fields[] è un campo che l'API DEVE includere nella risposta:
  // se non lo elenchiamo qui, anche se esiste non viene restituito.
  params.append("fields[]", "connections/sections/journey/passList");
  params.append("fields[]", "connections/sections/journey/category");
  params.append("fields[]", "connections/sections/journey/number");

  const url = `https://transport.opendata.ch/v1/connections?${params.toString()}`;

  try {
    const apiRes = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!apiRes.ok) {
      // Leggiamo il corpo di errore restituito da transport.opendata.ch
      // così possiamo vedere ESATTAMENTE perché ha rifiutato la richiesta
      // (es. parametri mancanti, stazione non valida, ecc.)
      const dettaglioErrore = await apiRes.text();
      res.status(apiRes.status).json({
        error: "Errore dall'API esterna dei treni",
        dettaglio: dettaglioErrore,
      });
      return;
    }

    const data = await apiRes.json();
    // Restituiamo i dati così come sono al frontend.
    res.status(200).json(data);
    } catch (err) {
        // Errore di rete o eccezione imprevista: includiamo il messaggio originale
        // per capire se è un problema di connessione, di parsing, o altro.
        res.status(500).json({
        error: "Impossibile contattare il servizio treni",
        dettaglio: err instanceof Error ? err.message : String(err),
        });
    }
}