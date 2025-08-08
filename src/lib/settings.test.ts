import { describe, it, expect } from 'vitest';
import { getMoraleSettings, saveMoraleSettings } from './settings';

function makeClient(overrides?: { rows?: Array<{ key: string; value: unknown }>; error?: any }) {
  const rows = overrides?.rows ?? [];
  const error = overrides?.error ?? null;
  return {
    from(table: string) {
      if (table !== 'app_settings') throw new Error('Unexpected table: ' + table);
      return {
        select: (_sel: string) => ({
          in: (_key: string, _vals: string[]) => Promise.resolve({ data: rows, error }),
        }),
        upsert: async () => ({ error: null }),
      } as any;
    },
  } as any;
}

describe('settings: getMoraleSettings', () => {
  it('falls back to defaults on error', async () => {
    const s = await getMoraleSettings(makeClient({ error: new Error('boom') }));
    expect(s.high).toBeGreaterThan(s.low);
  });

  it('reads and normalizes valid settings', async () => {
    const client = makeClient({
      rows: [
        { key: 'morale.high_threshold', value: { value: 0.7 } },
        { key: 'morale.low_threshold', value: { value: 0.2 } },
        { key: 'morale.hysteresis', value: { value: 0.05 } },
      ],
    });
    const s = await getMoraleSettings(client);
    expect(s).toEqual({ high: 0.7, low: 0.2, hysteresis: 0.05 });
  });

  it('returns defaults when invalid relation stored', async () => {
    const client = makeClient({
      rows: [
        { key: 'morale.high_threshold', value: { value: 0.4 } },
        { key: 'morale.low_threshold', value: { value: 0.39 } },
        { key: 'morale.hysteresis', value: { value: 0.2 } },
      ],
    });
    const s = await getMoraleSettings(client);
    // low + h (0.59) is not < high - h (0.2), so defaults expected
    expect(s.high).toBeGreaterThan(0.6);
  });
});

describe('settings: saveMoraleSettings', () => {
  it('rejects non-admin emails', async () => {
    await expect(
      saveMoraleSettings(makeClient(), { high: 0.7, low: 0.3, hysteresis: 0.05 }, 'not-admin@example.com')
    ).rejects.toThrow(/Forbidden/);
  });

  it('upserts when admin email provided', async () => {
    const client = makeClient();
    const s = await saveMoraleSettings(
      client,
      { high: 0.7, low: 0.3, hysteresis: 0.05 },
      'patrickandrewregan@gmail.com'
    );
    expect(s).toEqual({ high: 0.7, low: 0.3, hysteresis: 0.05 });
  });
});


