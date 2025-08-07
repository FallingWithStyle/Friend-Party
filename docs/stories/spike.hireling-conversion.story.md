# Story Spike: Hireling (NPC) Conversion

## 1. Purpose and Scope

This spike aims to investigate the technical feasibility and implications of allowing existing party members to be converted into "Hirelings" (Non-Player Characters) via a party-wide voting mechanism. This addresses the need to include non-participating individuals in the party for assessment purposes, as outlined in FR14 and Story 2.6 of the PRD.

The scope of this spike includes:
*   Understanding necessary data model changes for marking a player as an NPC.
*   Designing the API endpoints and logic for initiating, casting, changing, and finalizing votes for hireling conversion.
*   Identifying UI/UX considerations for displaying the voting option, vote status, and visual distinction of converted hirelings in the Lobby.
*   Analyzing the impact on existing questionnaire flows and results calculation logic.
*   Addressing edge cases related to player status and existing assessment data during conversion.

## 2. Research/Investigation Areas

### 2.1. Data Model Impact
*   **`party_members` table**: Add an `is_npc` boolean column (default `false`).
*   **`answers` table**: Implications for existing relationships when a user becomes an NPC.
*   **New tables**: Design a `hireling_conversion_votes` table to track votes (e.g., `party_member_id_being_voted_on`, `voter_party_member_id`, `vote_status` (e.g., 'yes', 'no', 'pending'), `timestamp`).

### 2.2. API Modifications
*   **New API Endpoint**: `POST /api/party/[code]/vote-hireling-conversion`
    *   Input: `target_party_member_id`, `vote` (boolean: true for convert, false for not)
    *   Logic: Record vote in `hireling_conversion_votes` table.
    *   Real-time update: Notify all connected clients of vote status change.
*   **Conversion Trigger**: When all required votes are cast, trigger a backend process to:
    *   Update `party_members.is_npc` to `true` for the target member.
    *   Update the target member's status to 'waiting for results' (or 'Finished').
    *   If the target member has existing self-assessment answers, *retain those answers*. If not, pre-fill a neutral baseline of '9s across the board' for any unanswered self-assessment questions.
    *   Notify clients of successful conversion.

### 2.3. UI/UX Considerations
*   **Lobby Screen**:
    *   Display an icon/option next to each non-NPC party member's name to initiate/cast a vote for hireling conversion.
    *   Show current vote status (e.g., "X/Y votes for conversion") for a member being voted on.
    *   Visually distinguish converted hirelings (e.g., "(Hireling)" next to their name or a distinct icon).
*   **Questionnaire UI**: No changes needed; hirelings will appear as subjects for peer-assessment like regular members.
*   **Results Display Screen**: No changes needed; hirelings will be treated as party members for results display.

### 2.4. Calculation Logic Impact
*   The results calculation logic (Story 3.1) must correctly handle:
    *   Using existing self-assessment answers for converted hirelings if available.
    *   Using the neutral baseline of '9s' for any self-assessment questions not answered by a converted hireling, or for hirelings who were NPCs from the start.
    *   Including hirelings in the overall party assessment and results display.

## 3. Potential Technical Challenges and Unknowns

*   **Complex Voting Logic**: Implementing the "all non-NPC members of the party except the person being voted on needs to vote" condition. This requires careful tracking of active party members and their vote statuses.
*   **Concurrency**: Ensuring data integrity and avoiding race conditions when multiple users vote simultaneously.
*   **Real-time Synchronization**: Efficiently updating the UI for all clients as votes are cast and conversion status changes.
*   **Data Migration/Cleanup**: If a player is converted to a hireling, how do we handle their existing `answers` data if it's incomplete? The user clarified: "If we have any answers stored from them, use those answers, but they will be automatically moved to the 'waiting for results' stage." This means we prioritize existing data over the neutral baseline for answered questions.
*   **Reversibility**: While not explicitly requested, consider if a hireling can be converted back to a regular player (out of scope for this spike, but a future consideration).
*   **User Experience of Voting**: How to make the voting process clear and intuitive without being disruptive.

## 4. Acceptance Criteria for Spike Completion

*   A clear understanding of the necessary database schema changes for `is_npc` and `hireling_conversion_votes`.
*   Defined API endpoints and their logic for managing the hireling conversion voting process.
*   Mockups or detailed descriptions of UI/UX changes in the Lobby for voting and displaying hirelings.
*   A plan for integrating hireling data (existing answers vs. neutral baseline) into the results calculation logic.
*   Identified and documented solutions for the complex voting enforcement rule.
*   A recommendation on whether to proceed with full implementation of hireling conversion, or if further spikes/design are needed.

## 5. Spike Findings & Recommendation

This spike has successfully investigated the key areas for implementing the hireling conversion feature.

**Findings:**
*   **Data Model**: A new migration has been created (`friend-party-app/database/migrations/20250716174900_add_hireling_functionality.sql`) to add the `is_npc` column and the `hireling_conversion_votes` table.
*   **API**: A placeholder API route has been created (`friend-party-app/src/app/api/party/[code]/vote-hireling-conversion/route.ts`). The logic for handling votes and triggering conversion is complex but feasible.
*   **UI/UX**: A detailed description of the necessary UI changes for the Lobby has been created (`docs/ui-ux-spec-hireling-vote.md`).
*   **Calculation Logic**: The existing calculation logic will need to be adapted to handle the mixed data for converted hirelings (existing answers + neutral baseline), which is a straightforward modification.

**Recommendation:**
**PROCEED** with full implementation. The feature is technically feasible. The main complexity lies in the real-time voting logic on the backend. It is recommended to break this down into the following implementation stories:
1.  **Backend**: Implement the hireling conversion voting logic (database, API, real-time updates).
2.  **Frontend**: Implement the Lobby UI changes for voting and displaying hirelings.
3.  **Calculation**: Update the results calculation logic to handle converted hirelings.

## 6. Next Steps

Upon completion of this spike, the findings will inform the creation of detailed user stories for implementing the Hireling Conversion feature.

## 7. Test Case Considerations

*   **Convert existing test cases**: Review and update relevant test cases in the "init doc" (or equivalent test setup documentation) to include scenarios with Hirelings/NPCs.
*   **New test cases**: Define new test cases specifically for:
    *   Initiating, casting, and finalizing votes for hireling conversion.
    *   Verifying correct status updates and data handling for converted hirelings (including existing answers vs. neutral baseline).
    *   Ensuring hirelings are correctly displayed and assessed in the questionnaire and results screens.