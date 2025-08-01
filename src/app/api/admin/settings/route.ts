import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getMoraleSettings, saveMoraleSettings } from '@/lib/settings';

const ADMIN_EMAIL = 'patrickandrewregan@gmail.com';

export async function GET() {
  const supabase = await createClient();

  // Ensure requester is authenticated
  const { data: userResp, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userResp?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Return effective settings (with fallbacks)
  const settings = await getMoraleSettings(supabase);
  return NextResponse.json(settings, { status: 200 });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  // Ensure requester is authenticated and admin
  const { data: userResp, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userResp?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const email = userResp.user.email;
  if (email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { high, low, hysteresis } = body ?? {};
  try {
    const saved = await saveMoraleSettings(supabase, { high, low, hysteresis }, email);
    return NextResponse.json(saved, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: 'Validation/Save failed', details: e?.message ?? String(e) }, { status: 400 });
  }
}