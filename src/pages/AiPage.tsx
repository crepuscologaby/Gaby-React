// AiPage.tsx
// Pagina della sezione "AI" del progetto Gaby React.
// Per ora è solo la STRUTTURA VISIVA: i pulsanti non fanno ancora nulla,
// li colleghiamo ai prossimi pezzi (RAG, popup, voce, upload) uno alla volta.

import React, { useState } from "react";
import "./AiPage.css"; // il file di stile che creiamo subito dopo
// Aggiungi questo import in cima ad AiPage.tsx, insieme agli altri
import { supabase } from "../lib/supabaseClient";

const AiPage: React.FC = () => {
  // Testo che l'utente scrive nella domanda
  const [domanda, setDomanda] = useState<string>("");

  // Testo che l'utente scrive per aggiungere nuove informazioni
  const [nuovaInfo, setNuovaInfo] = useState<string>("");

  // Funzione chiamata quando si preme "Chiedi"
  // (per ora non fa nulla di reale, solo un log per capire che funziona)
// Aggiungi questi stati insieme agli altri (domanda, nuovaInfo, ecc.)
const [rispostaAI, setRispostaAI] = useState<string>("");
const [caricamentoRisposta, setCaricamentoRisposta] = useState<boolean>(false);

// Sostituisce la vecchia handleChiedi (quella con solo console.log)
const handleChiedi = async () => {
  if (!domanda.trim()) return;

  setCaricamentoRisposta(true);
  setRispostaAI("");

  try {
    // Chiamiamo il nostro endpoint su Vercel (api/chiedi-ai.ts)
    const risposta = await fetch("/api/chiedi-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domanda }),
    });

    const dati = await risposta.json();

    if (dati.errore) {
      setRispostaAI("Errore: " + dati.errore);
    } else {
      setRispostaAI(dati.risposta);
    }
  } catch (errore) {
    setRispostaAI("Errore nel contattare l'assistente.");
  }

  setCaricamentoRisposta(false);
};

  // Funzione chiamata quando si preme il pulsante del microfono
  // (per ora finta, la colleghiamo quando facciamo l'input vocale)
  const handleMicrofono = () => {
    console.log("Pulsante microfono premuto (da collegare più avanti)");
  };

  // Funzione chiamata quando si preme "Salva" nella zona apprendimento
  // (per ora non fa nulla di reale, solo un log)
// Sostituisci la vecchia handleSalvaInfo (quella con solo il console.log) con questa

// Messaggio da mostrare dopo il salvataggio (successo o errore)
const [messaggioSalvataggio, setMessaggioSalvataggio] = useState<string>("");

const handleSalvaInfo = async () => {
  // Non salviamo se la textarea è vuota
  if (!nuovaInfo.trim()) {
    setMessaggioSalvataggio("Scrivi qualcosa prima di salvare.");
    return;
  }

  // insert manda una nuova riga alla tabella ai_conoscenza
  const { error } = await supabase
    .from("ai_conoscenza")
    .insert({ contenuto: nuovaInfo });

  if (error) {
    setMessaggioSalvataggio("Errore nel salvataggio: " + error.message);
  } else {
    setMessaggioSalvataggio("Informazione salvata!");
    setNuovaInfo(""); // svuota la textarea dopo il salvataggio
  }
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
          {caricamentoRisposta && <p className="ai-placeholder-text">Sto pensando...</p>}
          {!caricamentoRisposta && !rispostaAI && (
            <p className="ai-placeholder-text">Le risposte appariranno qui.</p>
          )}
          {!caricamentoRisposta && rispostaAI && (
            <p className="ai-answer-text">{rispostaAI}</p>
          )}
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
        {messaggioSalvataggio && <p className="ai-save-message">{messaggioSalvataggio}</p>}
      </section>
    </div>
  );
};

export default AiPage;