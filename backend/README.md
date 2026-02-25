# Enterprise Messaging Backend

Fastify + TypeScript + Prisma backend implementing a production-oriented multi-tenant enterprise messaging platform baseline.

## Included

- Multi-tenant domain schema (`orgId` on tenant-scoped entities) via Prisma.
- Org-scoped Prisma data access layer (`orgScopedDal`) that injects `orgId` into every scoped query and blocks cross-tenant where/data overrides.
- Secure auth with Argon2id, short-lived access JWT, HttpOnly refresh-cookie, refresh rotation, and reuse detection.
- Complete auth lifecycle: email verification, password reset, session/device inventory, logout-all, and admin revoke-all sessions.
- Login rate limiting plus account lockout policy after repeated failed attempts.
- MFA with TOTP + backup codes.
- Role-based permissions for org/security/compliance operations.
- Real-time messaging gateway using Socket.IO with optional Redis adapter.
- WebSocket reconnect/resubscribe protocol with server-issued sequence numbers and missed-event resync (`realtime.resync` / `/realtime/events/resync`).
- Presence tracking and typing indicators with server-side rate limiting and conversation membership checks.
- Messaging APIs support edits + edit history, soft delete + audit logs, reactions, threads, mention parsing, cursor pagination, and resync since-cursor.
- Secure file upload flow with signed upload/download URLs scoped to conversation membership.
- Malware scanning pipeline with quarantine → scan verdict → clean release or blocked status, with full audit trail.
- Audit logging model and retention execution endpoint with legal hold awareness.
- Retention job APIs with legal hold enforcement across conversation/user scopes.
- Scoped eDiscovery export tooling (conversation/user/date filters) with role restriction and export event auditing.
- Secure defaults: Helmet, CSP, HSTS, rate limiting, cookie-only refresh handling.

## Setup

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run build
npm test
npm run dev
```

## Threat model summary

- **Tenant isolation:** every query path includes `orgId` and membership checks.
- **Token theft:** refresh rotation + family revocation on replay.
- **Privileged abuse:** RBAC checks and append-only audit records.
- **XSS/CSRF:** strict CSP + HttpOnly refresh cookies.
- **Brute force:** rate limiting and strong password policy baseline.

## E2EE mode

This codebase adds secure baseline mode and E2EE integration points. Full Signal/MLS implementation should be integrated through vetted libraries/services (e.g., libsignal client in frontend and MLS-enabled key service) instead of custom cryptography.

## Runbook notes

- Rotate JWT secrets and KMS keys quarterly.
- Run restore drills monthly and verify RPO/RTO.
- Monitor auth anomaly alerts and token reuse events.
- Keep dependency scanning in CI.
