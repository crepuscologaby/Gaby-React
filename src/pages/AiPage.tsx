// Pagina segnaposto (placeholder) per la sezione AI privata.
// Nel prossimo step qui aggiungeremo:
// - una chat dove l'utente può scrivere domande
// - la possibilità di allegare immagini e PDF
// - la chiamata al backend che a sua volta chiama l'API Anthropic (Claude)

export default function AiPage() {
  return (
    <section className="min-h-screen px-8 py-16">
      <h1 className="text-4xl font-bold mb-4">Assistente AI</h1>
      <p className="text-gray-600">
        Qui potrai fare domande di testo e allegare immagini o PDF.
        (da sviluppare nel prossimo step)
      </p>
    </section>
  );
}
