import { useEffect, useState, useRef } from "react";

interface Station {
  name: string;
}
  
interface Prognosis {
  departure: string | null;
  arrival: string | null;
  platform: string | null;
}

interface PassCheckpoint {
  station: Station;
  arrival: string | null;
  departure: string | null;
  prognosis: Prognosis; 
}

interface Journey {
  passList: PassCheckpoint[];
}

interface Section {
  journey?: Journey;
}

interface Connection {
  sections: Section[];
}

interface ApiResponse {
  connections: Connection[];
}

export default function TreniPage() {
  const [fermate, setFermate] = useState<PassCheckpoint[]>([]);
  const [errore, setErrore] = useState<string | null>(null);
  const [caricamento, setCaricamento] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Chiamiamo la NOSTRA API route (stesso dominio), non più opendata.ch direttamente.
    const url = "/api/treni";
    setCaricamento(true);
    setErrore(null);

    fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Errore di risposta del server");
        return res.json() as Promise<ApiResponse>;
      })
      .then((data) => {
        if (data.connections && data.connections.length > 0) {
          const sezioni = data.connections[0].sections;
          const listaStazioni: PassCheckpoint[] = [];
          
          sezioni.forEach((sezione) => {
            if (sezione.journey?.passList) {
              listaStazioni.push(...sezione.journey.passList);
            }
          });
          
          if (listaStazioni.length === 0) {
            throw new Error("Dati fermate vuoti o non disponibili");
          }
          
          setFermate(listaStazioni);
        } else {
          setErrore("Nessun treno trovato per la tratta Milano - Berna.");
        }
      })
      .catch((err: Error) => {
        setErrore(err.message === "Failed to fetch" 
          ? "Errore CORS o di connessione. Se persiste, usa l'estensione del browser 'Allow CORS'." 
          : err.message
        );
      })
      .finally(() => {
        setCaricamento(false);
      });
  }, []);

  const formattaOrario = (isoString: string | null): string => {
    if (!isoString) return "";
    const data = new Date(isoString);
    return data.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  };

  const calcolaRitardoMinuti = (orarioPianificato: string | null, orarioPrevisto: string | null): number => {
    if (!orarioPianificato || !orarioPrevisto) return 0;
    const pianificato = new Date(orarioPianificato).getTime();
    const previsto = new Date(orarioPrevisto).getTime();
    return Math.max(0, Math.round((previsto - pianificato) / 60000));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || fermate.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const xLineaVerde = 110;        
    const yIniziale = 40;          
    const spaziaturaVerticale = 80; 
    const altezzaTotale = (fermate.length - 1) * spaziaturaVerticale;

    ctx.beginPath();
    ctx.strokeStyle = "#006666";   
    ctx.lineWidth = 10;            
    ctx.lineCap = "round";         
    ctx.moveTo(xLineaVerde, yIniziale);
    ctx.lineTo(xLineaVerde, yIniziale + altezzaTotale);
    ctx.stroke();

    fermate.forEach((fermata, i) => {
      const yCorrente = yIniziale + i * spaziaturaVerticale;
      ctx.textBaseline = "middle"; 

      const ritardoPartenza = calcolaRitardoMinuti(fermata.departure, fermata.prognosis?.departure);
      const ritardoArrivo = calcolaRitardoMinuti(fermata.arrival, fermata.prognosis?.arrival);
      const haRitardo = ritardoPartenza > 0 || ritardoArrivo > 0;
      const oraArr = formattaOrario(fermata.arrival);
      const oraPar = formattaOrario(fermata.departure);

      ctx.fillStyle = "#000000";
      if (i === 0) {
        ctx.font = "bold 15px sans-serif";
        ctx.fillText(oraPar, xLineaVerde - 75, yCorrente);
        if (ritardoPartenza > 0) {
          ctx.font = "bold 12px sans-serif";
          ctx.fillStyle = "#dc2626"; 
          ctx.fillText(`+${ritardoPartenza}'`, xLineaVerde - 35, yCorrente);
        }
      } else if (i === fermate.length - 1) {
        ctx.font = "bold 15px sans-serif";
        ctx.fillText(oraArr, xLineaVerde - 75, yCorrente);
        if (ritardoArrivo > 0) {
          ctx.font = "bold 12px sans-serif";
          ctx.fillStyle = "#dc2626";
          ctx.fillText(`+${ritardoArrivo}'`, xLineaVerde - 35, yCorrente);
        }
      } else {
        ctx.font = "14px sans-serif";
        ctx.fillText(oraArr, xLineaVerde - 75, yCorrente - 12);
        ctx.fillText(oraPar, xLineaVerde - 75, yCorrente + 12);
        if (ritardoPartenza > 0 || ritardoArrivo > 0) {
          ctx.font = "bold 11px sans-serif";
          ctx.fillStyle = "#dc2626";
          ctx.fillText(`+${Math.max(ritardoPartenza, ritardoArrivo)}'`, xLineaVerde - 35, yCorrente);
        }
      }

      ctx.beginPath();
      ctx.arc(xLineaVerde, yCorrente, 7, 0, 2 * Math.PI);
      ctx.fillStyle = "#ffffff";    
      ctx.fill();
      ctx.lineWidth = 3.5;          
      ctx.strokeStyle = haRitardo ? "#dc2626" : "#006666";
      ctx.stroke();

      const isEstremo = i === 0 || i === fermate.length - 1;
      ctx.font = isEstremo ? "bold 16px sans-serif" : "15px sans-serif";
      ctx.fillStyle = haRitardo ? "#991b1b" : "#000000";
      ctx.fillText(fermata.station.name, xLineaVerde + 25, yCorrente);
    });
  }, [fermate]); 

  return (
    <section className="min-h-screen px-8 py-16 bg-gray-50">
      <h1 className="text-4xl font-bold mb-4">Sezione Treni</h1>
      <p className="text-gray-600 mb-8">
        Passa il mouse su "Treni" nel menu in alto per vedere le voci disponibili.
      </p>

      <div className="mt-8 max-w-xl bg-white p-6 rounded-xl border border-gray-100 shadow-md">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">
          Percorso Ultimo Treno Partito: <span className="text-emerald-700">Milano ➔ Berna</span>
        </h2>

        {caricamento && (
          <div className="space-y-6 animate-pulse p-4">
            <div className="flex items-center space-x-4">
              <div className="h-4 w-12 bg-gray-200 rounded"></div>
              <div className="h-6 w-6 bg-emerald-100 rounded-full"></div>
              <div className="h-5 w-40 bg-gray-200 rounded"></div>
            </div>
            <div className="w-1 border-l-4 border-gray-200 h-10 ml-[59px]"></div>
            <div className="flex items-center space-x-4">
              <div className="h-4 w-12 bg-gray-200 rounded"></div>
              <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
              <div className="h-5 w-32 bg-gray-200 rounded"></div>
            </div>
            <div className="w-1 border-l-4 border-gray-200 h-10 ml-[59px]"></div>
            <div className="flex items-center space-x-4">
              <div className="h-4 w-12 bg-gray-200 rounded"></div>
              <div className="h-6 w-6 bg-emerald-100 rounded-full"></div>
              <div className="h-5 w-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        )}

        {errore && (
          <div className="text-red-600 font-medium bg-red-50 p-4 rounded-lg border border-red-200 text-sm">
            <strong>Impossibile caricare il percorso:</strong> {errore}
          </div>
        )}

        {!caricamento && fermate.length > 0 && (
          <div className="overflow-x-auto flex justify-center bg-white rounded-lg p-2">
            <canvas
              ref={canvasRef}
              width={420}
              height={fermate.length * 80 + 30}
              className="block"
            />
          </div>
        )}
      </div>
    </section>
  );
}
