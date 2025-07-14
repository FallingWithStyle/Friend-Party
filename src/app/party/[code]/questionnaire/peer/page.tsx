'use client';

import { PeerQuestionnaire } from '@/components/common/PeerQuestionnaire';
import usePartyStore from '@/store/partyStore';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import './page.css';

export default function PeerAssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;
  const { party } = usePartyStore();

  useEffect(() => {
    if (!party?.code && code) {
      router.push(`/party/${code}/join`);
    }
  }, [party, code, router]);

  if (!code) {
    return <div>Loading...</div>;
  }

  return (
    <div className="peer-assessment-container">
      <h1 className="peer-assessment-title">Peer Assessment</h1>
      <PeerQuestionnaire partyCode={code} />
    </div>
  );
}