// api/clienti-create.ts
// Crea un nuovo cliente vuoto (o con valori di default) su Supabase.
// L'id viene generato automaticamente dal database (identity column).

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

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Inseriamo una riga vuota: id, client_id e created_at vengono
    // generati automaticamente dal database (default/identity)
    const { data, error } = await supabase
      .from('Clienti')
      .insert({})
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: `Errore imprevisto: ${err.message}` });
  }
}