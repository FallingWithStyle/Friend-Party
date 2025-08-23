'use client';

import React from 'react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const ADMIN_EMAIL = 'patrickandrewregan@gmail.com';

export default function AdminNavLink() {
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        setEmail(data?.user?.email ?? null);
      } catch {
        if (!mounted) return;
        setEmail(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  if (email !== ADMIN_EMAIL) return null;

  return (
    <Link
      href="/admin"
      style={{
        padding: '0.4rem 0.6rem',
        fontSize: 14,
        border: '1px solid #333',
        borderRadius: 4,
        background: '#fff',
        color: '#333',
        textDecoration: 'none',
      }}
      aria-label="Admin"
    >
      Admin
    </Link>
  );
}