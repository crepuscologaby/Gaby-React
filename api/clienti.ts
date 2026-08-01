// api/clienti.ts
// Questa funzione gira sul server (Vercel), NON nel browser.
// Serve per leggere i dati dalla tabella "Clienti" di Supabase
// senza esporre le chiavi segrete al frontend.

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Le chiavi vengono lette dalle variabili d'ambiente di Vercel
// (le imposti da Vercel Dashboard > Settings > Environment Variables)
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY as string; // service key = accesso lato server

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo richieste GET sono permesse per questo endpoint
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Metodo non permesso' });
  }

  // Interroga la tabella Clienti su Supabase
  const { data, error } = await supabase
    .from('Clienti')
    .select('*'); // '*' = prendi tutte le colonne

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Restituisce i dati in formato JSON al frontend
  return res.status(200).json(data);
}