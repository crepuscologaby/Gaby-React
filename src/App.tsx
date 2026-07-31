// In React, un "componente" è semplicemente una funzione che restituisce dell'HTML
// (in realtà si chiama JSX, ma si scrive quasi come HTML normale).
// App è il componente "principale": contiene tutto il resto del sito.

import { BrowserRouter, Routes, Route } from "react-router-dom";
// react-router-dom ci permette di avere più "pagine" (es. /treni, /ai)
// senza ricaricare mai il browser: cambia solo il contenuto mostrato.

import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import TreniPage from "./pages/TreniPage";
import DbPage from "./pages/DbPage";
import AiPage from "./pages/AiPage";
import PartenzePage from "./pages/PartenzePage";
import PercorsoPage from "./pages/PercorsoPage";
import TempoRealePage from "./pages/TempoRealePage";

export default function App() {
  return (
    // BrowserRouter "attiva" il sistema di navigazione tra pagine per tutto ciò che c'è dentro
    <BrowserRouter>
      {/* La barra di navigazione è fuori dalle Routes: così resta visibile in ogni pagina */}
      <Navbar />

      {/* Routes decide QUALE pagina mostrare in base all'indirizzo (URL) corrente */}
      <Routes>
        {/* path="/" = home page, cioè l'indirizzo principale del sito */}
        <Route path="/" element={<HomePage />} />

        {/* path="/treni" = sezione con le informazioni sui treni (transport.opendata.ch) */}
        <Route path="/treni" element={<TreniPage />} />

        {/* path="/db" = sezione con i dati recuperati dal database SQL */}
        <Route path="/db" element={<DbPage />} />

        {/* path="/ai" = sezione con l'assistente AI privato (testo, immagini, PDF) */}
        <Route path="/ai" element={<AiPage />} />

        {/* 2. ABBINAMENTO SOTTO-PAGINE AI RISPETTIVI LINK */}
        <Route path="/treni/milano-berna/partenze" element={<PartenzePage />} />
        <Route path="/treni/milano-berna/percorso" element={<PercorsoPage />} />
        <Route path="/treni/milano-berna/tempo-reale" element={<TempoRealePage />} />
      </Routes>
    </BrowserRouter>
  );
}