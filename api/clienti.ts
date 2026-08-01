// api/clienti.ts
// Legge i dati dalla tabella "Clienti" di Supabase.

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Metodo non permesso' });
    }

    // Leggiamo le variabili d'ambiente qui dentro (non fuori dalla funzione)
    // così, se mancano, l'errore viene catturato dal nostro try/catch
    // invece di far crashare l'intera funzione prima di partire.
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        error: `Variabili d'ambiente mancanti: SUPABASE_URL=${!!supabaseUrl}, SUPABASE_SERVICE_KEY=${!!supabaseKey}`,
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.from('Clienti').select('*');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (err: any) {
    // Cattura QUALSIASI errore imprevisto e lo restituisce come JSON
    // leggibile, invece di far crashare la funzione senza spiegazioni
    return res.status(500).json({ error: `Errore imprevisto: ${err.message}` });
  }
}