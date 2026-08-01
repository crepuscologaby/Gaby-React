// api/clienti-update.ts
// Riceve una riga modificata dal frontend e la aggiorna su Supabase

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non permesso' });
  }

  // Il frontend ci manda: { id: 5, colonna: 'nome', valore: 'Mario' }
  const { id, colonna, valore } = req.body;

  if (!id || !colonna) {
    return res.status(400).json({ error: 'Dati mancanti (id o colonna)' });
  }

  // Aggiorna la singola colonna della riga con quell'id
  const { error } = await supabase
    .from('Clienti')
    .update({ [colonna]: valore }) // aggiorna dinamicamente la colonna giusta
    .eq('id', id); // solo la riga con questo id

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}