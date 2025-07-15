'use client';

import { UnifiedQuestionnaire } from '@/components/common/UnifiedQuestionnaire';
import usePartyStore from '@/store/partyStore';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import './page.css';

export default function PeerAssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;
  const { party, getPartyByCode } = usePartyStore();

  useEffect(() => {
    if (!party?.code && code) {
      getPartyByCode(code);
    }
  }, [party, code, getPartyByCode]);

  if (!code) {
    return <div>Loading...</div>;
  }

  return (
    <div className="peer-assessment-container">
      <h1 className="peer-assessment-title">Peer Assessment</h1>
      <UnifiedQuestionnaire partyCode={code} questionType="peer-assessment" />
    </div>
  );
}