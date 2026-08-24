import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export interface SponsorSlot {
  slot_number: number;
  url: string | null;
  name: string | null;
  description: string | null;
  logo_url: string | null;
  claimed_at: string | null;
  expires_at: string | null;
  days_left: number | null;
  is_active: boolean;
  price: number;
  duration_days: number;
}

// In-memory fallback for local/free mode claims
export const localSponsorSlots: Map<number, {
  url: string;
  name: string;
  description: string;
  logo_url: string;
  claimed_at: string;
  expires_at: string;
}> = new Map();

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const slots: SponsorSlot[] = Array.from({ length: 10 }, (_, i) => ({
    slot_number: i + 1,
    url: null,
    name: null,
    description: null,
    logo_url: null,
    claimed_at: null,
    expires_at: null,
    days_left: null,
    is_active: false,
    price: 49,
    duration_days: 30,
  }));

  const now = Date.now();

  // 1. Check local fallback map
  for (const [slotNum, data] of localSponsorSlots.entries()) {
    const slotIdx = slotNum - 1;
    if (slotIdx >= 0 && slotIdx < 10) {
      const expiresAt = new Date(data.expires_at).getTime();
      if (expiresAt > now) {
        slots[slotIdx] = {
          slot_number: slotNum,
          url: data.url,
          name: data.name,
          description: data.description,
          logo_url: data.logo_url,
          claimed_at: data.claimed_at,
          expires_at: data.expires_at,
          days_left: Math.max(1, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))),
          is_active: true,
          price: 49,
          duration_days: 30,
        };
      }
    }
  }

  // 2. Query Supabase
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('sponsor_slots')
      .select('*')
      .order('slot_number', { ascending: true });

    if (!error && Array.isArray(data)) {
      for (const item of data) {
        const slotIdx = item.slot_number - 1;
        if (slotIdx >= 0 && slotIdx < 10) {
          const expiresAt = item.expires_at ? new Date(item.expires_at).getTime() : 0;
          const isActive = Boolean(item.url && expiresAt > now);

          if (isActive) {
            const daysLeft = Math.max(1, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)));
            slots[slotIdx] = {
              slot_number: item.slot_number,
              url: item.url,
              name: item.name,
              description: item.description,
              logo_url: item.logo_url,
              claimed_at: item.claimed_at,
              expires_at: item.expires_at,
              days_left: daysLeft,
              is_active: true,
              price: 49,
              duration_days: 30,
            };
          }
        }
      }
    }
  } catch (err) {
    // Database table not created yet; fallback slots already loaded
  }

  return NextResponse.json(
    { slots },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
}
