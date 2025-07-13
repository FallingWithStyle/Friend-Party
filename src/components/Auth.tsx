'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Session, SupabaseClient } from '@supabase/supabase-js';
import './Auth.css';

const supabase = createClient() as unknown as SupabaseClient;

export default function Auth({ redirectUrl }: { redirectUrl?: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl || window.location.origin,
      },
    });
    if (error) {
      alert(error.message);
    } else {
      alert('Check your email for the login link!');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!mounted) {
    return null;
  }

  if (!session) {
    return (
      <div className="auth-container">
        <form onSubmit={handleLogin} className="auth-form">
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
          />
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Sending...' : 'Send magic link'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <p>Signed in as {session.user.email}</p>
      <button onClick={handleLogout} className="logout-button">
        Logout
      </button>
    </div>
  );
}