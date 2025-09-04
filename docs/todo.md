# Friend Party — Project TODO

This TODO is derived from docs/prd.md and organized by Epics and Stories. Each item references PRD sections where applicable.

Legend:
- [ ] Pending
- [-] In Progress
- [x] Done

## Global/Meta
- [ ] Validate Story 3.1 calculation algorithm against sample parties (PRD §10 Recommendations)
- [ ] Medium Priority UX review for Results and Lobby transitions (PRD §10 Recommendations)
- [ ] Release preparation: cleanup unused/redundant files per checklist (PRD §12)

## Database Schema Alignment (Party Motto Proposals) — PRD §13
- [x] Adopt “New” schema as canonical (proposed_by_member_id, text, vote_count, is_finalized, active)
- [ ] Ensure migration 20250731160000_add_party_motto_proposals_and_votes.sql is applied on all envs
- [x] Reconcile legacy columns to new names (ALTER TABLE renames; add is_finalized, active)
- [x] Update RLS policies to reference proposed_by_member_id
- [x] Update database/init.sql to match new schema and remove legacy/duplicate blocks
- [x] After unification, remove dual-path insert/select in:
  - friend-party-app/src/app/api/party/[code]/propose-motto/route.ts
  - friend-party-app/src/app/api/party/[code]/mottos/route.ts
- [ ] Acceptance: All envs use new columns; init.sql + migrations consistent; API fallbacks removed

## Epic 1: Foundation & Party Management — PRD §6
- [x] Story 1.1: Project foundation (Next.js baseline present)
  - [x] Confirm supabase-js installed and configured via env vars
  - [x] Verify folder structure and local run
- [x] Story 1.2: Landing Page
  - [x] Show app name (friend-party-app/src/app/page.tsx:100)
  - [x] Create Party link (“Forge a New Party”) (friend-party-app/src/app/page.tsx:128)
  - [x] 6-letter code input with validation and uppercase (friend-party-app/src/app/page.tsx:137)
  - [x] Join Party button/flow gating: routes to join page only when code length is 6, otherwise alerts (friend-party-app/src/app/page.tsx:61-71)
  - [x] If already a member of entered code, route directly to lobby (friend-party-app/src/app/page.tsx:62-67)
- [x] Story 1.3: Create Party Flow
  - [x] Navigate to party creation screen (link exists; backing API is implemented)
  - [x] Create parties record with unique 6-letter code via RPC create_party_with_leader (friend-party-app/src/app/api/party/route.ts:28)
  - [x] Set creator as Party Leader and member (RPC handles) (friend-party-app/src/app/api/party/route.ts:29-34)
  - [x] Return party response; client redirects post-create (route implemented)
- [x] Story 1.4: Join Party Flow
  - [x] Code lookup in parties via GET (friend-party-app/src/app/api/party/route.ts:73)
  - [x] Prompt for name and add as member (friend-party-app/src/app/party/[code]/join/page.tsx:96)
  - [x] Handle invalid party not found by redirect (friend-party-app/src/app/party/[code]/join/page.tsx:47)
  - [x] Redirect to Lobby after join (friend-party-app/src/app/party/[code]/join/page.tsx:97)
- [x] Story 1.5: Lobby/Waiting Screen
  - [x] Show Party Name, Motto, Code (friend-party-app/src/app/party/[code]/page.tsx:784,800)
  - [x] List members; realtime updates (friend-party-app/src/app/party/[code]/page.tsx:175-205)
  - [x] Display per-member joined/voting/finished status explicitly in UI (friend-party-app/src/app/party/[code]/page.tsx:945; friend-party-app/src/app/party/[code]/page.css:382)
- [x] Story 1.6: Propose Adventurer Names
  - [x] Propose names per member; visible realtime (friend-party-app/src/app/party/[code]/page.tsx:357,178-205)
  - [x] Voting for names; change vote supported (friend-party-app/src/app/party/[code]/page.tsx:404-433,1049-1061)
  - [x] Final selection now majority-only; finalize-name UI removed (friend-party-app/src/app/party/[code]/page.tsx:931,1020,442)

## Epic 2: Questionnaire Engine — PRD §7
- [x] Story 2.1: Question Data Model & Seeding
  - [x] Seeds present and idempotent (friend-party-app/database/seeds/01_questions.sql:1)
  - [x] App fetches questions by type in UnifiedQuestionnaire (friend-party-app/src/components/common/UnifiedQuestionnaire.tsx:62-75)
- [x] Story 2.2: Self-Assessment
  - [x] UI flow entry via Start Questionnaire (friend-party-app/src/app/party/[code]/page.tsx:466-479)
  - [x] One-at-a-time card UI via UnifiedQuestionnaire + Questionnaire.css (friend-party-app/src/components/common/UnifiedQuestionnaire.tsx:247-281; friend-party-app/src/components/common/Questionnaire.css:1-59)
  - [x] Persist to answers table with voter=subject=current member and stat selection (friend-party-app/src/components/common/UnifiedQuestionnaire.tsx:149-157,185-190)
  - [x] Finish flow redirects back to lobby and updates assessment_status (friend-party-app/src/components/common/UnifiedQuestionnaire.tsx:204-206; friend-party-app/src/app/api/party/[code]/finish-questionnaire/route.ts:12-21)
- [x] Story 2.3: Peer-Assessment
  - [x] Presence of peer answers detection (friend-party-app/src/app/party/[code]/page.tsx:498-505)
  - [x] Confirm per-member answer UI and navigation (per-question subjects from assignments; deterministic shuffle and one-at-a-time UI) (friend-party-app/src/components/common/UnifiedQuestionnaire.tsx:47)
  - [x] Persist voter/subject/question links (answers table usage present)
  - [x] Return to Lobby after completion via finish flow
- [x] Story 2.4: Update Lobby with Voting Status
  - [x] party_members status use and realtime; auto navigation to results when ready (friend-party-app/src/app/party/[code]/page.tsx:309-333)
- [-] Story 2.5: Propose and Vote on Party Motto
  - [x] Propose mottos and list with vote counts (friend-party-app/src/app/party/[code]/page.tsx:816-852, 858-893)
  - [x] Vote/unvote with optimistic updates and backend API (friend-party-app/src/app/party/[code]/page.tsx:629-769; api vote-motto: friend-party-app/src/app/api/party/[code]/vote-motto/route.ts:1)
  - [x] Auto-finalize on strict majority and set party.motto (friend-party-app/src/app/api/party/[code]/vote-motto/route.ts:134-183,166-181)
  - [x] Integrate morale-based tie-break behavior when exactly tied (morale-based leader tie-break implemented in [friend-party-app/src/app/api/party/[code]/vote-motto/route.ts](friend-party-app/src/app/api/party/%5Bcode%5D/vote-motto/route.ts:134))
  - [x] Display selected Motto in Lobby and Results (Lobby shows motto; Results shows motto at top)
- [x] Story 2.6: Add and Assess Hirelings
  - [x] Hireling conversion voting and broadcasts (friend-party-app/src/app/party/[code]/page.tsx:277-301,451-464)
  - [x] “Hireling” indicator and is_npc handling (friend-party-app/src/app/party/[code]/page.tsx:915-916,991-1012)
  - [x] Ensure hirelings included as subjects during peer assessment (assignments and UI use subjects including NPCs)
  - [x] Neutral baseline used in calculation (supabase/functions/calculate-results/index.ts: NPC_BASELINE + prefill '9')

## Epic 3: Big Reveal & Results — PRD §8
- [x] Story 3.1: Results Calculation Logic
  - Notes: Tunables centralized in supabase/functions/calculate-results/index.ts; sparse-data guards; normalization by unique non-NPC raters
- [x] Story 3.2: Automatic Results Trigger
  - Notes: Trigger on last Finished via finish-questionnaire route; Lobby auto-nav via realtime
- [x] Story 3.3: Results Display Screen
  - Notes: Character sheet layout with class and EXP; polished grid (friend-party-app/src/app/party/[code]/results/page.tsx:347-351)
- [x] Story 3.4: Share Results
  - Notes: Copy public results link with view=public flag and read-only indicator (friend-party-app/src/app/party/[code]/results/page.tsx:330-338)
- [x] Story 3.5: Display EXP on Profiles
  - [x] EXP visible on results character sheets (friend-party-app/src/app/party/[code]/results/page.tsx:348-350)

## Epic 4: UI Modernization & Polish — PRD §9
- [x] Story 4.1: Modern UI Implementation
  - [x] Update color palette, typography, spacing to a design system
  - [x] Redesign core components with consistent modern style
  - [x] Add micro-interactions/animations
  - [x] Refine layouts for hierarchy/readability
- [-] Story 4.2: Discord Login Option (DEFERRED)
  - [ ] Add "Login with Discord" to landing
  - [ ] Supabase OAuth for Discord
  - [ ] On success, authenticate and create user record if new
  - [ ] Capture Discord username and avatar
- [x] Story 4.3: Achievement System
  - [x] Create `achievements` table with columns: achievement_id, name, description, icon, category, unlock_conditions (JSONB)
  - [x] Create `user_achievements` table to track earned achievements with timestamps
  - [x] Create `user_achievement_progress` table to track progress on multi-step achievements
  - [x] Define achievement categories: Party Participation, Social Interaction, Questionnaire Completion, Special Events
  - [x] Add achievement display to user profile page with visual indicators
  - [x] Implement achievement notification system for new unlocks
  - [x] Add achievement progress tracking for multi-step achievements
  - [x] Create automatic achievement awarding system based on user actions
- [x] Story 4.4: Avatar System
  - [x] Create `avatar_parts` table with columns: part_id, type (head, skin, eyes, accessories, backgrounds, effects), name, image_url, unlock_requirements (JSONB)
  - [x] Create `user_avatar_parts` table to track unlocked parts with timestamps
  - [x] Create `user_avatars` table to track currently equipped avatar configuration by user_id and part_type
  - [x] Define avatar part categories: Head Shapes/Races, Skin Colors, Facial Features, Accessories, Backgrounds, Special Effects
  - [x] Add avatar selection interface to user profile page (equip parts individually)
  - [x] Display composed avatars in party lobbies and results screens
  - [x] Implement avatar part unlock system through achievements and special events
  - [x] Create default starter parts for all users with premium options

## Early Access Mode — PRD §TBD
- [ ] Feature flag to enable/disable Early Access globally
  - [ ] Add `early_access.enabled` setting in `app_settings` (boolean)
  - [ ] Optional: `early_access.feedback_destination` (e.g., 'table', 'email', 'webhook')
- [ ] Gate paid features while Early Access is ON
  - [ ] Identify and list all paid features/flows
  - [ ] Hide or disable with tooltip explaining Early Access restrictions
  - [ ] Ensure server-side enforcement as well as UI gating
- [ ] Feedback/Report mechanism for early users
  - [ ] Global "Send Feedback" affordance (e.g., toolbar button or floating widget)
  - [ ] Feedback form captures: page URL/route, query/params, party id/code, member id, current step/status, `is_npc`, browser/UA
  - [ ] Include user-provided description and optional screenshot
  - [ ] Create `early_access_feedback` table + RLS for report storage (id, user_id, party_id, route, context JSON, message, created_at)
  - [ ] API endpoint `POST /api/feedback` to accept reports and persist to DB (and optionally forward to webhook)
  - [ ] Admin view to browse/export feedback
- [ ] Acceptance
  - [ ] Toggling Early Access ON disables paid features for all users
  - [ ] Feedback submissions include page context automatically and appear in admin view
  - [ ] When Early Access OFF, full app functionality restored and feedback UI hidden

## Party Morale and Leader Vote Weighting — PRD §9 (new)

- [x] Define and persist Party Morale score per party
- [x] Surface morale indicator in Lobby and Results (Low/Neutral/High) with tooltip
- [x] Implement tie-break behavior per morale:
  - High morale: leader vote counts positively toward chosen option
  - Low morale: leader vote counts negatively (flip in favor of opposing option)
- [x] Expose tunables: MORALE_HIGH_THRESHOLD, MORALE_LOW_THRESHOLD, optional hysteresis
- [x] Integrate morale-based tie-break into motto voting and any future voting events
- [x] Admin panel to configure thresholds/hysteresis

## Non-Functional Requirements — PRD §2
- [x] Responsive across modern desktop/mobile (Next.js app with responsive CSS)
- [x] Secure HTTPS for Supabase calls (supabase-js over HTTPS)
- [x] Intuitive flows; low friction (wizard flows implemented; can iterate further)
- [x] Fast page loads and responsive UI (MVP acceptable; Next 15)
- [x] Handle concurrent voting with data integrity (RLS + realtime + unique constraints in votes)

## Technical Assumptions — PRD §4
- [x] Framework: Next.js; supabase-js in use (friend-party-app/package.json:12-19)
- [ ] Deployment targets: confirm Vercel/Netlify setup
- [x] Auth flow aligns with supabase-js (magic link on landing; useAuth hooks)
- [x] Testing deferred until post-MVP

## Housekeeping
- [ ] Document any deviations from PRD in docs/prd.md Notes or an ADR
- [ ] Keep this TODO in sync with story statuses; check off items as completed