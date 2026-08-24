import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/paypal';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { invalidateLeaderboardCache } from '@/lib/leaderboard';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const headers = Object.fromEntries(request.headers.entries());

    // 1. Verify webhook signature (if webhook ID is configured)
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (webhookId) {
      const isValid = await verifyWebhookSignature({
        webhookId,
        headers,
        body: rawBody,
      });

      if (!isValid) {
        console.error('PayPal webhook signature verification failed');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);

    // 2. Only process PAYMENT.CAPTURE.COMPLETED events
    if (event.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
      return NextResponse.json({ received: true, skipped: true });
    }

    const capture = event.resource;
    const customId = capture?.custom_id;
    // The PayPal order ID from supplementary_data
    const orderId =
      capture?.supplementary_data?.related_ids?.order_id || null;

    if (!orderId && !customId) {
      return NextResponse.json({ received: true, skipped: true });
    }

    const supabase = getSupabaseServerClient();

    // 3. Look up the bid record by order ID
    const { data: bidRecord } = await supabase
      .from('bids')
      .select('*')
      .eq('polar_checkout_id', orderId)
      .maybeSingle();

    if (!bidRecord) {
      console.error('PayPal webhook: no bid found for order', orderId);
      return NextResponse.json({ received: true, skipped: true });
    }

    // Already processed?
    if (bidRecord.status === 'paid') {
      return NextResponse.json({ received: true, already_processed: true });
    }

    // 4. Parse metadata
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
      metadata = JSON.parse(bidRecord.metadata || '{}');
    } catch {
      metadata = {
        type: 'leaderboard',
        url: bidRecord.entry_url,
        name: bidRecord.entry_name,
        amount_cents: bidRecord.amount_cents,
      };
    }

    // 5. Mark bid as paid
    await supabase
      .from('bids')
      .update({ status: 'paid' })
      .eq('polar_checkout_id', orderId);

    // 6. Handle Sponsor Slot activation
    if (metadata.type === 'sponsor' && metadata.url && metadata.slot_number) {
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
    }

    // 7. Handle Leaderboard entry activation
    if (metadata.type !== 'sponsor' && metadata.url && metadata.amount_cents) {
      const amountCents = Number(metadata.amount_cents);

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
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('PayPal webhook processing error:', err);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}
