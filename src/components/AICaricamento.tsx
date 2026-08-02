// src/components/AICaricamento.tsx
// Popup mostrato MENTRE l'AI sta elaborando la risposta (tre puntini rossi
// animati). Si chiude da solo appena arriva la risposta vera (gestito da
// AiPage.tsx tramite lo stato "caricamentoRisposta").

import React from "react";
import "./AICaricamento.css";

const AICaricamento: React.FC = () => {
  return (
    <div className="ai-caricamento-overlay">
      <div className="ai-caricamento-box">
        <div className="ai-puntini">
          <span className="ai-puntino" />
          <span className="ai-puntino" />
          <span className="ai-puntino" />
        </div>
        <p className="ai-caricamento-testo">Sto pensando...</p>
      </div>
    </div>
  );
};

export default AICaricamento;
