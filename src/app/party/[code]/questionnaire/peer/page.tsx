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
  const { party, getPartyByCode, members, user } = usePartyStore();

  // Find the current user's member record
  const currentUserMember = members.find(m => m.user_id === user?.id);

  useEffect(() => {
    if (!party?.code && code) {
      getPartyByCode(code);
    }
  }, [party, code, getPartyByCode]);

  // Call start-questionnaire for peer assessment assignments
  useEffect(() => {
    if (party && currentUserMember) {
      fetch(`/api/party/${code}/start-questionnaire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: currentUserMember.id }),
      });
    }
  }, [party, currentUserMember, code]);

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