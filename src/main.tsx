// Questo file è il "primo" file JavaScript/TypeScript che viene eseguito.
// Il suo unico compito è: prendere il nostro componente principale <App />
// e disegnarlo ("montarlo") dentro al <div id="root"> che abbiamo visto in index.html

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // importiamo il CSS globale (Tailwind) così si applica a tutto il sito

// Cerchiamo l'elemento HTML con id="root" (quello vuoto dentro index.html)
// Il punto esclamativo (!) dice a TypeScript: "sono sicuro che questo elemento esiste"
ReactDOM.createRoot(document.getElementById("root")!).render(
  // React.StrictMode è una "modalità controllo qualità" di React:
  // in sviluppo ci avvisa di errori comuni. Non influisce sul sito online (produzione).
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
