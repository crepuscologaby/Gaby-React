// PostCSS è uno strumento che "processa" il CSS prima che arrivi al browser.
// Tailwind funziona come plugin di PostCSS: qui li colleghiamo insieme.
// Non serve toccare mai questo file.
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}, // aggiunge automaticamente i prefissi CSS per la compatibilità tra browser (es. -webkit-)
  },
};
