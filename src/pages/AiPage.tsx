// AiPage.tsx
// Pagina della sezione "AI" del progetto Gaby React.
// Per ora è solo la STRUTTURA VISIVA: i pulsanti non fanno ancora nulla,
// li colleghiamo ai prossimi pezzi (RAG, popup, voce, upload) uno alla volta.

import React, { useState } from "react";
import "./AiPage.css"; // il file di stile che creiamo subito dopo

const AiPage: React.FC = () => {
  // Testo che l'utente scrive nella domanda
  const [domanda, setDomanda] = useState<string>("");

  // Testo che l'utente scrive per aggiungere nuove informazioni
  const [nuovaInfo, setNuovaInfo] = useState<string>("");

  // Funzione chiamata quando si preme "Chiedi"
  // (per ora non fa nulla di reale, solo un log per capire che funziona)
  const handleChiedi = () => {
    console.log("Domanda inviata (da collegare al motore AI):", domanda);
  };

  // Funzione chiamata quando si preme il pulsante del microfono
  // (per ora finta, la colleghiamo quando facciamo l'input vocale)
  const handleMicrofono = () => {
    console.log("Pulsante microfono premuto (da collegare più avanti)");
  };

  // Funzione chiamata quando si preme "Salva" nella zona apprendimento
  // (per ora non fa nulla di reale, solo un log)
  const handleSalvaInfo = () => {
    console.log("Nuova informazione da salvare (da collegare a Supabase):", nuovaInfo);
  };

  return (
    <div className="ai-page">
      <h1 className="ai-title">Assistente AI — Nazionale Italiana</h1>

      {/* ZONA 1: fai una domanda */}
      <section className="ai-section ai-question-section">
        <h2>Fai una domanda</h2>
        <div className="ai-question-row">
          <input
            type="text"
            className="ai-question-input"
            placeholder="Scrivi qui la tua domanda..."
            value={domanda}
            onChange={(e) => setDomanda(e.target.value)}
          />
          {/* Pulsante microfono: icona finta per ora, la sostituiamo dopo */}
          <button
            className="ai-mic-button"
            onClick={handleMicrofono}
            title="Fai la domanda a voce"
          >
            🎤
          </button>
          <button className="ai-ask-button" onClick={handleChiedi}>
            Chiedi
          </button>
        </div>
      </section>

      {/* ZONA 2: qui apparirà il popup colorato con la risposta */}
      <section className="ai-section ai-answer-section">
        <h2>Risposta</h2>
        <div className="ai-answer-placeholder">
          {/* Per ora vuoto: qui in futuro comparirà il popup di risposta */}
          <p className="ai-placeholder-text">
            Le risposte appariranno qui.
          </p>
        </div>
      </section>

      {/* ZONA 3: carica nuove informazioni */}
      <section className="ai-section ai-learn-section">
        <h2>Aggiungi nuove informazioni</h2>
        <textarea
          className="ai-learn-textarea"
          placeholder="Scrivi qui informazioni sulla nazionale italiana da insegnare all'AI..."
          value={nuovaInfo}
          onChange={(e) => setNuovaInfo(e.target.value)}
          rows={6}
        />
        <button className="ai-save-button" onClick={handleSalvaInfo}>
          Salva
        </button>
      </section>
    </div>
  );
};

export default AiPage;