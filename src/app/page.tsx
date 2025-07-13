'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import './page.css';

type Party = {
  code: string;
  name: string;
};

export default function Home() {
  const [partyCode, setPartyCode] = useState('');
  const [joinedParties, setJoinedParties] = useState<Party[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchParties = async () => {
      try {
        const response = await fetch('/api/user/parties');
        if (response.ok) {
          const data = await response.json();
          setJoinedParties(data);
        }
      } catch (error) {
        console.error('Failed to fetch joined parties:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchParties();
  }, []);

  const handleJoinParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (partyCode.trim().length === 6) {
      router.push(`/party/${partyCode}/join`);
    } else {
      alert('Please enter a valid 6-character party code.');
    }
  };

  return (
    <>
      <div className="home-container">
        <h1 className="home-title">Friend Party</h1>
        <div className="home-divider" />
        <p className="home-subtitle">
          Gather your allies, assess your bonds, and reveal your party's true nature.
        </p>
        <Link href="/create" className="home-link">
          » Forge a New Party «
        </Link>
        <p className="home-join-text">Or, Join an Existing Party:</p>
        <form onSubmit={handleJoinParty} className="home-form">
          <label htmlFor="partyCode" style={{ display: 'none' }}>
            Party Code
          </label>
          <input
            type="text"
            id="partyCode"
            value={partyCode}
            onChange={(e) => setPartyCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="home-input"
            placeholder="Enter Party Code"
            required
          />
          <button type="submit" className="home-button">Join</button>
        </form>
        <div className="home-footer-divider" />
        <p className="home-footer-text">© 2025 Friend Party</p>
      </div>
    </>
  );
}