'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type MoraleSettings = {
  high: number;
  low: number;
  hysteresis: number;
};

const ADMIN_EMAIL = 'patrickandrewregan@gmail.com';

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function validate(s: MoraleSettings) {
  const errors: string[] = [];
  if (!(s.low >= 0 && s.low < s.high && s.high <= 1)) {
    errors.push('Require 0 ≤ low < high ≤ 1.');
  }
  if (!(s.hysteresis >= 0 && s.hysteresis <= 0.2)) {
    errors.push('Require 0 ≤ hysteresis ≤ 0.2.');
  }
  if (!((s.low + s.hysteresis) < (s.high - s.hysteresis))) {
    errors.push('Require low + hysteresis < high − hysteresis.');
  }
  return errors;
}

export default function AdminSettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  const [form, setForm] = useState<MoraleSettings>({
    high: 0.66,
    low: 0.33,
    hysteresis: 0.05,
  });

  const onNumberChange = (key: keyof MoraleSettings) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setForm((prev) => ({
      ...prev,
      [key]: Number.isFinite(v) ? v : (key === 'hysteresis' ? 0 : 0),
    }));
  };

  const errors = validate({
    high: clamp(form.high, 0, 1),
    low: clamp(form.low, 0, clamp(form.high, 0, 1)),
    hysteresis: clamp(form.hysteresis, 0, 0.2),
  });
  const isAdmin = sessionEmail === ADMIN_EMAIL;

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const { data: userResp, error: userErr } = await supabase.auth.getUser();
        if (userErr || !userResp?.user) {
          if (!mounted) return;
          setSessionEmail(null);
          setLoading(false);
          return;
        }
        if (!mounted) return;
        setSessionEmail(userResp.user.email ?? null);

        // Fetch current effective settings via API
        const res = await fetch('/api/admin/settings', { method: 'GET' });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || `Failed to fetch settings: ${res.status}`);
        }
        const data = (await res.json()) as MoraleSettings;
        if (!mounted) return;
        setForm({
          high: typeof data.high === 'number' ? data.high : 0.66,
          low: typeof data.low === 'number' ? data.low : 0.33,
          hysteresis: typeof data.hysteresis === 'number' ? data.hysteresis : 0.05,
        });
      } catch (e) {
        if (!mounted) return;
        const message = e instanceof Error ? e.message : 'Failed to fetch settings';
        setFetchError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(null);

    const normalized: MoraleSettings = {
      high: clamp(form.high, 0, 1),
      low: clamp(form.low, 0, 1),
      hysteresis: clamp(form.hysteresis, 0, 0.2),
    };

    const valErrors = validate(normalized);
    if (valErrors.length > 0) {
      setSaveError(valErrors.join(' '));
      return;
    }
    if (!isAdmin) {
      setSaveError('Forbidden: only admin may update settings');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalized),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j?.details || j?.error || `Save failed: ${res.status}`);
      }
      // Reflect effective saved values
      setForm({
        high: j.high,
        low: j.low,
        hysteresis: j.hysteresis,
      });
      setSaveSuccess('Saved');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Save failed';
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '1.5rem', 
        backgroundColor: '#ffffff', 
        color: '#333333',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <h1 style={{ color: '#333333', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Admin</h1>
        <p style={{ color: '#333333' }}>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ 
        padding: '1.5rem', 
        backgroundColor: '#ffffff', 
        color: '#333333',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <h1 style={{ color: '#333333', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Admin</h1>
        <p style={{ color: '#333333' }}>Access denied. You must be signed in as {ADMIN_EMAIL}.</p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '1.5rem', 
      backgroundColor: '#ffffff', 
      color: '#333333',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ color: '#333333', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Admin: Party Morale Settings</h1>
      
      <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px', border: '1px solid #ddd' }}>
        <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#333333' }}>How Party Morale Works</h3>
        <p style={{ margin: '0.5rem 0', fontSize: '14px', lineHeight: '1.4', color: '#333333' }}>
          Party morale is calculated based on how well party members rate each other in peer assessments. 
          Higher ratings = higher morale. The system uses these thresholds to determine if morale is "High", "Low", or "Neutral".
        </p>
        <p style={{ margin: '0.5rem 0', fontSize: '14px', lineHeight: '1.4', color: '#333333' }}>
          <strong>Hysteresis</strong> prevents the morale from constantly flipping between states when scores are near the thresholds. 
          Think of it like a thermostat - it needs a "buffer zone" to avoid constantly switching between hot and cold.
        </p>
      </div>

      {fetchError && (
        <p style={{ color: 'crimson', marginTop: '0.5rem' }}>
          {fetchError}
        </p>
      )}

      <form onSubmit={onSave} style={{ marginTop: '1rem', maxWidth: 520 }}>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <div>
              <span style={{ fontWeight: 'bold', color: '#333333' }}>High Threshold</span>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                When morale score reaches this value, party morale becomes "High"
              </div>
            </div>
            <input
              type="number"
              step="0.01"
              min={0}
              max={1}
              value={form.high}
              onChange={onNumberChange('high')}
              style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: 4 }}
            />
          </label>

          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <div>
              <span style={{ fontWeight: 'bold', color: '#333333' }}>Low Threshold</span>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                When morale score drops below this value, party morale becomes "Low"
              </div>
            </div>
            <input
              type="number"
              step="0.01"
              min={0}
              max={1}
              value={form.low}
              onChange={onNumberChange('low')}
              style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: 4 }}
            />
          </label>

          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <div>
              <span style={{ fontWeight: 'bold', color: '#333333' }}>Hysteresis (Buffer Zone)</span>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                Prevents constant switching between High/Low when scores are near thresholds.
                <br />
                <strong>Example:</strong> If High=0.7, Low=0.3, Hysteresis=0.05:
                <br />
                • Morale becomes "High" when score ≥ 0.7
                <br />
                • Morale becomes "Low" when score ≤ 0.3  
                <br />
                • Between 0.3-0.7, morale stays whatever it was before (prevents flipping)
              </div>
            </div>
            <input
              type="number"
              step="0.01"
              min={0}
              max={0.2}
              value={form.hysteresis}
              onChange={onNumberChange('hysteresis')}
              style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: 4 }}
            />
          </label>

          {errors.length > 0 && (
            <div style={{ color: 'crimson', fontSize: 14 }}>
              {errors.map((e, i) => (
                <div key={i}>• {e}</div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || errors.length > 0}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: 4,
              border: '1px solid #333',
              background: saving || errors.length > 0 ? '#ddd' : '#333',
              color: '#fff',
              cursor: saving || errors.length > 0 ? 'not-allowed' : 'pointer',
              marginTop: '0.5rem',
              width: 140,
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>

          {saveError && (
            <p style={{ color: 'crimson', marginTop: '0.25rem' }}>
              {saveError}
            </p>
          )}
          {saveSuccess && (
            <p style={{ color: 'green', marginTop: '0.25rem' }}>
              {saveSuccess}
            </p>
          )}

          <div style={{ marginTop: '0.5rem', fontSize: 14, color: '#555' }}>
            <div><strong>Effective values:</strong></div>
            <div>High: {clamp(form.high, 0, 1).toFixed(2)}</div>
            <div>Low: {clamp(form.low, 0, 1).toFixed(2)}</div>
            <div>Hysteresis: {clamp(form.hysteresis, 0, 0.2).toFixed(2)}</div>
          </div>

          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd' }}>
            <h4 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#333333' }}>Current Settings in Action:</h4>
            <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
              <div><strong>Morale Score Ranges:</strong></div>
              <div>• <span style={{ color: '#065f46', fontWeight: 'bold' }}>High Morale:</span> {clamp(form.high, 0, 1).toFixed(2)} and above</div>
              <div>• <span style={{ color: '#991b1b', fontWeight: 'bold' }}>Low Morale:</span> {clamp(form.low, 0, 1).toFixed(2)} and below</div>
              <div>• <span style={{ color: '#6b3e1a', fontWeight: 'bold' }}>Neutral Morale:</span> Between {clamp(form.low, 0, 1).toFixed(2)} and {clamp(form.high, 0, 1).toFixed(2)}</div>
              <div style={{ marginTop: '0.5rem', fontSize: '12px', color: '#666' }}>
                <strong>Note:</strong> Once morale becomes "High" or "Low", it won't change back to "Neutral" until it crosses the opposite threshold (due to hysteresis).
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}