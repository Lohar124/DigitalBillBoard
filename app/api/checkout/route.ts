import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/lib/paypal';
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

// ── Encode metadata into PayPal custom_id (max 127 chars) ──────────
function encodeCustomId(meta: Record<string, string>): string {
  return JSON.stringify(meta).slice(0, 127);
}
// ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
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

    // Check PayPal is configured
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_SECRET) {
      return NextResponse.json(
        { error: 'PayPal credentials are not configured on the server' },
        { status: 500 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://digitalbillboard.lol';

    // 1. Handle Sponsor Slot checkout ($49 / 30 days)
    if (type === 'sponsor') {
      const slotNumber = Number(body?.slot_number);
      if (!slotNumber || slotNumber < 1 || slotNumber > 10) {
        return NextResponse.json({ error: 'Invalid slot number (must be 1-10)' }, { status: 400 });
      }

      const description: string = (body?.description || '').slice(0, 300);
      const logoUrl: string = body?.logo_url || `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
      const entryName = (name || hostname).slice(0, 100);

      const customId = encodeCustomId({
        t: 'sponsor',
        s: String(slotNumber),
        u: url,
        n: entryName.slice(0, 30),
      });

      const order = await createOrder({
        amountUsd: '49.00',
        description: `Sponsor Slot #${slotNumber} — 30 days`,
        customId,
        returnUrl: `${siteUrl}/?sponsor_claimed=1&slot=${slotNumber}`,
        cancelUrl: `${siteUrl}/?cancelled=1`,
      });

      // Attempt to store full metadata in Supabase (non-blocking)
      try {
        const supabase = getSupabaseServerClient();
        await supabase.from('bids').insert({
          entry_url: url,
          entry_name: entryName,
          amount_cents: 4900,
          polar_checkout_id: order.orderId,
          status: 'pending',
          metadata: JSON.stringify({
            type: 'sponsor',
            slot_number: slotNumber,
            url,
            name: entryName,
            description,
            logo_url: logoUrl,
            amount_cents: 4900,
          }),
        });
      } catch (dbErr) {
        console.warn('Non-fatal: Could not record sponsor bid in database:', dbErr);
      }

      return NextResponse.json({ checkoutUrl: order.approvalUrl });
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

    // Check existing bid in database if available
    let existingBidCents = 0;
    try {
      const supabase = getSupabaseServerClient();
      const { data: existing } = await supabase
        .from('leaderboard_entries')
        .select('bid_cents')
        .eq('url', url)
        .maybeSingle();

      if (existing?.bid_cents) {
        existingBidCents = existing.bid_cents;
      }
    } catch {
      // Non-fatal if database is unavailable
    }

    if (existingBidCents >= amountCents) {
      return NextResponse.json(
        {
          error: `Your new bid ($${bid}) must be higher than your current bid ($${existingBidCents / 100})`,
        },
        { status: 400 }
      );
    }

    // Calculate charge amount (only pay the difference if already listed)
    const chargeAmountCents = existingBidCents > 0 ? amountCents - existingBidCents : amountCents;
    const chargeAmountUsd = (chargeAmountCents / 100).toFixed(2);
    const entryName = (name || hostname).slice(0, 100);

    const customId = encodeCustomId({
      t: 'lb',
      u: url,
      n: entryName.slice(0, 30),
      a: String(amountCents),
    });

    const order = await createOrder({
      amountUsd: chargeAmountUsd,
      description: `Digital Billboard: ${entryName}`,
      customId,
      returnUrl: `${siteUrl}/?claimed=1`,
      cancelUrl: `${siteUrl}/?cancelled=1`,
    });

    // Attempt to store full metadata in Supabase (non-blocking)
    try {
      const supabase = getSupabaseServerClient();
      await supabase.from('bids').insert({
        entry_url: url,
        entry_name: entryName,
        amount_cents: chargeAmountCents,
        polar_checkout_id: order.orderId,
        status: 'pending',
        metadata: JSON.stringify({
          type: 'leaderboard',
          url,
          name: entryName,
          amount_cents: amountCents,
          charge_amount_cents: chargeAmountCents,
        }),
      });
    } catch (dbErr) {
      console.warn('Non-fatal: Could not record bid in database:', dbErr);
    }

    return NextResponse.json({ checkoutUrl: order.approvalUrl });
  } catch (err: any) {
    console.error('Checkout API error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
