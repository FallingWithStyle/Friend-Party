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
      <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 text-text-primary">
        <div className="w-full max-w-2xl text-center">
          <h1 className="text-8xl md:text-9xl font-heading mb-4 text-primary">Friend Party</h1>
          <div className="w-48 h-1 bg-primary mx-auto mb-12"></div>
          <p className="text-3xl md:text-4xl font-body mb-24 text-text-muted">
            Gather your allies, assess your bonds, and reveal your party's true nature.
          </p>

          <Button asChild size="xl" className="mb-16">
            <Link href="/create">» Forge a New Party «</Link>
          </Button>

          <p className="font-body text-2xl text-text-muted mb-6">Or, Join an Existing Party:</p>
          <form onSubmit={handleJoinParty} className="flex items-center justify-center gap-6">
            <label htmlFor="partyCode" className="sr-only">
              Party Code
            </label>
            <input
              type="text"
              id="partyCode"
              value={partyCode}
              onChange={(e) => setPartyCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-80 text-center bg-bg-primary border-4 border-border-primary rounded-xl py-4 px-8 font-body text-3xl tracking-widest placeholder-text-muted focus:outline-none focus:ring-4 focus:ring-primary"
              placeholder="Enter Party Code"
              required
            />
            <Button type="submit" variant="secondary" size="xl">Join</Button>
          </form>
          <div className="w-32 h-px bg-primary mx-auto mt-24"></div>
          <p className="text-xl font-body text-text-muted mt-8">© 2025 Friend Party</p>
        </div>
      </main>
    </>
  );
}