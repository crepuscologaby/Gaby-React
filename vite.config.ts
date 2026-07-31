// Vite è lo strumento che:
// 1) durante lo sviluppo avvia un server locale super veloce (npm run dev)
// 2) quando siamo pronti, "impacchetta" (build) il sito per metterlo online (npm run build)

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // plugin che insegna a Vite a capire React + JSX

export default defineConfig({
  plugins: [react()],
});
