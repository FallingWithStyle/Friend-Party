-- Migration: Create app_settings for admin-configurable settings
-- Purpose: Store application-wide settings (JSON values) with RLS allowing
--          authenticated read and admin-only writes via email check.
-- Idempotent where practical.

-- 1) Table
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.app_settings IS
  'Key/value application settings. Keys include:
   - morale.high_threshold (number in [0,1])
   - morale.low_threshold (number in [0,1])
   - morale.hysteresis (number in [0,0.2])';

COMMENT ON COLUMN public.app_settings.key IS
  'Setting key. Example: morale.high_threshold, morale.low_threshold, morale.hysteresis';
COMMENT ON COLUMN public.app_settings.value IS
  'JSONB payload containing the setting value, e.g. { "value": 0.66 }';
COMMENT ON COLUMN public.app_settings.updated_by IS
  'Auth user who last updated this setting (auth.users.id)';
COMMENT ON COLUMN public.app_settings.updated_at IS
  'Timestamp when this record was last updated';

-- Optional unique index on key (redundant with PK but harmless)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'app_settings_key_unique_idx'
  ) THEN
    CREATE UNIQUE INDEX app_settings_key_unique_idx ON public.app_settings (key);
  END IF;
END $$;

-- 2) Row Level Security
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS app_settings_select_authenticated ON public.app_settings;
DROP POLICY IF EXISTS app_settings_write_admin_email ON public.app_settings;

-- SELECT: Any authenticated user may read
CREATE POLICY app_settings_select_authenticated
ON public.app_settings
FOR SELECT
TO authenticated
USING (true);

-- INSERT/UPDATE/DELETE: only admin email allowed
-- Utilize auth.email() for policy enforcement
CREATE POLICY app_settings_write_admin_email
ON public.app_settings
FOR ALL
TO authenticated
USING (auth.email() = 'patrickandrewregan@gmail.com')
WITH CHECK (auth.email() = 'patrickandrewregan@gmail.com');

-- 3) Optional seed defaults (no-op if already present)
-- Store as {"value": number} shape for easy JSON extraction in clients
INSERT INTO public.app_settings (key, value)
VALUES
  ('morale.high_threshold', '{"value": 0.66}'),
  ('morale.low_threshold',  '{"value": 0.33}'),
  ('morale.hysteresis',     '{"value": 0.05}')
ON CONFLICT (key) DO NOTHING;