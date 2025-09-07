# Friend-Party - Product Task List

## Project Metadata
- **Project Name**: Friend-Party - D&D-Style Social Personality Profiling
- **Project ID**: FRIEND-PARTY-001
- **Version**: 2.0
- **Last Updated**: September 5, 2025

---

## Epic 1: Foundation & Party Management
**Goal**: Establish the project foundation and implement the core user flows for creating and joining a party

### Story 1.1: Project Foundation Setup
- [x] Task 1: Create Next.js project with basic dependencies
- [x] Task 2: Install and configure supabase-js client library
- [x] Task 3: Create basic folder structure (components, pages, services, styles)
- [x] Task 4: Configure Supabase connection using environment variables
- [x] Task 5: Ensure application runs locally without errors
- [x] Task 6: Set up TypeScript configuration

### Story 1.2: Landing Page Implementation
- [x] Task 1: Display application name "Friend Party"
- [x] Task 2: Create "Create Party" button prominently
- [x] Task 3: Add input field for 6-letter party code
- [x] Task 4: Implement "Join Party" button with validation
- [x] Task 5: Add code length validation (6 characters)
- [x] Task 6: Handle direct routing for existing members

### Story 1.3: Create Party Flow
- [x] Task 1: Navigate to party creation screen
- [x] Task 2: Create parties record with unique 6-letter code
- [x] Task 3: Set creator as Party Leader and first member
- [x] Task 4: Redirect to Lobby after successful creation
- [x] Task 5: Display party code for sharing
- [x] Task 6: Implement error handling for creation failures

### Story 1.4: Join Party Flow
- [x] Task 1: Implement code lookup in parties table
- [x] Task 2: Prompt for name and add as member
- [x] Task 3: Handle invalid party code errors
- [x] Task 4: Redirect to Lobby after successful join
- [x] Task 5: Add member validation and duplicate prevention
- [x] Task 6: Implement real-time member updates

### Story 1.5: Lobby/Waiting Screen
- [x] Task 1: Display Party Name, Motto, and Code
- [x] Task 2: List all party members with status
- [x] Task 3: Implement real-time updates using Supabase subscriptions
- [x] Task 4: Add member status indicators (Joined, Voting, Finished)
- [x] Task 5: Create responsive lobby layout
- [x] Task 6: Add party management controls

### Story 1.6: Propose Adventurer Names
- [x] Task 1: Create adventurer name proposal interface
- [x] Task 2: Implement name submission for each member
- [x] Task 3: Add real-time display of proposed names
- [x] Task 4: Create voting system for name selection
- [x] Task 5: Implement majority-based name finalization
- [x] Task 6: Add name change and re-voting functionality

---

## Epic 2: Questionnaire Engine
**Goal**: Deliver the core interactive experience with complete questionnaire flow

### Story 2.1: Question Data Model & Seeding
- [x] Task 1: Create questions table in Supabase
- [x] Task 2: Add question type columns (self-assessment, peer-assessment)
- [x] Task 3: Create seed script with 10-15 initial questions
- [x] Task 4: Implement question fetching from database
- [x] Task 5: Add question validation and error handling
- [x] Task 6: Create question management interface

### Story 2.2: Self-Assessment Questionnaire
- [x] Task 1: Create self-assessment question flow
- [x] Task 2: Implement card-based UI for questions
- [x] Task 3: Add answer persistence to answers table
- [x] Task 4: Create progress tracking and navigation
- [x] Task 5: Implement question validation
- [x] Task 6: Add completion flow to peer-assessment

### Story 2.3: Peer-Assessment Questionnaire
- [x] Task 1: Create peer-assessment question flow
- [x] Task 2: Implement member cycling for questions
- [x] Task 3: Add answer persistence with voter/subject links
- [x] Task 4: Create progress tracking for all members
- [x] Task 5: Implement question validation
- [x] Task 6: Add completion flow back to lobby

### Story 2.4: Update Lobby with Voting Status
- [x] Task 1: Add status field to party_members table
- [x] Task 2: Update status to 'Finished' after completion
- [x] Task 3: Display status in lobby with real-time updates
- [x] Task 4: Add status indicators and progress tracking
- [x] Task 5: Implement auto-navigation to results
- [x] Task 6: Add status validation and error handling

### Story 2.5: Propose and Vote on Party Motto
- [x] Task 1: Create motto proposal interface
- [x] Task 2: Implement motto submission system
- [x] Task 3: Add voting system for mottos
- [x] Task 4: Implement auto-finalization on majority
- [x] Task 5: Add morale-based tie-breaking
- [x] Task 6: Display selected motto in lobby and results

### Story 2.6: Add and Assess Hirelings
- [x] Task 1: Create hireling addition interface
- [x] Task 2: Implement hireling conversion voting
- [x] Task 3: Add hireling indicators in UI
- [x] Task 4: Include hirelings in peer assessment
- [x] Task 5: Implement neutral baseline for hirelings
- [x] Task 6: Add hireling management controls

---

## Epic 3: Big Reveal & Results
**Goal**: Deliver the final, shareable payoff with calculated results and character sheets

### Story 3.1: Results Calculation Logic
- [x] Task 1: Create results calculation algorithm
- [x] Task 2: Implement stat aggregation from answers
- [x] Task 3: Add D&D-style stat calculation
- [x] Task 4: Implement class assignment based on stats
- [x] Task 5: Add results persistence to database
- [x] Task 6: Create tunable parameters for calculation

### Story 3.2: Automatic Results Trigger
- [x] Task 1: Detect when all members are 'Finished'
- [x] Task 2: Trigger results calculation automatically
- [x] Task 3: Update party status to 'ResultsReady'
- [x] Task 4: Implement auto-navigation to results
- [x] Task 5: Add real-time status broadcasting
- [x] Task 6: Create error handling for calculation failures

### Story 3.3: Results Display Screen
- [x] Task 1: Create results screen layout
- [x] Task 2: Display character sheets for all members
- [x] Task 3: Show D&D class and stats clearly
- [x] Task 4: Add visual character sheet design
- [x] Task 5: Implement responsive results layout
- [x] Task 6: Add party motto display

### Story 3.4: Share Results
- [x] Task 1: Create share button functionality
- [x] Task 2: Generate unique public URL for results
- [x] Task 3: Implement clipboard copy functionality
- [x] Task 4: Create read-only results view
- [x] Task 5: Add sharing analytics tracking
- [x] Task 6: Implement social media sharing

### Story 3.5: Display EXP on Profiles
- [x] Task 1: Calculate EXP for each user
- [x] Task 2: Display EXP on character sheets
- [x] Task 3: Add EXP calculation logic
- [x] Task 4: Implement EXP persistence
- [x] Task 5: Create EXP display components
- [x] Task 6: Add EXP tracking and analytics

---

## Epic 4: UI Modernization & Polish
**Goal**: Transform the application's visual design into a modern, polished experience

### Story 4.1: Modern UI Implementation
- [x] Task 1: Update color palette and typography
- [x] Task 2: Redesign UI components with modern style
- [x] Task 3: Add micro-interactions and animations
- [x] Task 4: Refine layouts for better hierarchy
- [x] Task 5: Implement responsive design improvements
- [x] Task 6: Add accessibility enhancements

### Story 4.2: Discord Login Option
- [ ] Task 1: Add "Login with Discord" button
- [ ] Task 2: Implement Supabase OAuth for Discord
- [ ] Task 3: Handle new user creation
- [ ] Task 4: Capture Discord username and avatar
- [ ] Task 5: Integrate Discord data with user profiles
- [ ] Task 6: Add Discord-specific features

### Story 4.3: Achievement System
- [x] Task 1: Create achievements table structure
- [x] Task 2: Implement user_achievements tracking
- [x] Task 3: Define achievement categories
- [x] Task 4: Add achievement display to profiles
- [x] Task 5: Implement achievement notifications
- [x] Task 6: Create automatic achievement awarding

### Story 4.4: Avatar System
- [x] Task 1: Create avatar_parts table structure
- [x] Task 2: Implement user_avatar_parts tracking
- [x] Task 3: Define avatar part categories
- [x] Task 4: Add avatar selection interface
- [x] Task 5: Display avatars in lobbies and results
- [x] Task 6: Implement avatar unlock system

### Story 4.5: Dragon's Hoard Minigame
- [ ] Task 1: Create minigame interface
- [ ] Task 2: Implement treasure collection mechanic
- [ ] Task 3: Design reward system integration
- [ ] Task 4: Create responsive minigame UI
- [ ] Task 5: Implement progress saving
- [ ] Task 6: Add multiple difficulty levels

### Story 4.6: Changeling Minigame
- [ ] Task 1: Create minigame interface
- [ ] Task 2: Implement friend knowledge testing
- [ ] Task 3: Create scoring system
- [ ] Task 4: Integrate with questionnaire data
- [ ] Task 5: Design intuitive interface
- [ ] Task 6: Add social competitive features

---

## Epic 5: Early Access Mode
**Goal**: Implement controlled early access system with feedback collection

### Story 5.1: Early Access Feature Flag System
- [ ] Task 1: Add early_access.enabled setting
- [ ] Task 2: Implement global feature flag system
- [ ] Task 3: Add feedback destination configuration
- [ ] Task 4: Create settings management interface
- [ ] Task 5: Implement flag validation
- [ ] Task 6: Add flag change notifications

### Story 5.2: Premium Feature Gating
- [ ] Task 1: Identify and catalog premium features
- [ ] Task 2: Implement UI gating with tooltips
- [ ] Task 3: Add server-side enforcement
- [ ] Task 4: Create early access messaging
- [ ] Task 5: Implement feature restriction logic
- [ ] Task 6: Add gating analytics

### Story 5.3: User Feedback Collection System
- [ ] Task 1: Create global feedback affordance
- [ ] Task 2: Implement feedback form with context capture
- [ ] Task 3: Add screenshot attachment capability
- [ ] Task 4: Create early_access_feedback table
- [ ] Task 5: Implement feedback API endpoint
- [ ] Task 6: Add admin feedback interface

### Story 5.4: Early Access Mode Management
- [ ] Task 1: Implement early access toggle
- [ ] Task 2: Add feedback destination configuration
- [ ] Task 3: Create admin controls interface
- [ ] Task 4: Implement status indicators
- [ ] Task 5: Add mode change notifications
- [ ] Task 6: Create access management analytics

### Story 5.5: Test Coverage Improvements
- [ ] Task 1: Achieve 40% overall test coverage
- [ ] Task 2: Add avatar system test coverage
- [ ] Task 3: Add achievement system test coverage
- [ ] Task 4: Add minigame integration tests
- [ ] Task 5: Add component tests for major UI
- [ ] Task 6: Add API tests for all endpoints

---

## Epic 6: Party Morale System
**Goal**: Implement party morale tracking and leader vote weighting

### Story 6.1: Party Morale Implementation
- [x] Task 1: Define and persist Party Morale score
- [x] Task 2: Surface morale indicator in Lobby and Results
- [x] Task 3: Implement morale-based tie-breaking
- [x] Task 4: Add morale thresholds and tuning
- [x] Task 5: Integrate morale into voting events
- [x] Task 6: Create admin panel for morale configuration

---

## Notes
- Use `- [ ]` for incomplete tasks, `- [x]` for completed tasks
- Keep tasks directly under the Story they belong to
- Match Story IDs (`Story 1.1`, etc.) with the PRD for easy alignment
- Update frequently to keep the Task List and PRD in sync

