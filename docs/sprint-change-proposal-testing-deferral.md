# Sprint Change Proposal: Deferral of Testing

**Date:** 2025-07-11
**Author:** John (PM)
**Status:** Approved

## 1. Change Summary

This document outlines the decision to defer all unit and integration testing for the "Friend Party" MVP until after the initial public release.

*   **Trigger:** A directive from the project sponsor on 2025-07-11 to accelerate the MVP launch by removing development tasks not directly related to core user-facing functionality.
*   **Issue:** The original plan included comprehensive unit and integration tests as part of the development sprints (documented in `docs/prd.md`, Section 4).
*   **Proposed Path:** Remove all testing-related activities from the current and future epics. The "Testing Requirements" section of the PRD will be updated to reflect this deferral.

## 2. Impact Analysis

### 2.1. Epic & Story Impact

*   **All Epics (1, 2, 3):** The implicit "Definition of Done" for all stories is modified. Stories can now be considered complete without accompanying unit or integration tests. This will reduce the development time for each story.
*   **No Specific Story Changes:** No stories in the current PRD explicitly detail the creation of tests, so no story descriptions need to be rewritten. The impact is on the implementation and acceptance process.

### 2.2. Artifact Impact

*   **`docs/prd.md`:** This is the only artifact directly affected. The "Testing Requirements" section has been updated to reflect the deferral.

## 3. Implemented Changes

The following change has been applied to `docs/prd.md`:

**Section 4: Technical Assumptions**

*   **Previous Content:**
    ```
    #### Testing Requirements: Unit + Integration
    *   **Unit Tests**: All UI components and utility functions should have unit tests to verify their behavior in isolation.
    *   **Integration Tests**: Tests will be created to verify the application's connection and data exchange with the Supabase API, ensuring queries and mutations work as expected.
    ```
*   **New Content:**
    ```
    #### Testing Requirements: Deferred
    *   **Testing Deferral**: Per the project sponsor's directive on 2025-07-11, all unit and integration testing will be deferred until after the initial MVP release.
    *   **Rationale**: This decision was made to accelerate the initial deployment and validate the core product concept with users as quickly as possible.
    *   **Risk**: This introduces a higher risk of bugs and regressions in the initial release. A dedicated testing and stabilization phase will be required post-launch.
    ```

## 4. Risks & Mitigation

*   **Primary Risk:** Increased likelihood of bugs, regressions, and unexpected behavior in the production environment.
*   **Mitigation:** A comprehensive testing and stabilization phase must be planned and executed immediately following the MVP launch before any new features are developed. This will include creating the originally planned unit and integration tests.

## 5. Final Approval

This change has been approved by the project sponsor and is now in effect. All development work will proceed without the requirement for automated testing until further notice.