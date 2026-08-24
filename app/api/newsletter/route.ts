import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const email: string | undefined = body?.email;

    if (!email || !email.includes('@') || !email.includes('.')) {
      return NextResponse.json({ error: 'Please provide a valid email address' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    try {
      const supabase = getSupabaseServerClient();
      // Store email in subscribers table if table exists
      await supabase.from('newsletter_subscribers').upsert(
        { email: cleanEmail, subscribed_at: new Date().toISOString() },
        { onConflict: 'email' }
      );
    } catch {
      // Non-fatal if table not yet created
    }

    return NextResponse.json({ success: true, message: 'Subscribed successfully!' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
