# chatting-app-v2

Repository now contains an enterprise messaging backend foundation in `/backend` and an existing React prototype in `/app`.

## Backend highlights

- Fastify + TypeScript service
- Prisma schema for multi-tenant org/workspace/user/session/conversation/message/audit/file entities
- Argon2id + JWT + refresh rotation auth model with MFA support
- Socket.IO realtime gateway with optional Redis scaling adapter
- Admin endpoints for security and retention workflows

See `backend/README.md` for setup and security notes.
