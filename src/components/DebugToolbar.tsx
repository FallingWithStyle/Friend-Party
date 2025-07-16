'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { IS_DEBUG_MODE, logDebug } from '@/lib/debug';
import usePartyStore from '@/store/partyStore'; // Import usePartyStore
import './DebugToolbar.css';

export const DebugToolbar = () => {
  const [isMinimized, setIsMinimized] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { getPartyByCode, resetPartyState } = usePartyStore(); // Get resetPartyState from the store

  if (!IS_DEBUG_MODE) {
    return null;
  }

  const partyCodeMatch = pathname.match(/\/party\/([a-zA-Z0-9]+)/);
  const partyCode = partyCodeMatch ? partyCodeMatch[1] : null;
  const isQuestionnairePage = pathname.includes('/questionnaire');
  const isSelfAssessment = pathname.includes('/questionnaire') && !pathname.includes('/peer');
  const isPeerAssessment = pathname.includes('/questionnaire/peer');

  const handleResetPartyStatus = async () => {
    if (!partyCode) {
      logDebug("No party code found for reset.");
      return;
    }
    logDebug(`Attempting to reset party ${partyCode} status.`);
    try {
      const response = await fetch(`/api/party/${partyCode}/reset-status`, {
        method: 'POST',
      });
      if (response.ok) {
        logDebug(`Party ${partyCode} status reset successfully.`);
        resetPartyState(); // Reset the store state
        await getPartyByCode(partyCode); // Re-fetch party data
        window.location.reload(); // Force a full page reload
      } else {
        const errorData = await response.json();
        console.error('Failed to reset party status:', errorData.error);
      }
    } catch (error) {
      console.error('Error resetting party status:', error);
    }
  };

  const handleAutoComplete = async (type: 'self' | 'peer') => {
    if (!partyCode) {
      logDebug("No party code found for auto-complete.");
      return;
    }
    logDebug(`Attempting to auto-complete ${type}-assessment for party ${partyCode}.`);
    // This will trigger the auto-complete logic within UnifiedQuestionnaire.tsx
    // We don't need to call an API here, as the button in UnifiedQuestionnaire
    // already handles the submission. We just need to navigate to the correct page.
    if (type === 'self' && isSelfAssessment) {
      // The button is already on the page, so no navigation needed.
      // This button will be removed from here and placed directly in UnifiedQuestionnaire.
      // For now, this is a placeholder.
      logDebug("Self-assessment auto-complete button clicked.");
    } else if (type === 'peer' && isPeerAssessment) {
      // The button is already on the page, so no navigation needed.
      // This button will be removed from here and placed directly in UnifiedQuestionnaire.
      // For now, this is a placeholder.
      logDebug("Peer-assessment auto-complete button clicked.");
    } else {
      logDebug(`Auto-complete for ${type} assessment is not applicable on this page.`);
    }
  };

  return (
    <div className={`debug-toolbar ${isMinimized ? 'minimized' : ''}`}>
      <button className="toggle-button" onClick={() => setIsMinimized(!isMinimized)}>
        {isMinimized ? '▶' : '◀'} Debug
      </button>
      {!isMinimized && (
        <div className="debug-controls">
          {partyCode && (
            <button onClick={handleResetPartyStatus} className="debug-button">
              Reset Party Status
            </button>
          )}
          {/* Auto-complete buttons are now handled directly in UnifiedQuestionnaire.tsx */}
          {/* {isQuestionnairePage && (
            <>
              {isSelfAssessment && (
                <button onClick={() => handleAutoComplete('self')} className="debug-button">
                  Auto-Complete Self-Assessment
                </button>
              )}
              {isPeerAssessment && (
                <button onClick={() => handleAutoComplete('peer')} className="debug-button">
                  Auto-Complete Peer-Assessment
                </button>
              )}
            </>
          )} */}
        </div>
      )}
    </div>
  );
};