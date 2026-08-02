// DbPage.tsx
// Pagina che mostra ed edita in tempo reale i dati della tabella "Clienti"
// (PostgreSQL su Supabase) usando Handsontable, con paginazione nativa.
//
// NOTA LICENZA: Handsontable è gratuito solo per uso personale/non
// commerciale (chiave 'non-commercial-and-evaluation' qui sotto). Se in
// futuro questo progetto diventa commerciale, serve una licenza a pagamento
// da handsontable.com/pricing.

import { useEffect, useRef, useState } from 'react';
import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css'; // stili strutturali di base
import 'handsontable/styles/ht-theme-main.css'; // tema grafico (colori, font, ecc.)

// Converte una data ISO in un formato leggibile "YYYY-MM-DD HH:mm"
function formatDataLeggibile(isoString: string | null): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Da "YYYY-MM-DD HH:mm" a formato ISO, per salvare su Supabase
function formatDataPerSalvataggio(dataLeggibile: string): string | null {
  if (!dataLeggibile) return null;
  const d = new Date(dataLeggibile.replace(' ', 'T'));
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

// Colonne che non devono mai essere modificate dall'utente
const colonneSolaLettura = ['id', 'client_id', 'created_at'];

export default function DbPage() {
  const gridRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<Handsontable | null>(null);
  const columnNamesRef = useRef<string[]>([]);

  // Tutti i clienti caricati, nello stesso ordine mostrato nella griglia.
  const tuttiIClientiRef = useRef<Record<string, any>[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function costruisciColonne() {
    return columnNamesRef.current.map((key) => {
      if (key === 'enable') {
        return { type: 'checkbox' as const };
      }
      return {
        type: 'text' as const,
        readOnly: colonneSolaLettura.includes(key),
      };
    });
  }

  function costruisciTutteLeRighe() {
    return tuttiIClientiRef.current.map((cliente) =>
      columnNamesRef.current.map((key) => {
        if (key === 'created_at' || key === 'data_privacy') {
          return formatDataLeggibile(cliente[key]);
        }
        return cliente[key];
      })
    );
  }

  // Carica (o ricarica) tutti i dati da Supabase e (ri)crea la griglia.
  // Richiamabile sia al primo caricamento che dal pulsante di refresh.
  async function loadData() {
    try {
      const response = await fetch('/api/clienti');

      if (!response.ok) {
        const testoGrezzo = await response.text();
        let dettaglio = testoGrezzo;
        try {
          dettaglio = JSON.parse(testoGrezzo).error || testoGrezzo;
        } catch {
          // dettaglio resta il testo grezzo
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

      setError(null);
      columnNamesRef.current = Object.keys(clienti[0]);
      tuttiIClientiRef.current = clienti;

      if (gridRef.current) {
        instanceRef.current = new Handsontable(gridRef.current, {
          licenseKey: 'non-commercial-and-evaluation',
          themeName: 'ht-theme-main',

          data: costruisciTutteLeRighe(),
          colHeaders: columnNamesRef.current,
          columns: costruisciColonne(),

          fixedColumnsStart: 3,
          filters: true,
          dropdownMenu: true,
          wordWrap: false,
          manualColumnResize: true,
          columnSorting: true,
          outsideClickDeselects: false,
          width: '100%',
          height: 'auto',
          stretchH: 'all',
          rowHeaders: true,
          className: 'righe-alternate',

          // Paginazione nativa: 15 righe per pagina
          pagination: {
            pageSize: 15,
            showPageSize: false,
            showCounter: true,
            showNavigation: true,
          },

          afterChange: async (changes, source) => {
            if (source === 'loadData' || !changes) return;
            const istanza = instanceRef.current;
            if (!istanza) return;

            for (const change of changes as unknown[][]) {
              const rigaVisibile = change[0] as number;
              const indiceColonna = Number(change[1]);
              const vecchioValore = change[2];
              const nuovoValore = change[3];

              if (vecchioValore === nuovoValore) continue;

              // L'indice di colonna arriva come numero (0, 1, 2...), non
              // come nome: lo traduciamo usando l'ordine con cui abbiamo
              // caricato le colonne da Supabase
              const columnName = columnNamesRef.current[indiceColonna];
              if (!columnName || colonneSolaLettura.includes(columnName)) continue;

              // Con paginazione/filtri/ordinamento attivi, l'indice di riga
              // "visibile" non coincide sempre con l'indice reale
              // nell'array dati: convertiamo sempre con toPhysicalRow
              const indiceReale = istanza.toPhysicalRow(Number(rigaVisibile));
              const cliente = tuttiIClientiRef.current[indiceReale];
              if (!cliente) continue;

              let valoreDaSalvare: any = nuovoValore;
              if (columnName === 'data_privacy') {
                valoreDaSalvare = formatDataPerSalvataggio(String(nuovoValore ?? ''));
              }
              cliente[columnName] = valoreDaSalvare;

              setSaving(true);
              try {
                const res = await fetch('/api/clienti-update', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: cliente.id,
                    colonna: columnName,
                    valore: valoreDaSalvare,
                  }),
                });
                if (!res.ok) setError('Errore nel salvataggio di una modifica');
              } catch {
                setError('Errore di rete durante il salvataggio');
              } finally {
                setSaving(false);
              }
            }
          },
        });
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadData();

    return () => {
      if (instanceRef.current) {
        instanceRef.current.destroy();
        instanceRef.current = null;
      }
    };
  }, []);

  // Ricarica tutto da zero (usata dal pulsante di refresh)
  function aggiornaDati() {
    if (instanceRef.current) {
      instanceRef.current.destroy();
      instanceRef.current = null;
    }
    loadData();
  }

  // Crea un nuovo cliente vuoto e aggiorna la griglia
  async function creaNuovoCliente() {
    setSaving(true);
    try {
      const res = await fetch('/api/clienti-create', { method: 'POST' });
      if (!res.ok) {
        setError('Errore nella creazione del nuovo cliente');
        return;
      }
      const nuovoCliente = await res.json();
      tuttiIClientiRef.current.push(nuovoCliente);

      if (instanceRef.current) {
        instanceRef.current.loadData(costruisciTutteLeRighe());
        const pagination = instanceRef.current.getPlugin('pagination');
        pagination.lastPage();
      }
    } catch {
      setError('Errore di rete durante la creazione');
    } finally {
      setSaving(false);
    }
  }

  // Elimina il cliente della riga attualmente selezionata
  async function eliminaClienteSelezionato() {
    const istanza = instanceRef.current;
    if (!istanza) return;

    const selezione = istanza.getSelectedLast();
    if (!selezione) {
      setError('Seleziona prima una riga da eliminare');
      return;
    }

    const indiceReale = istanza.toPhysicalRow(selezione[0]);
    const cliente = tuttiIClientiRef.current[indiceReale];
    if (!cliente) return;

    const conferma = window.confirm(
      `Eliminare il cliente "${cliente.cognome || ''} ${cliente.nome || ''}" (id ${cliente.id})?`
    );
    if (!conferma) return;

    setSaving(true);
    try {
      const res = await fetch('/api/clienti-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cliente.id }),
      });
      if (!res.ok) {
        setError("Errore nell'eliminazione del cliente");
        return;
      }

      tuttiIClientiRef.current.splice(indiceReale, 1);
      istanza.loadData(costruisciTutteLeRighe());
    } catch {
      setError("Errore di rete durante l'eliminazione");
    } finally {
      setSaving(false);
    }
  }

  // Esporta TUTTI i clienti in formato CSV, apribile direttamente con Excel
  function esportaCSV() {
    const intestazioni = columnNamesRef.current.join(';');

    const righe = tuttiIClientiRef.current.map((cliente) =>
      columnNamesRef.current
        .map((key) => {
          let valore = cliente[key];
          if (key === 'created_at' || key === 'data_privacy') {
            valore = formatDataLeggibile(valore);
          }
          const testo = valore === null || valore === undefined ? '' : String(valore);
          if (/[;"\n]/.test(testo)) {
            return `"${testo.replace(/"/g, '""')}"`;
          }
          return testo;
        })
        .join(';')
    );

    const contenutoCSV = [intestazioni, ...righe].join('\n');
    const blob = new Blob(['\uFEFF' + contenutoCSV], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'clienti.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="px-4 pt-2 flex flex-col items-center text-center">
      {/* Barra pulsanti: solo icone, con tooltip al passaggio del mouse */}
      <div className="flex items-center gap-2 mb-2 w-full max-w-[95vw] justify-start">
        <button
          onClick={creaNuovoCliente}
          title="Nuovo cliente"
          className="flex items-center justify-center w-8 h-8 rounded border border-gray-300 text-green-600 hover:bg-green-50"
        >
          <i className="fa-solid fa-plus"></i>
        </button>
        <button
          onClick={eliminaClienteSelezionato}
          title="Elimina cliente selezionato"
          className="flex items-center justify-center w-8 h-8 rounded border border-gray-300 text-red-600 hover:bg-red-50"
        >
          <i className="fa-solid fa-trash"></i>
        </button>
        <button
          onClick={esportaCSV}
          title="Esporta in CSV/Excel"
          className="flex items-center justify-center w-8 h-8 rounded border border-gray-300 text-blue-600 hover:bg-blue-50"
        >
          <i className="fa-solid fa-file-export"></i>
        </button>
        <button
          onClick={aggiornaDati}
          title="Aggiorna dati"
          className="flex items-center justify-center w-8 h-8 rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
        >
          <i className="fa-solid fa-rotate-right"></i>
        </button>
      </div>

      {saving && <p className="text-blue-600 mb-2 text-sm">Salvataggio in corso...</p>}
      {error && <p className="text-red-600 mb-2 text-sm">{error}</p>}

      <div
        className="w-full max-w-[95vw] border border-gray-300 rounded mb-4"
        style={{ overflowX: 'auto' }}
      >
        <div ref={gridRef}></div>
      </div>

      <style>{`
        .righe-alternate tbody tr:nth-child(even) td {
          background-color: #eaf3fb;
        }
        .righe-alternate tbody tr:nth-child(odd) td {
          background-color: #ffffff;
        }
      `}</style>
    </section>
  );
}