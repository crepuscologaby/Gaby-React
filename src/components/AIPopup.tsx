// src/components/AIPopup.tsx
// Popup di risposta dell'AI, stile "insights/customer-success-stories"
// (come lo screenshot di deda.com che hai allegato):
// immagine in alto a sinistra, titolo grande in alto a destra,
// dati principali in grande sotto, descrizione in basso, X per chiudere.
// Il colore di sfondo cambia ad ogni risposta (arriva già scelto dal backend).

import React from "react";
import "./AIPopup.css";

export interface DatoPrincipale {
  etichetta: string;
  valore: string;
}

export interface RispostaAI {
  colore: string;
  titolo: string;
  datiPrincipali: DatoPrincipale[];
  descrizione: string;
  immagineUrl: string | null;
}

interface AIPopupProps {
  dati: RispostaAI | null;
  onChiudi: () => void;
}

const AIPopup: React.FC<AIPopupProps> = ({ dati, onChiudi }) => {
  if (!dati) return null;

  return (
    <div className="ai-popup-overlay" onClick={onChiudi}>
      <div
        className="ai-popup"
        style={{ backgroundColor: dati.colore }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="ai-popup-chiudi" onClick={onChiudi} aria-label="Chiudi">
          ×
        </button>

        <div className="ai-popup-alto">
          {dati.immagineUrl && (
            <div className="ai-popup-immagine">
              <img src={dati.immagineUrl} alt={dati.titolo} />
            </div>
          )}
          <div className="ai-popup-titolo-blocco">
            <span className="ai-popup-tag">NAZIONALE ITALIANA</span>
            <h2 className="ai-popup-titolo">{dati.titolo}</h2>
          </div>
        </div>

        {dati.datiPrincipali.length > 0 && (
          <div className="ai-popup-dati">
            {dati.datiPrincipali.map((dato, indice) => (
              <div className="ai-popup-dato" key={indice}>
                <div className="ai-popup-dato-valore">{dato.valore}</div>
                <div className="ai-popup-dato-etichetta">{dato.etichetta}</div>
              </div>
            ))}
          </div>
        )}

        <div className="ai-popup-descrizione">
          <p>{dati.descrizione}</p>
        </div>
      </div>
    </div>
  );
};

export default AIPopup;
