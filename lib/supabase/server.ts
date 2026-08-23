import { createClient } from '@supabase/supabase-js';

// Service-role client for server-only code (route handlers, webhooks).
// Never import this from a Client Component — the key must not reach the browser.
export function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
