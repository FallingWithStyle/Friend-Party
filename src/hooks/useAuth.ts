'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client'; // Corrected import path
import { Session, User, SupabaseClient } from '@supabase/supabase-js';
import { useRef } from 'react'; // Import useRef
import usePartyStore from '@/store/partyStore';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Use useRef to store the Supabase client instance
  const supabaseRef = useRef<SupabaseClient | null>(null);

  if (!supabaseRef.current) {
    supabaseRef.current = createClient();
  }
  const supabase = supabaseRef.current;

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
      usePartyStore.setState({ loading: false });
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]); // Add supabase to dependencies

  const signInWithMagicLink = async (email: string, redirectUrl?: string) => {
    setMagicLinkSent(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl || window.location.origin,
      },
    });

    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setEmail('');
    setMagicLinkSent(false);
  };

  return {
    user,
    session,
    loading,
    email,
    setEmail,
    magicLinkSent,
    setMagicLinkSent,
    signInWithMagicLink,
    signOut,
  };
}