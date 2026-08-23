import { NextRequest, NextResponse } from 'next/server';
import { dodo } from '@/lib/dodo';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const type: string = body?.type || 'leaderboard';
  const url: string | undefined = body?.url;
  const name: string | undefined = body?.name;

  if (!url) {
    return NextResponse.json({ error: 'A URL is required' }, { status: 400 });
  }

  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  const productId = process.env.DODO_PAYMENTS_PRODUCT_ID;
  if (!productId) {
    return NextResponse.json(
      { error: 'Dodo Payments product is not configured' },
      { status: 500 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://everybid.lol';
  const supabase = getSupabaseServerClient();

  // 1. Handle Sponsor Slot checkout ($49 / 30 days)
  if (type === 'sponsor') {
    const slotNumber = Number(body?.slot_number);
    if (!slotNumber || slotNumber < 1 || slotNumber > 10) {
      return NextResponse.json({ error: 'Invalid slot number (must be 1-10)' }, { status: 400 });
    }

    const description: string = body?.description || '';
    const logoUrl: string = body?.logo_url || `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
    const entryName = name || hostname;
    const sponsorAmountCents = 4900; // $49.00

    try {
      const session = await dodo.checkoutSessions.create({
        product_cart: [
          {
            product_id: productId,
            quantity: 1,
            amount: sponsorAmountCents,
          },
        ],
        return_url: `${siteUrl}/?sponsor_claimed=1&slot=${slotNumber}`,
        metadata: {
          type: 'sponsor',
          slot_number: String(slotNumber),
          url,
          name: entryName,
          description: description.slice(0, 300),
          logo_url: logoUrl,
          amount_cents: String(sponsorAmountCents),
        },
      });

      return NextResponse.json({ checkoutUrl: session.checkout_url });
    } catch (err: any) {
      console.error('Dodo Payments sponsor checkout error:', err);
      return NextResponse.json(
        { error: 'Failed to create checkout session', details: err?.message || String(err) },
        { status: 500 }
      );
    }
  }

  // 2. Handle Leaderboard Bid checkout
  const bid: number | undefined = body?.bid;
  if (!bid || bid < 1) {
    return NextResponse.json(
      { error: 'A bid of at least $1 is required' },
      { status: 400 }
    );
  }

  const amountCents = Math.round(bid * 100);

  const { data: existing } = await supabase
    .from('leaderboard_entries')
    .select('bid_cents')
    .eq('url', url)
    .maybeSingle();

  if (existing && existing.bid_cents >= amountCents) {
    return NextResponse.json(
      {
        error: `Your new bid ($${bid}) must be higher than your current bid ($${existing.bid_cents / 100})`,
      },
      { status: 400 }
    );
  }

  // Calculate charge amount (only pay the difference if already listed)
  const chargeAmountCents = existing ? amountCents - existing.bid_cents : amountCents;
  const entryName = name || hostname;

  try {
    const session = await dodo.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
          amount: chargeAmountCents,
        },
      ],
      return_url: `${siteUrl}/?claimed=1`,
      metadata: {
        type: 'leaderboard',
        url,
        name: entryName,
        amount_cents: String(amountCents),
        charge_amount_cents: String(chargeAmountCents),
        description: `Everybid listing: ${entryName}`,
      },
    });

    const { error } = await supabase.from('bids').insert({
      entry_url: url,
      entry_name: entryName,
      amount_cents: chargeAmountCents,
      polar_checkout_id: session.session_id,
      status: 'pending',
    });

    if (error) {
      console.error('Supabase bid insert error:', error);
      return NextResponse.json(
        { error: 'Failed to record bid', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ checkoutUrl: session.checkout_url });
  } catch (err: any) {
    console.error('Dodo Payments checkout creation error:', err);
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
