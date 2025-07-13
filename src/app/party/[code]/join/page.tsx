'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import usePartyStore from '@/store/partyStore';
import { createClient } from '@/utils/supabase/client';
import Auth from '@/components/Auth';
import { Session, SupabaseClient } from '@supabase/supabase-js';
import './page.css';

const supabase = createClient() as unknown as SupabaseClient;

export default function JoinPartyPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
  });
  const router = useRouter();
  const { code } = useParams();
  const { loading, error, joinParty } = usePartyStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [session]);

  useEffect(() => {
    if (session) {
      const fetchProfile = async () => {
        const response = await fetch('/api/profile');
        const data = await response.json();
        setProfile(data);

        // If profile has names, pre-fill the form
        if (data && data.first_name && data.last_name) {
          setFormData({
            firstName: data.first_name,
            lastName: data.last_name
          });
        }
      };
      fetchProfile();
    }
  }, [session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof code === 'string') {
      await joinParty(code, formData);
      router.push(`/party/${code}`);
    }
  };

  if (!session) {
    return (
      <div className="auth-required-container">
        <div className="auth-required-card">
          <h1 className="auth-required-title">You need to be logged in to join a party.</h1>
          <Auth redirectUrl={typeof code === 'string' ? `/party/${code}/join` : '/'} />
        </div>
      </div>
    );
  }

  return (
    <div className="join-party-container">
      <div className="join-party-card">
        <h1 className="join-party-title">Join the Party!</h1>
        <p className="user-email-text">You are signed in as {session.user.email}.</p>
        <form onSubmit={handleSubmit} className="join-party-form">
          {!profile?.first_name && (
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required={!profile?.first_name}
                className="form-input"
            />
          </div>
          )}
          {!profile?.last_name && (
            <div className="form-group">
              <label htmlFor="lastName" className="form-label">
                Last Name (optional)
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Joining...' : 'Join Party'}
          </button>
        </form>
      </div>
    </div>
  );
}