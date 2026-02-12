# Analysis Report: Batch 2 — Auth, Routing, Landing Page, Chat Widget UI

## Summary of Intent

Batch 2 establishes the user-facing foundation for CSEC Nexus. It focuses on the public entry point (Landing Page), secure access control (Hosted Supabase Auth + Middleware), and the interactive interface for the core feature (Chat Widget UI). The primary goal is to provide a premium, cohesive experience that gates protected features while maintaining a professional public presence for the recruitment contest.

## Gaps / Missing Requirements

- **Password Reset Flow**: Standard auth procedures usually include "Forgot Password." Currently, this is missing from the spec and implementation tasks.
- **Account Verification UX**: While signup is implemented, there is no explicit handling for users who attempt to log in but haven't verified their email (if required by Supabase).
- **Citation Data Structure**: The spec mentions citations but doesn't define the object schema (e.g., `id`, `source`, `snippet`, `page`). This should be standardized before Batch 4 (AI integration).
- **Admin Onboarding**: The "Admin Skeleton" exists, but the process for assigning the `admin` role to a user is not documented (likely required via Supabase dashboard).

## Ambiguities

- **Chat Widget Visibility**: story 4 says widget is "NOT visible (or asks to login)" for guests. User feedback already caused us to show it to guests with a "login required" state. The spec should be updated to align with current implementation.
- **Auth Page Redirection**: Confirmation of whether signup should auto-login or redirect to a "check your email" screen.

## Risks

- **Middleware Redirect Loops**: Complexity in `middleware.ts` (handling refreshed sessions + route guards) can lead to infinite loops if root and auth paths aren't carefully excluded.
- **Client-Side Sanitization**: Reliance on `react-markdown` defaults for security. A dedicated sanitization library (like `dompurify`) should be considered if the assistant starts returning complex HTML/Markdown.
- **Rate Limit Bypass**: The current rate limiting is purely UI-based and can be bypassed by a technically savvy user.

## Dependency / Order Check

- **Supabase Connectivity**: High (Completed).
- **Auth UI -> Protected Routes**: High (Completed).
- **Chat Widget -> Backend Integration**: High (Batch 4 dependency).

## Scope Creep / Over-Engineering Flags

- **Analytics Hooks**: Mentioned in `tasks.md` but potentially unnecessary for a recruitment contest entry unless explicitly requested.
- **Role Guard Utility**: Might be pre-mature if there is only one user role needed right now (standard vs authorized).

## Concrete Fixes

- **[MODIFY] [spec.md](file:///home/dawa/Documents/CSEC/specs/002-batch-2-auth/spec.md)**
  - Update User Story 4: Explicitly state that the Chat Widget is visible to guest visitors but interaction is gated by auth.
  - Define Citation Schema: Add a technical section defining the expected JSON structure for RAG citations.
- **[MODIFY] [tasks.md](file:///home/dawa/Documents/CSEC/specs/002-batch-2-auth/tasks.md)**
  - Add task: "Implement Forgot Password flow."
  - Add task: "Refine unverified email login bridge."

Next recommended command: `/speckit.clarify`
