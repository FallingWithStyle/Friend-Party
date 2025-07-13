'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      <div className="flex flex-col items-center justify-center text-center">
        <h1 className="font-heading text-7xl text-primary">Friend Party</h1>
        <div className="w-32 h-px bg-border-primary my-6" />
        <p className="text-2xl text-text-muted mb-12">
          Gather your allies, assess your bonds, and reveal your party's true nature.
        </p>
        <Link href="/create" className="font-heading text-3xl text-primary mb-10">
          » Forge a New Party «
        </Link>
        <p className="text-lg text-text-muted mb-4">Or, Join an Existing Party:</p>
        <form onSubmit={handleJoinParty} className="flex items-center gap-2">
          <label htmlFor="partyCode" className="sr-only">
            Party Code
          </label>
          <input
            type="text"
            id="partyCode"
            value={partyCode}
            onChange={(e) => setPartyCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="w-56 bg-bg-surface border border-border-primary p-2 text-center text-xl tracking-widest placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-secondary"
            placeholder="Enter Party Code"
            required
          />
          <Button type="submit" variant="secondary" size="lg" className="rounded-none h-full">Join</Button>
        </form>
        <div className="w-24 h-px bg-border-primary mt-12 mb-4" />
        <p className="text-sm text-text-muted">© 2025 Friend Party</p>
      </div>
    </>
  );
}