# Workflow Plan: Friend Party (UI-Focused)

<!-- WORKFLOW-PLAN-META
workflow-id: greenfield-ui-supabase
status: active
created: 2025-07-11T13:42:00Z
updated: 2025-07-11T13:42:00Z
version: 1.0
-->

**Created Date**: July 11, 2025
**Project**: Friend Party
**Type**: Greenfield (UI-Focused with Existing Backend)
**Status**: Active
**Estimated Planning Duration**: 1-2 hours

## Objective

To rapidly design, develop, and deploy the user interface for the "Friend Party" application. The application will be a single-page web app that connects to an existing Supabase backend for all data operations, including managing parties, adventurers, and their stats.

## Selected Workflow

**Workflow**: `greenfield-ui` (customized for Supabase)
**Reason**: This workflow is ideal for projects where the primary focus is on the user experience and interface, while leveraging an existing backend-as-a-service like Supabase. It prioritizes UI/UX design and frontend architecture.

## Workflow Steps

### Planning Phase (Web UI)

- [ ] **Step 1: Define Product Requirements** <!-- step-id: 1.1, agent: pm, task: create-doc -->
  - **Agent**: PM (Product Manager)
  - **Action**: Create a Product Requirements Document (PRD) focusing on user flows, features, and the data models needed for Supabase. This will define the "what" of the application.
  - **Output**: `docs/prd.md`
  - **User Input**: Your vision for features and user journeys.

- [ ] **Step 2: Design User Experience & Interface** <!-- step-id: 1.2, agent: ux-expert, task: create-doc -->
  - **Agent**: UX Expert
  - **Action**: Create a UI/UX Specification document with wireframes, user flow diagrams, and visual design concepts. This will define the "look and feel."
  - **Output**: `docs/ux-spec.md`
  - **User Input**: Feedback on design mockups and user experience.

- [ ] **Step 3: Plan Frontend Architecture** <!-- step-id: 1.3, agent: architect, task: create-doc -->
  - **Agent**: Architect
  - **Action**: Create an Architecture Document detailing the frontend technology stack (e.g., React, Vue), component structure, state management, and the precise API contract for interacting with Supabase. This defines "how" the frontend is built and communicates with the backend.
  - **Output**: `docs/architecture.md`
  - **Decision Point**: Finalize the frontend technology stack. <!-- decision-id: D1 -->

### Development Phase (IDE)

- [ ] **Step 4: Document Sharding** <!-- step-id: 2.1, agent: po, task: shard-doc -->
  - **Action**: Break down the PRD and Architecture documents into smaller, actionable pieces (Epics and Stories) for development.

- [ ] **Step 5: Story Development Cycle** <!-- step-id: 2.2, repeats: true -->
  - **Action**: Implement the application one story at a time in a loop.
  - [ ] Create story (`sm` agent)
  - [ ] Implement story (`dev` agent)
  - [ ] Review story (`qa` agent)
  - [ ] Repeat for all stories

## Key Decision Points

1.  **Frontend Technology Stack** (Step 3): <!-- decision-id: D1, status: pending -->
    -   **Trigger**: Before starting frontend architecture.
    -   **Options**: React, Vue, Svelte, Angular, etc.
    -   **Impact**: This choice will influence the entire development process, including component libraries and hiring decisions.
    -   **Decision Made**: _Pending_

## Expected Outputs

### Planning Documents
- [ ] `docs/prd.md` - Product Requirements Document
- [ ] `docs/ux-spec.md` - UI/UX Specification
- [ ] `docs/architecture.md` - Frontend Architecture Document

### Development Artifacts
- [ ] Stories in `docs/stories/`
- [ ] Source code for the web application
- [ ] Unit and integration tests
- [ ] Deployment scripts

## Next Steps

1.  Review this plan to ensure it aligns with your vision.
2.  We will begin with **Step 1: Define Product Requirements**. This involves switching to the **PM (Product Manager)** agent to create the PRD.
