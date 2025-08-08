'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import usePartyStore from '@/store/partyStore';
import LoginModal from './LoginModal';
import './Auth.css';

export default function Auth({ redirectUrl: _redirectUrl }: { redirectUrl?: string }) {
  const { user, loading: _loading, signOut } = useAuth();
  const [_isModalOpen, setIsModalOpen] = useState(false);
  const setUser = usePartyStore((state) => state.setUser);

  if (user) {
    setUser(user);
  }

  if (!user) {
    return (
      <div className="auth-container">
        <LoginModal
          isOpen={true}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="auth-container">
      <p>Signed in as {user.email}</p>
      <button onClick={signOut} className="logout-button">
        Logout
      </button>
    </div>
  );
}