// AiPage.tsx
// Pagina della sezione "AI" del progetto Gaby React.
// Versione aggiornata: risposta nel popup colorato (non più testo semplice),
// input vocale reale, upload di immagini e PDF per istruire l'AI.

import React, { useState, useRef } from "react";
import "./AiPage.css";
import { supabase } from "../lib/supabaseClient";
import AIPopup, { RispostaAI } from "../components/AIPopup";
import AICaricamento from "../components/AICaricamento";

const AiPage: React.FC = () => {
  // ---- Zona 1: domanda ----
  const [domanda, setDomanda] = useState<string>("");
  const [rispostaAI, setRispostaAI] = useState<RispostaAI | null>(null);
  const [popupAperto, setPopupAperto] = useState<boolean>(false);
  const [caricamentoRisposta, setCaricamentoRisposta] = useState<boolean>(false);
  const [erroreDomanda, setErroreDomanda] = useState<string>("");
  const riconoscimentoRef = useRef<any>(null);

  const handleChiedi = async (testoDomanda?: string) => {
    const testo = (testoDomanda ?? domanda).trim();
    if (!testo) return;

    setCaricamentoRisposta(true);
    setErroreDomanda("");

    try {
      const risposta = await fetch("/api/chiedi-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domanda: testo }),
      });

      const dati = await risposta.json();

      if (dati.errore) {
        setErroreDomanda(dati.errore);
      } else {
        setRispostaAI(dati as RispostaAI);
        setPopupAperto(true);
      }
    } catch (errore) {
      setErroreDomanda("Errore nel contattare l'assistente.");
    }

    setCaricamentoRisposta(false);
  };

  // Input vocale con la Web Speech API (supportata da Chrome/Edge)
  const handleMicrofono = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErroreDomanda("Il riconoscimento vocale non è supportato in questo browser.");
      return;
    }

    const riconoscimento = new SpeechRecognition();
    riconoscimento.lang = "it-IT";
    riconoscimento.interimResults = false;

    riconoscimento.onresult = (evento: any) => {
      const trascrizione = evento.results[0][0].transcript;
      setDomanda(trascrizione);
      handleChiedi(trascrizione);
    };

    riconoscimento.onerror = () => {
      setErroreDomanda("Errore nel riconoscimento vocale.");
    };

    riconoscimentoRef.current = riconoscimento;
    riconoscimento.start();
  };

  // ---- Zona 3: aggiungi nuove informazioni ----
  const [nuovaInfo, setNuovaInfo] = useState<string>("");
  const [messaggioSalvataggio, setMessaggioSalvataggio] = useState<string>("");
  const [salvandoTesto, setSalvandoTesto] = useState<boolean>(false);
  const [caricandoImmagine, setCaricandoImmagine] = useState<boolean>(false);
  const [caricandoPdf, setCaricandoPdf] = useState<boolean>(false);

  const handleSalvaInfo = async () => {
    if (!nuovaInfo.trim()) {
      setMessaggioSalvataggio("Scrivi qualcosa prima di salvare.");
      return;
    }

    setSalvandoTesto(true);
    setMessaggioSalvataggio("Salvataggio in corso...");

    try {
      const risposta = await fetch("/api/salva-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenuto: nuovaInfo }),
      });
      const dati = await risposta.json();

      if (dati.errore) {
        setMessaggioSalvataggio("Errore nel salvataggio: " + dati.errore);
      } else {
        setMessaggioSalvataggio("Informazione salvata!");
        setNuovaInfo("");
      }
    } catch (errore) {
      setMessaggioSalvataggio("Errore nel contattare il server.");
    }

    setSalvandoTesto(false);
  };

  // Carica un'immagine su Supabase Storage, poi chiede a Gemini di descriverla
  const handleCaricaImmagine = async (file: File | undefined) => {
    if (!file) return;
    setCaricandoImmagine(true);
    setMessaggioSalvataggio("Caricamento immagine...");

    try {
      const percorso = `immagini/${Date.now()}-${file.name}`;
      const { error: erroreUpload } = await supabase.storage
        .from("ai-media")
        .upload(percorso, file, { contentType: file.type });

      if (erroreUpload) throw erroreUpload;

      const { data: urlPubblico } = supabase.storage.from("ai-media").getPublicUrl(percorso);

      const risposta = await fetch("/api/descrivi-immagine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          immagineUrl: urlPubblico.publicUrl,
          nomeFile: file.name,
        }),
      });
      const dati = await risposta.json();

      if (dati.errore) {
        setMessaggioSalvataggio("Errore: " + dati.errore);
      } else {
        setMessaggioSalvataggio("Immagine aggiunta alla conoscenza dell'AI!");
      }
    } catch (errore: any) {
      setMessaggioSalvataggio("Errore nel caricamento immagine: " + errore.message);
    }

    setCaricandoImmagine(false);
  };

  // Carica un PDF su Supabase Storage, poi ne estrae ed indicizza il testo
  const handleCaricaPdf = async (file: File | undefined) => {
    if (!file) return;
    setCaricandoPdf(true);
    setMessaggioSalvataggio("Caricamento PDF...");

    try {
      const percorso = `pdf/${Date.now()}-${file.name}`;
      const { error: erroreUpload } = await supabase.storage
        .from("ai-media")
        .upload(percorso, file, { contentType: "application/pdf" });

      if (erroreUpload) throw erroreUpload;

      const { data: urlPubblico } = supabase.storage.from("ai-media").getPublicUrl(percorso);

      const risposta = await fetch("/api/leggi-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfUrl: urlPubblico.publicUrl,
          nomeFile: file.name,
        }),
      });
      const dati = await risposta.json();

      if (dati.errore) {
        setMessaggioSalvataggio("Errore: " + dati.errore);
      } else {
        setMessaggioSalvataggio(`PDF elaborato: ${dati.blocchiSalvati} blocchi aggiunti alla conoscenza dell'AI!`);
      }
    } catch (errore: any) {
      setMessaggioSalvataggio("Errore nel caricamento PDF: " + errore.message);
    }

    setCaricandoPdf(false);
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
            onKeyDown={(e) => e.key === "Enter" && handleChiedi()}
          />
          <button className="ai-mic-button" onClick={handleMicrofono} title="Fai la domanda a voce">
            🎤
          </button>
          <button className="ai-ask-button" onClick={() => handleChiedi()} disabled={caricamentoRisposta}>
            {caricamentoRisposta ? "..." : "Chiedi"}
          </button>
        </div>
        {erroreDomanda && <p className="ai-errore">{erroreDomanda}</p>}
      </section>

      {/* ZONA 2: mentre l'AI elabora mostriamo i puntini animati;
          appena arriva la risposta si apre il popup colorato */}
      {caricamentoRisposta && <AICaricamento />}
      <AIPopup dati={popupAperto ? rispostaAI : null} onChiudi={() => setPopupAperto(false)} />

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
        <button className="ai-save-button" onClick={handleSalvaInfo} disabled={salvandoTesto}>
          {salvandoTesto ? "Salvataggio..." : "Salva"}
        </button>

        <div className="ai-upload-row">
          <label className="ai-upload-label">
            Carica immagine
            <input
              type="file"
              accept="image/*"
              disabled={caricandoImmagine}
              onChange={(e) => handleCaricaImmagine(e.target.files?.[0])}
            />
          </label>

          <label className="ai-upload-label">
            Carica PDF
            <input
              type="file"
              accept="application/pdf"
              disabled={caricandoPdf}
              onChange={(e) => handleCaricaPdf(e.target.files?.[0])}
            />
          </label>
        </div>

        {messaggioSalvataggio && <p className="ai-save-message">{messaggioSalvataggio}</p>}
      </section>
    </div>
  );
};

export default AiPage;
