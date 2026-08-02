// api/clienti-delete.ts
// Elimina un cliente dalla tabella Clienti, dato il suo id.

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Metodo non permesso' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: "Variabili d'ambiente mancanti" });
    }

    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'id mancante' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase.from('Clienti').delete().eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: `Errore imprevisto: ${err.message}` });
  }
}