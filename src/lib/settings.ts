import { createClient as createServerClient } from '@/utils/supabase/server';
import { MORALE_HIGH_THRESHOLD, MORALE_LOW_THRESHOLD, MORALE_HYSTERESIS } from '@/lib/morale';

export type MoraleSettings = {
  high: number;
  low: number;
  hysteresis: number;
};

const ADMIN_EMAIL = 'patrickandrewregan@gmail.com';

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function normalizeSettings(input: Partial<MoraleSettings>): MoraleSettings {
  return {
    high: clamp01(input.high ?? MORALE_HIGH_THRESHOLD),
    low: clamp01(input.low ?? MORALE_LOW_THRESHOLD),
    hysteresis: Math.max(0, Math.min(0.2, input.hysteresis ?? MORALE_HYSTERESIS)),
  };
}

function validateSettings(s: MoraleSettings): asserts s is MoraleSettings {
  if (!(s.low >= 0 && s.low < s.high && s.high <= 1)) {
    throw new Error('Invalid thresholds: require 0 <= low < high <= 1');
  }
  if (!(s.hysteresis >= 0 && s.hysteresis <= 0.2)) {
    throw new Error('Invalid hysteresis: require 0 <= h <= 0.2');
  }
  if (!((s.low + s.hysteresis) < (s.high - s.hysteresis))) {
    throw new Error('Invalid relation: low + hysteresis must be < high - hysteresis');
  }
}

/**
 * Fetch morale settings overrides from app_settings with fallbacks to defaults.
 * Expects a Supabase server client (RLS-enabled).
 */
export async function getMoraleSettings(supabase?: Awaited<ReturnType<typeof createServerClient>>): Promise<MoraleSettings> {
  const client = supabase ?? await createServerClient();

  const keys = [
    'morale.high_threshold',
    'morale.low_threshold',
    'morale.hysteresis',
  ];

  const { data, error } = await client
    .from('friendparty.app_settings')
    .select('key, value')
    .in('key', keys as string[]);

  const defaults: MoraleSettings = {
    high: MORALE_HIGH_THRESHOLD,
    low: MORALE_LOW_THRESHOLD,
    hysteresis: MORALE_HYSTERESIS,
  };

  if (error || !Array.isArray(data)) {
    return defaults;
  }

  const map = new Map<string, unknown>();
  for (const row of data) {
    map.set(row.key, row.value);
  }

  const getNumber = (raw: unknown, fallback: number): number => {
    if (typeof raw === 'number') return raw;
    if (raw && typeof raw === 'object' && 'value' in (raw as Record<string, unknown>)) {
      const v = (raw as { value?: unknown }).value;
      if (typeof v === 'number') return v;
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    }
    const n = Number(raw as unknown as number);
    return Number.isFinite(n) ? n : fallback;
  };

  const parsed: Partial<MoraleSettings> = {
    high: getNumber(map.get('morale.high_threshold'), defaults.high),
    low: getNumber(map.get('morale.low_threshold'), defaults.low),
    hysteresis: getNumber(map.get('morale.hysteresis'), defaults.hysteresis),
  };

  const normalized = normalizeSettings(parsed);

  try {
    validateSettings(normalized);
    return normalized;
  } catch {
    // If invalid combinations are stored, fall back to defaults
    return defaults;
  }
}

/**
 * Save morale settings. Requires admin email and enforces validation.
 * Writes three upserts to app_settings with shape { value: number }.
 */
export async function saveMoraleSettings(
  supabase: Awaited<ReturnType<typeof createServerClient>> | undefined,
  settings: Partial<MoraleSettings>,
  currentUserEmail: string | null | undefined
): Promise<MoraleSettings> {
  if (!currentUserEmail || currentUserEmail !== ADMIN_EMAIL) {
    throw new Error('Forbidden: only admin may update settings');
  }

  const client = supabase ?? await createServerClient();

  const normalized = normalizeSettings(settings);
  validateSettings(normalized);

  const rows = [
    { key: 'morale.high_threshold', value: { value: normalized.high } },
    { key: 'morale.low_threshold', value: { value: normalized.low } },
    { key: 'morale.hysteresis', value: { value: normalized.hysteresis } },
  ];

  // Upsert each key; rely on RLS policy using auth.email()
  for (const r of rows) {
    const { error } = await client
      .from('app_settings')
      .upsert(r, { onConflict: 'key' });
    if (error) {
      throw new Error(`Failed to save ${r.key}: ${error.message}`);
    }
  }

  return normalized;
}