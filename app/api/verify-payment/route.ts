import { NextRequest, NextResponse } from 'next/server';
import { dodo } from '@/lib/dodo';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { invalidateLeaderboardCache } from '@/lib/leaderboard';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const paymentId = body?.payment_id;

    if (!paymentId) {
      return NextResponse.json({ error: 'payment_id is required' }, { status: 400 });
    }

    const payment = await dodo.payments.retrieve(paymentId);
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.status === 'succeeded') {
      const metadata = payment.metadata as {
        type?: string;
        slot_number?: string;
        url?: string;
        name?: string;
        description?: string;
        logo_url?: string;
        amount_cents?: string;
      } | undefined;

      const supabase = getSupabaseServerClient();

      // 1. Handle Sponsor Slot activation ($49 / 30 days)
      if (metadata?.type === 'sponsor' && metadata.url && metadata.slot_number) {
        const slotNumber = Number(metadata.slot_number);
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        let hostname = 'website.com';
        try {
          hostname = new URL(metadata.url).hostname;
        } catch {}

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

        return NextResponse.json({
          success: true,
          type: 'sponsor',
          slotNumber,
          url: metadata.url,
        });
      }

      // 2. Handle Leaderboard entry activation
      if (metadata?.url && metadata?.amount_cents) {
        const amountCents = Number(metadata.amount_cents);

        // Update bid status
        await supabase
          .from('bids')
          .update({ status: 'paid' })
          .or(`polar_checkout_id.eq.${payment.payment_id},entry_url.eq.${metadata.url}`);

        // Upsert into leaderboard
        await supabase.from('leaderboard_entries').upsert(
          {
            url: metadata.url,
            name: metadata.name ?? new URL(metadata.url).hostname,
            bid_cents: amountCents,
            claimed_at: new Date().toISOString(),
          },
          { onConflict: 'url' }
        );

        await invalidateLeaderboardCache();
        return NextResponse.json({ success: true, type: 'leaderboard', url: metadata.url, amountCents });
      }
    }

    return NextResponse.json({ success: false, status: payment.status });
  } catch (err: any) {
    console.error('Verify payment error:', err);
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
