// ── PayPal REST API Client (Orders v2) ─────────────────────────────
// Uses native fetch — no third-party SDK required.
// Env vars: PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_MODE (sandbox|live)

const PAYPAL_BASE = {
  sandbox: 'https://api-m.sandbox.paypal.com',
  live: 'https://api-m.paypal.com',
} as const;

function getBaseUrl(): string {
  const mode = process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';
  return PAYPAL_BASE[mode];
}

// ── Access Token (cached for 8 hours) ──────────────────────────────
let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.token;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;

  if (!clientId || !secret) {
    throw new Error('Missing PAYPAL_CLIENT_ID or PAYPAL_SECRET environment variables');
  }

  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');

  const res = await fetch(`${getBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('PayPal token error:', text);
    throw new Error('Failed to obtain PayPal access token');
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    // Expire 5 minutes early to avoid edge cases
    expiresAt: now + (data.expires_in - 300) * 1000,
  };

  return cachedToken.token;
}

// ── Create Order ───────────────────────────────────────────────────
// customId is a JSON string containing our metadata (type, url, name, etc.)
export async function createOrder(opts: {
  amountUsd: string; // e.g. "49.00"
  description: string;
  customId: string; // JSON-encoded metadata (max 127 chars)
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ orderId: string; approvalUrl: string }> {
  const token = await getAccessToken();

  const res = await fetch(`${getBaseUrl()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: opts.amountUsd,
          },
          description: opts.description.slice(0, 127),
          custom_id: opts.customId.slice(0, 127),
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
            brand_name: 'Digital Billboard',
            locale: 'en-US',
            landing_page: 'LOGIN',
            user_action: 'PAY_NOW',
            return_url: opts.returnUrl,
            cancel_url: opts.cancelUrl,
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('PayPal create order error:', text);
    throw new Error('Failed to create PayPal order');
  }

  const order = await res.json();
  const approvalLink = order.links?.find(
    (l: { rel: string; href: string }) => l.rel === 'payer-action'
  );

  if (!approvalLink?.href) {
    throw new Error('PayPal order created but no approval URL returned');
  }

  return {
    orderId: order.id,
    approvalUrl: approvalLink.href,
  };
}

// ── Capture Order (finalizes payment) ──────────────────────────────
export async function captureOrder(orderId: string): Promise<{
  status: string;
  captureId: string | null;
  customId: string | null;
  payerEmail: string | null;
}> {
  const token = await getAccessToken();

  const res = await fetch(`${getBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('PayPal capture error:', text);
    throw new Error('Failed to capture PayPal order');
  }

  const data = await res.json();
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];

  return {
    status: data.status, // "COMPLETED"
    captureId: capture?.id || null,
    customId: data.purchase_units?.[0]?.custom_id || capture?.custom_id || null,
    payerEmail: data.payer?.email_address || null,
  };
}

// ── Get Order Details (read-only) ──────────────────────────────────
export async function getOrderDetails(orderId: string): Promise<{
  status: string;
  customId: string | null;
  amountValue: string | null;
}> {
  const token = await getAccessToken();

  const res = await fetch(`${getBaseUrl()}/v2/checkout/orders/${orderId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('PayPal get order error:', text);
    throw new Error('Failed to get PayPal order details');
  }

  const data = await res.json();
  return {
    status: data.status,
    customId: data.purchase_units?.[0]?.custom_id || null,
    amountValue: data.purchase_units?.[0]?.amount?.value || null,
  };
}

// ── Verify Webhook Signature ───────────────────────────────────────
export async function verifyWebhookSignature(opts: {
  webhookId: string;
  headers: Record<string, string>;
  body: string;
}): Promise<boolean> {
  const token = await getAccessToken();

  const res = await fetch(`${getBaseUrl()}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: opts.headers['paypal-auth-algo'],
      cert_url: opts.headers['paypal-cert-url'],
      transmission_id: opts.headers['paypal-transmission-id'],
      transmission_sig: opts.headers['paypal-transmission-sig'],
      transmission_time: opts.headers['paypal-transmission-time'],
      webhook_id: opts.webhookId,
      webhook_event: JSON.parse(opts.body),
    }),
  });

  if (!res.ok) return false;

  const data = await res.json();
  return data.verification_status === 'SUCCESS';
}
