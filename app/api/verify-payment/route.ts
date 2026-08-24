import { NextRequest, NextResponse } from 'next/server';
import { captureOrder } from '@/lib/paypal';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { invalidateLeaderboardCache } from '@/lib/leaderboard';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const orderId = body?.order_id;

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'order_id is required' }, { status: 400 });
    }

    // 1. Capture the PayPal order (moves money)
    const capture = await captureOrder(orderId);

    if (capture.status !== 'COMPLETED') {
      return NextResponse.json({ success: false, status: capture.status });
    }

    const supabase = getSupabaseServerClient();

    // 2. Look up the bid record by PayPal order ID to get full metadata (if stored)
    let metadata: {
      type?: string;
      slot_number?: number;
      url?: string;
      name?: string;
      description?: string;
      logo_url?: string;
      amount_cents?: number;
    } = {};

    try {
      const { data: bidRecord } = await supabase
        .from('bids')
        .select('*')
        .eq('polar_checkout_id', orderId)
        .maybeSingle();

      if (bidRecord?.metadata) {
        metadata = JSON.parse(bidRecord.metadata);
      } else if (bidRecord) {
        metadata = {
          type: 'leaderboard',
          url: bidRecord.entry_url,
          name: bidRecord.entry_name,
          amount_cents: bidRecord.amount_cents,
        };
      }
    } catch {
      // Supabase query failed; will fall back to PayPal custom_id below
    }

    // 3. Fallback: Parse metadata directly from PayPal custom_id if database had no record
    if (!metadata.url && capture.customId) {
      try {
        const parsed = JSON.parse(capture.customId);
        metadata = {
          type: parsed.t === 'sponsor' ? 'sponsor' : 'leaderboard',
          slot_number: parsed.s ? Number(parsed.s) : undefined,
          url: parsed.u,
          name: parsed.n,
          amount_cents: parsed.a ? Number(parsed.a) : (parsed.t === 'sponsor' ? 4900 : 100),
        };
      } catch (parseErr) {
        console.warn('Failed to parse PayPal custom_id:', parseErr);
      }
    }

    // 4. Mark bid as paid in Supabase (if table exists)
    try {
      await supabase
        .from('bids')
        .update({ status: 'paid' })
        .eq('polar_checkout_id', orderId);
    } catch {}

    // 5. Handle Sponsor Slot activation
    if (metadata.type === 'sponsor' && metadata.url && metadata.slot_number) {
      const slotNumber = Number(metadata.slot_number);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      let hostname = 'website.com';
      try {
        hostname = new URL(metadata.url).hostname;
      } catch {}

      try {
        await supabase.from('sponsor_slots').upsert(
          {
            slot_number: slotNumber,
            url: metadata.url,
            name: metadata.name || hostname,
            description: metadata.description || '',
            logo_url: metadata.logo_url || `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`,
            claimed_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
          },
          { onConflict: 'slot_number' }
        );
      } catch (sponsorErr) {
        console.error('Supabase sponsor_slots upsert error:', sponsorErr);
      }

      return NextResponse.json({
        success: true,
        type: 'sponsor',
        slotNumber,
        url: metadata.url,
      });
    }

    // 6. Handle Leaderboard entry activation
    if (metadata.url) {
      const amountCents = Number(metadata.amount_cents) || 100;
      let hostname = 'website.com';
      try {
        hostname = new URL(metadata.url).hostname;
      } catch {}

      try {
        await supabase.from('leaderboard_entries').upsert(
          {
            url: metadata.url,
            name: metadata.name || hostname,
            bid_cents: amountCents,
            claimed_at: new Date().toISOString(),
          },
          { onConflict: 'url' }
        );
        await invalidateLeaderboardCache();
      } catch (entryErr) {
        console.error('Supabase leaderboard_entries upsert error:', entryErr);
      }

      return NextResponse.json({
        success: true,
        type: 'leaderboard',
        url: metadata.url,
        amountCents,
      });
    }

    return NextResponse.json({ success: true, message: 'Payment captured' });
  } catch (err: any) {
    console.error('Verify payment error:', err);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
