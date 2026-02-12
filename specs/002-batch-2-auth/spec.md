# Specification: Batch 2 — Auth, Routing, Landing Page, Chat Widget UI

**Feature Branch**: `002-batch-2-auth`
**Status**: Draft

## Goals

- **Public Landing Page**: A high-quality, responsive landing page accessible to all visitors.
- **Authentication**: Secure Signup, Login, and Logout flows using Hosted Supabase Auth.
- **Protected Routing**: Robust middleware to protect private routes (Chat, Admin) while keeping the Landing page public.
- **Chat Widget UI**: A polished, floating chat widget with streaming support, typing indicators, and citations.
- **Admin Skeleton**: Basic structure and role-based protection for admin routes.

## Non-Goals

- Local Supabase Auth (Strictly Hosted).
- Full Admin feature set (only skeleton and guard).
- Backend AI integration (UI mock/streaming handler only).

## User Scenarios & Acceptance Criteria

### User Story 1: Public Landing Page (Priority: P1)

As a visitor, I want to see a professional landing page so that I understand the product value.

**Why this priority**: First impression and entry point for users.

**Acceptance Scenarios**:

1. **Given** a visitor navigates to `/`, **When** the page loads, **Then** they see the Hero section with a "Get Started" CTA.
2. **Given** a visitor is on mobile, **When** they view the page, **Then** the layout adapts (hamburger menu, stacked sections).
3. **Given** a visitor clicks "Login", **Then** they are navigated to `/login`.

### User Story 2: User Authentication (Sign Up & Login) (Priority: P0)

As a user, I want to create an account and log in so that I can access the chatbot.

**Why this priority**: Required for accessing the core value (Chatbot).

**Acceptance Scenarios**:

1. **Given** a new user on `/signup`, **When** they submit valid email/password, **Then** a user is created in Supabase and they are redirected to login/confirm.
2. **Given** an existing user on `/login`, **When** they submit credentials, **Then** they are redirected to the Chat interface (or Landing with Chat open).
3. **Given** an authenticated user, **When** they click "Logout", **Then** their session is cleared and they are redirected to `/`.

### User Story 3: Route Protection (Priority: P0)

As a developer, I want unauthorized users to be blocked from private routes so that data is secure.

**Why this priority**: Security baseline.

**Technical Approach**:

- **SSR/Middleware Protection**: Use Next.js Middleware to check Supabase session.
- **Default Strategy**: Protect all routes by default; whitelist public routes (`/`, `/login`, `/signup`, `/auth/*`).
- **Why**: Prevents protected content visuals/data from flashing on client-side shifts.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user, **When** they try to access `/admin`, **Then** they are redirected to `/login`.
2. **Given** a regular user (non-admin), **When** they try to access `/admin`, **Then** they see a 403 Forbidden or are redirected.

### User Story 4: Chat Widget UI (Priority: P1)

As a logged-in user, I want a floating chat widget so that I can interact with the AI assistant.

**Why this priority**: Core interaction point of the application.

**UI Requirements**:

- Floating Action Button (FAB) in bottom-right.
- Expandable Chat Panel.
- Message Bubbles (User right, Assistant left).
- Typing Indicator (pulsing dots).
- Streaming Text effect.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they click the chat button, **Then** the chat panel opens.
2. **Given** a public visitor, **When** they look for the chat button, **Then** it is NOT visible (or asks to login).
3. **Given** the assistant is "thinking", **When** waiting for response, **Then** a typing indicator is shown.
4. **Given** text is streaming, **When** new tokens arrive, **Then** the message content updates smoothly and auto-scrolls.

## Implementation Requirements

### Functional Requirements

- **FR-001**: System MUST use Hosted Supabase for all Auth operations.
- **FR-002**: Landing page MUST be public.
- **FR-003**: Chat Widget and Admin routes MUST be gated.
- **FR-004**: Chat UI MUST support Markdown rendering (sanitized).
- **FR-005**: Chat UI MUST display citations if provided.

### Technical Risks

- **Session Handling**: Next.js App Router caching can sometimes conflict with dynamic auth states. Strict `dynamic` forcing on layout may be needed.
- **Auth Redirects**: Infinite redirect loops if middleware logic is flawed (e.g., protecting `/login`).

## Verification Plan

### Automated Tests

- **Unit Tests**:
  - `npm test`: Run Jest/Vitest for utility functions (e.g., generic class names, date formatters).
- **Component Tests**:
  - `npm run test:ui`: Test Landing Page renders correctly.
  - Test Chat Widget opens/closes on click.
  - Test Auth forms fire submit events (mocking Supabase).

### Manual Verification

1. **Auth Flow**:
   - Sign up a new user.
   - Verify email (if enabled) or check immediate login.
   - Log out and verify redirection.
2. **Protection**:
   - Try accessing `/admin` incognito. Expect redirect.
3. **UI Polish**:
   - Check mobile responsiveness of Landing Page.
   - Check Chat Widget on mobile (should not cover full screen uncloseable).
