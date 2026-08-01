// Funzione serverless "nativa" di Vercel (non richiede Next.js).
// Vercel riconosce automaticamente ogni file dentro /api come un endpoint:
// questo file diventerà disponibile all'indirizzo /api/treni

// Usiamo tipi generici (any) per request/response invece di importare
// pacchetti extra: così non serve installare nulla in più.
export default async function handler(req: any, res: any) {
  // Costruiamo l'URL corretto dell'API dei treni.
  // "from" e "to" sono le stazioni, "fields[]" dice all'API quali dati vogliamo indietro
  // (qui chiediamo esplicitamente la lista di fermate con orari previsti/reali).
  const params = new URLSearchParams({
    from: "Milano",
    to: "Bern",
  });
  params.append("fields[]", "connections/sections/journey/passList");

  const url = `https://transport.opendata.ch/v1/connections?${params.toString()}`;

  try {
    const apiRes = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!apiRes.ok) {
      // Se l'API esterna risponde con errore, lo giriamo al frontend
      // con un messaggio chiaro invece di far esplodere il parsing JSON.
      res.status(apiRes.status).json({ error: "Errore dall'API esterna dei treni" });
      return;
    }

    const data = await apiRes.json();
    // Restituiamo i dati così come sono al frontend.
    res.status(200).json(data);
  } catch (err) {
    // Errore di rete (server non raggiungibile, timeout, ecc.)
    res.status(500).json({ error: "Impossibile contattare il servizio treni" });
  }
}