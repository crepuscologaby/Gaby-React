// DbPage.tsx
// Pagina che mostra ed edita in tempo reale i dati della tabella "Clienti"
// (PostgreSQL su Supabase) usando Jspreadsheet CE.

import { useEffect, useRef, useState } from 'react';
import jspreadsheet from 'jspreadsheet-ce';
import 'jspreadsheet-ce/dist/jspreadsheet.css'; // stile grafico dello spreadsheet
import 'jsuites/dist/jsuites.css'; // dipendenza grafica richiesta da jspreadsheet

// Converte una data ISO (es. "2026-08-01T10:23:00+00:00") in un formato
// leggibile "YYYY-MM-DD HH:mm" da mostrare nello spreadsheet.
function formatDataLeggibile(isoString: string | null): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Fa l'operazione inversa: da "YYYY-MM-DD HH:mm" (testo inserito dall'utente
// nello spreadsheet) a formato ISO, da salvare su Supabase.
function formatDataPerSalvataggio(dataLeggibile: string): string | null {
  if (!dataLeggibile) return null;
  const d = new Date(dataLeggibile.replace(' ', 'T'));
  if (isNaN(d.getTime())) return null; // data non valida
  return d.toISOString();
}

export default function DbPage() {
  // Riferimento al div HTML dove Jspreadsheet verrà "montato"
  const spreadsheetRef = useRef<HTMLDivElement>(null);

  // Riferimento all'istanza dello spreadsheet (serve per distruggerla al cleanup)
  const instanceRef = useRef<any>(null);

  // Nomi delle colonne, nell'ordine in cui arrivano da Supabase.
  // Ci serve per sapere, quando una cella viene modificata, a quale
  // colonna del database corrisponde.
  const columnNamesRef = useRef<string[]>([]);

  // Id di ogni riga (colonna "id" della tabella Clienti), nello stesso
  // ordine in cui le righe vengono mostrate nello spreadsheet.
  const rowIdsRef = useRef<any[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Colonne che non devono mai essere modificate dall'utente
    // (chiavi generate automaticamente o gestite dal sistema)
    const colonneSolaLettura = ['id', 'client_id', 'created_at'];

    async function loadData() {
      try {
        const response = await fetch('/api/clienti');
        if (!response.ok) {
          // Leggiamo SEMPRE come testo grezzo prima (una Response si può
          // leggere una sola volta), poi proviamo a interpretarlo come JSON
          const testoGrezzo = await response.text();

          let dettaglio = testoGrezzo;
          try {
            const bodyErrore = JSON.parse(testoGrezzo);
            dettaglio = bodyErrore.error || testoGrezzo;
          } catch {
            // Non era JSON valido: usiamo il testo grezzo così com'è
            // (dettaglio è già stato impostato sopra)
          }

          throw new Error(
            `Errore nel caricamento dei dati (status ${response.status}): ${dettaglio}`
          );
        }

        const clienti = await response.json();
        if (!clienti || clienti.length === 0) {
          setError('Nessun dato trovato nella tabella Clienti');
          return;
        }

        // Salviamo i nomi delle colonne (es. ['id', 'nome', 'cognome', ...])
        columnNamesRef.current = Object.keys(clienti[0]);

        // Salviamo gli id di ogni riga, nello stesso ordine dei dati
        rowIdsRef.current = clienti.map((c: Record<string, any>) => c.id);

        // Definiamo il tipo di colonna giusto per ogni campo della tabella
        const columns = columnNamesRef.current.map((key) => {
          // Colonna "enable": è un booleano, mostrata come checkbox
          if (key === 'enable') {
            return {
              type: 'checkbox' as const,
              title: key,
              width: 100,
            };
          }

          // Colonna "data_privacy": data/ora, editabile con calendario
          if (key === 'data_privacy') {
            return {
              type: 'calendar' as const,
              title: key,
              width: 180,
              options: { format: 'YYYY-MM-DD HH:mm' },
            };
          }

          // Tutte le altre colonne: testo semplice
          return {
            type: 'text' as const,
            title: key,
            width: 150,
            readOnly: colonneSolaLettura.includes(key),
          };
        });

        // Costruiamo le righe convertendo le date in formato leggibile
        const rows = clienti.map((cliente: Record<string, any>) =>
          columnNamesRef.current.map((key) => {
            if (key === 'created_at' || key === 'data_privacy') {
              return formatDataLeggibile(cliente[key]);
            }
            return cliente[key];
          })
        );

        // Se esiste già un'istanza di spreadsheet, la distruggiamo
        // prima di crearne una nuova (evita duplicati al re-render)
        if (instanceRef.current) {
          instanceRef.current.destroy();
        }

        if (spreadsheetRef.current) {
          instanceRef.current = jspreadsheet(spreadsheetRef.current, {
            tableOverflow: false,

            // Nella versione attuale di jspreadsheet-ce, i dati e le colonne
            // vanno dichiarati dentro l'array "worksheets". Noi ne usiamo uno solo.
            worksheets: [
              {
                data: rows,
                columns: columns,

                // Blocca le prime 3 colonne (id, client_id, created_at)
                // così restano visibili anche scorrendo verso destra
                freezeColumns: 3,
              },
            ],

            // Attiva la riga dei filtri sopra le intestazioni di colonna
            filters: true,

            // A questo livello (fuori da worksheets) jspreadsheet-ce chiama
            // questa funzione ogni volta che l'utente modifica una o più
            // celle e conferma (es. con Invio o cliccando fuori dalla cella).
            onafterchanges: async (...args: any[]) => {
              // DEBUG: stampiamo tutti gli argomenti ricevuti per capire
              // esattamente la firma usata da questa versione della libreria.
              // (rimuoveremo questo log una volta confermato il formato)
              console.log('DEBUG onafterchanges - argomenti ricevuti:', args);

              // Normalizziamo in un array di modifiche, qualunque sia la forma
              // in cui arrivano (array di oggetti, singolo oggetto, o
              // parametri separati x/y/value)
              let modifiche: { x: any; y: any; value: any }[] = [];

              const possibileTerzoParam = args[2];

              if (Array.isArray(possibileTerzoParam)) {
                // Caso 1: il terzo argomento è già un array di modifiche
                modifiche = possibileTerzoParam;
              } else if (
                possibileTerzoParam &&
                typeof possibileTerzoParam === 'object' &&
                'x' in possibileTerzoParam
              ) {
                // Caso 2: il terzo argomento è un singolo oggetto {x, y, value}
                modifiche = [possibileTerzoParam];
              } else if (args.length >= 5) {
                // Caso 3: i parametri arrivano separati, tipo
                // (instance, worksheetInstance, x, y, value, ...)
                modifiche = [{ x: args[2], y: args[3], value: args[4] }];
              }

              for (const record of modifiche) {
                const indiceRiga = Number(record.y);
                const indiceColonna = Number(record.x);

                const rowId = rowIdsRef.current[indiceRiga];
                const columnName = columnNamesRef.current[indiceColonna];

                if (!columnName || colonneSolaLettura.includes(columnName)) continue;

                let nuovoValore = record.value;

                if (columnName === 'data_privacy') {
                  nuovoValore = formatDataPerSalvataggio(nuovoValore);
                }

                setSaving(true);
                try {
                  const res = await fetch('/api/clienti-update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      id: rowId,
                      colonna: columnName,
                      valore: nuovoValore,
                    }),
                  });
                  if (!res.ok) {
                    setError('Errore nel salvataggio di una modifica');
                  }
                } catch {
                  setError('Errore di rete durante il salvataggio');
                } finally {
                  setSaving(false);
                }
              }
            },
          } as any); // "as any" bypassa i tipi TS non ancora perfettamente allineati alla libreria
        }
      } catch (err: any) {
        setError(err.message);
      }
    }

    loadData();

    // Cleanup: quando il componente viene smontato, distruggiamo lo spreadsheet
    return () => {
      if (instanceRef.current) {
        instanceRef.current.destroy();
      }
    };
  }, []); // [] = eseguito una sola volta al caricamento della pagina

  return (
    <section className="min-h-screen px-8 pt-20 flex flex-col items-center text-center">
      <h1 className="text-4xl font-bold mb-4">Sezione DB</h1>
      <p className="text-gray-600 mb-4">
        Dati della tabella Clienti (modificabili direttamente nella tabella).
      </p>

      {/* Messaggio di stato durante il salvataggio */}
      {saving && <p className="text-blue-600 mb-2">Salvataggio in corso...</p>}

      {/* Messaggio di errore, se presente */}
      {error && <p className="text-red-600 mb-2">{error}</p>}

      {/* Contenitore esterno con dimensioni fisse: qui appaiono le
        barre di scorrimento, invece che sull'intera pagina */}
      <div className="w-full max-w-[95vw] overflow-auto border border-gray-300 rounded">
        <div ref={spreadsheetRef}></div>
      </div>
    </section>
  );
}