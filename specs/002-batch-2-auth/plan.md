# Implementation Plan - Batch 2 — Auth, Routing, Landing Page, Chat Widget UI

The goal of this batch is to implement the core user-facing structure of the application: a public landing page, secure authentication flows using Hosted Supabase, protected routes for the app/admin, and the initial UI for the chat widget.

## User Review Required

> [!IMPORTANT]
> **Hosted Supabase Only**: No local Supabase triggers/functions/RLS will be developed in this batch. All auth logic relies on the hosted instance.
> **Mocking**: The Chat Widget will be UI-only with mocked streaming responses until the backend agent is integrated in Batch 4.

## Proposed Changes

### 1. Authentication & Routing Foundation

#### [NEW] [auth-pages]

- Create `/login/page.tsx`: Standard login form (email/password).
- Create `/signup/page.tsx`: Standard signup form.
- Create `/auth/callback/route.ts`: Handle Supabase auth code exchange.
- **Validation**: Verify users can sign up (check Supabase dashboard) and log in.

#### [NEW] [middleware-protection]

- Create `middleware.ts`:
  - Implement `updateSession` utility to refresh auth tokens.
  - Define `protectedRoutes` (start with `['/chat', '/admin']`).
  - Redirect unauthenticated users to `/login`.
  - Redirect authenticated users away from `/login` & `/signup` to `/chat`.

### 2. Landing Page Implementation

#### [NEW] [landing-page]

- Create `/page.tsx` (Root):
  - **Hero Section**: Headline, Subheadline, "Get Started" CTA (links to `/signup` or `/chat` depending on auth state).
  - **Features Section**: 3-column grid highlighting RAG capabilities.
  - **Footer**: Simple copyright and links.
- **Responsive Design**: Ensure mobile hamburger menu (if needed) or stacked layout works on `<768px`.

### 3. Chat Widget UI

#### [NEW] [chat-components]

- Create `components/chat/chat-widget.tsx`:
  - **Floating Action Button (FAB)**: Bottom-right fixed position. Toggles chat window.
  - **Chat Window**:
    - **Header**: "AI Assistant" title + Close button.
    - **Message List**: Scrollable area for `MessageBubble` components.
    - **Input Area**: Textarea (auto-resizing) + Send button.
- Create `components/chat/message-bubble.tsx`:
  - Support `user` vs `assistant` styling.
  - **Markdown Support**: Use `react-markdown` (or similar simple renderer) for assistant text.
- Create `components/chat/typing-indicator.tsx`: Simple 3-dot pulse animation.

#### [NEW] [chat-ux]

- **Streaming Mock**: Implement a utility `simulateStream(text, callback)` to progressively reveal text in the UI to test the "streaming" effect without a real backend.
- **Citations Placeholder**: Add a visual "Sources" accordion below assistant messages.

### 4. Admin Guard & Shell

#### [NEW] [admin-route]

- Create `/admin/layout.tsx`:
  - **Role Check**: In `useEffect` or server component, check if `user.role === 'admin'`. (Note: If using `app_metadata`, this might need a Supabase Edge Function to set, so for now we might just check a specific email or simplistic hardcoded check if roles aren't set up yet. _Refinement: We will assume standard authenticated access for now and just check for a valid session, adding specific role logic if the `profiles` table is ready._)
  - **Sidebar**: Navigation for "Documents", "Settings".
- Create `/admin/page.tsx`: Simple dashboard welcome.

### 5. Final UX Polish

- **Accessibility**: Add `aria-label` to Chat FAB. Ensure Focus Trap in Chat Window if it's a modal (or ensure reasonable tab order).
- **Responsive**: Verify Chat Window doesn't overflow on mobile screens; switch to full-screen mode on very small devices.

## Verification Plan

### Automated Tests

- **Unit Tests**:
  - Test `simulateStream` utility works as expected.
  - Test `cn` (classname) utility if created.
- **Component Tests** (`npm run test:ui`):
  - `LandingPage`: Renders Hero and CTA.
  - `ChatWidget`: Opens on click, shows input.

### Manual Verification Checklist

1. **Auth**:
   - [ ] Sign Up triggers confirmation email (or auto-confirms if dev mode).
   - [ ] Log In redirects to `/chat` (or intended protected route).
   - [ ] Log Out redirects to Landing Page.
2. **Routing**:
   - [ ] Access `/admin` without login -> Redirects to `/login`.
   - [ ] Access `/chat` without login -> Redirects to `/login`.
3. **UX Checklist**:
   - [ ] Chat FAB floats above content.
   - [ ] Clicking FAB opens window; clicking Close hides it.
   - [ ] "Sending" a message shows User bubble immediately.
   - [ ] Assistant response "streams" in character-by-character.
   - [ ] Typing indicator appears before response starts.
   - [ ] Citations accordion expands/collapses.
