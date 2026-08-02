// api/_lib/supabaseAdmin.ts
// Client Supabase "lato server", usato dalle funzioni in /api.
// Riusa le stesse variabili d'ambiente che usavi già in api/chiedi-ai.ts.

import { createClient } from "@supabase/supabase-js";

export const supabaseServer = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.VITE_SUPABASE_ANON_KEY as string
);
