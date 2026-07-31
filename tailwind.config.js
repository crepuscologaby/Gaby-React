/*
  Tailwind è una libreria CSS: invece di scrivere file .css separati,
  scriviamo direttamente nel componente delle "classi di utilità",
  es: <div className="text-white bg-black p-4">...</div>
  - text-white  = colore testo bianco
  - bg-black    = sfondo nero
  - p-4         = padding (spaziatura interna)

  Qui sotto configuriamo Tailwind: gli diciamo QUALI file guardare
  per trovare le classi usate, e possiamo estendere il tema (colori, font, ecc.)
*/

/** @type {import('tailwindcss').Config} */
export default {
  // "content" dice a Tailwind dove cercare le classi CSS che usiamo,
  // così include nel CSS finale SOLO quelle davvero usate (file più leggero)
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Qui in futuro aggiungeremo i colori e i font "brand" del progetto
      // (es. colors: { brand: { black: '#0a0a0a', accent: '#...' } })
    },
  },
  plugins: [],
};
