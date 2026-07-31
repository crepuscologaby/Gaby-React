// Questa è la pagina che l'utente vede all'indirizzo "/" (la home).
// È un "hero" a due colonne: testo a sinistra, immagine a destra,
// in stile ispirato a deda.com.

// Importiamo l'immagine come se fosse una variabile: Vite si occupa di
// "impacchettarla" correttamente quando facciamo la build del sito.
// (il percorso è relativo a questo file: da src/pages/ saliamo di una cartella
// con "../" per arrivare a src/assets/)
import heroGlobe from "../assets/hero-globe.png";

export default function HomePage() {
  return (
    // min-h-screen -> l'altezza minima è quella dello schermo (occupa tutta la pagina)
    // flex items-center -> mette testo e immagine in riga, allineati al centro verticalmente
    // px-8 -> spaziatura orizzontale
    // gap-12 -> spazio tra la colonna di testo e l'immagine
    <section className="bg-black text-white min-h-screen flex items-center px-8 gap-12">
      {/* Colonna di sinistra: testo. flex-1 = occupa lo spazio disponibile, max-w-2xl = larghezza massima */}
      <div className="flex-1 max-w-2xl">
        {/* Titolo enorme, come "Accelerate Your Business" nel sito di riferimento */}
        <h1 className="text-6xl font-bold mb-6">Benvenuto in Gaby React</h1>

        {/* Sottotitolo/descrizione */}
        <p className="text-xl text-gray-300">
          Un progetto React + TypeScript con una sezione treni in tempo reale
          e un assistente AI privato per rispondere alle tue domande.
        </p>
      </div>

      {/* Colonna di destra: immagine. flex-1 = occupa lo spazio disponibile.
          hidden md:block = nascosta su schermi piccoli (cellulare), visibile da tablet in su
          (su schermi stretti l'immagine grande rovinerebbe la leggibilità del testo) */}
      <div className="flex-1 hidden md:block">
        <img
          src={heroGlobe}
          alt="Rappresentazione grafica di una rete globale a forma di globo"
          className="w-full h-auto"
        />
      </div>
    </section>
  );
}
