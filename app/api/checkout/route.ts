import { NextRequest, NextResponse } from 'next/server';
import { dodo } from '@/lib/dodo';
import { getSupabaseServerClient } from '@/lib/supabase/server';

// ── URL Sanitization ───────────────────────────────────────────────
const BLOCKED_DOMAINS = new Set([
  't.me',
  'telegram.me',
  'telegram.org',
  'wa.me',
  'chat.whatsapp.com',
  'discord.gg',
  'discord.com',
  'discordapp.com',
  'invite.messenger.com',
  'm.me',
  'signal.group',
  'signal.me',
  'bit.ly',
  'tinyurl.com',
  'goo.gl',
  'ow.ly',
  'is.gd',
  'buff.ly',
  'adf.ly',
  'bl.ink',
  'lnk.to',
  'surl.li',
  'rb.gy',
  'shorturl.at',
  'cutt.ly',
  'rebrand.ly',
  'shorturl.at',
  'v.gd',
]);

function sanitizeListingUrl(raw: string): { ok: true; url: string; hostname: string } | { ok: false; error: string } {
  let normalized = raw.trim();

  // Enforce https:// scheme
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return { ok: false, error: 'Invalid URL' };
  }

  // Block non-http(s) schemes (javascript:, data:, ftp:, etc.)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'Only http and https URLs are allowed' };
  }

  // Upgrade http to https
  if (parsed.protocol === 'http:') {
    parsed = new URL(parsed.href.replace(/^http:/, 'https:'));
  }

  // Block chat / invite links and link shorteners
  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
  if (BLOCKED_DOMAINS.has(hostname)) {
    return { ok: false, error: 'Chat invite links and URL shorteners are not allowed' };
  }

  // Strip query parameters and hash (as stated in the rules)
  const cleanUrl = `${parsed.protocol}//${parsed.host}${parsed.pathname}`.replace(/\/+$/, '') || `${parsed.protocol}//${parsed.host}`;

  return { ok: true, url: cleanUrl, hostname: parsed.hostname };
}
// ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const type: string = body?.type || 'leaderboard';
  const rawUrl: string | undefined = body?.url;
  const name: string | undefined = body?.name;

  if (!rawUrl) {
    return NextResponse.json({ error: 'A URL is required' }, { status: 400 });
  }

  // Sanitize and validate the URL
  const urlCheck = sanitizeListingUrl(rawUrl);
  if (!urlCheck.ok) {
    return NextResponse.json({ error: urlCheck.error }, { status: 400 });
  }

  const url = urlCheck.url;
  const hostname = urlCheck.hostname;

  const productId = process.env.DODO_PAYMENTS_PRODUCT_ID;
  if (!productId) {
    return NextResponse.json(
      { error: 'Payment system is not configured' },
      { status: 500 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://digitalbillboard.lol';
  const supabase = getSupabaseServerClient();

  // 1. Handle Sponsor Slot checkout ($49 / 30 days)
  if (type === 'sponsor') {
    const slotNumber = Number(body?.slot_number);
    if (!slotNumber || slotNumber < 1 || slotNumber > 10) {
      return NextResponse.json({ error: 'Invalid slot number (must be 1-10)' }, { status: 400 });
    }

    const description: string = (body?.description || '').slice(0, 300);
    const logoUrl: string = body?.logo_url || `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
    const entryName = (name || hostname).slice(0, 100);
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
          description,
          logo_url: logoUrl,
          amount_cents: String(sponsorAmountCents),
        },
      });

      return NextResponse.json({ checkoutUrl: session.checkout_url });
    } catch (err: any) {
      console.error('Dodo Payments sponsor checkout error:', err);
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }
  }

  // 2. Handle Leaderboard Bid checkout
  const bid: number | undefined = body?.bid;
  if (!bid || bid < 1 || !Number.isFinite(bid) || bid > 100000) {
    return NextResponse.json(
      { error: 'A bid between $1 and $100,000 is required' },
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
  const entryName = (name || hostname).slice(0, 100);

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
        description: `Digital Billboard listing: ${entryName}`,
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
        { error: 'Failed to record bid' },
        { status: 500 }
      );
    }

    return NextResponse.json({ checkoutUrl: session.checkout_url });
  } catch (err: any) {
    console.error('Dodo Payments checkout creation error:', err);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
