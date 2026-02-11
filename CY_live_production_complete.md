# CY Live — Production Integration Summary

This document summarizes the CY Live production integration (SWANI 3 merge), architecture, DB schema, API surface, RTMP fan‑out, encryption guidance, and deployment quickstart.

Key features

- Gold Board Grid UI with host pinned top-left and gold border always visible.
- Zero platform fee on donations/tips — direct external payment links (PayPal, Cash App, Venmo, Zelle, Chime).
- Cross‑platform RTMP fan‑out (Instagram, TikTok, Facebook, YouTube) using user-supplied stream keys (encrypted at rest).
- MediaSoup SFU + Socket.io signaling for guest management (up to 20 guests supported with horizontal scaling).
- SWANI AI moderation + LLM integrations for chat moderation and metadata.

Database and encryption

- Use Postgres for primary store. Stream keys must be encrypted at rest using application AES‑GCM envelope encryption or KMS/Vault.
- See `prisma/cy_schema.prisma` for the Prisma models matching the required production schema.

Backend API (high level)

- Auth: JWT + bcrypt password hashing.
- User endpoints: register, login, get public profile (no stream keys), update profile (encrypt stream keys server-side).
- Streams: create, start (spawn fan‑out), end (stop fan‑out), list, details.
- Realtime: Socket.io for viewer counts, chat, and MediaSoup signaling.

RTMP fan‑out

- Server decrypts stream keys briefly in memory, starts an `ffmpeg` or relay worker to push to each enabled destination.
- Recommend worker pool or managed relay for production to avoid CPU bottlenecks.
- Never expose decrypted keys to clients or logs. Rotate keys via KMS.

Front end

- `GoldBoardGrid` (host pinned, vertical scroll) and `HostTile` (gold border). Payment buttons open external links and present copy/QR fallback for Zelle/Chime.

Deployment

- Containerized services: `db` (Postgres), `backend`, `frontend`, `mediasoup` SFU, `ffmpeg-relay` worker nodes.
- Use KMS or Vault for `ENCRYPTION_KEY` in production.
- Quickstart and sample `docker compose` commands in `quickstart.md`.

Testing & QA

- Verify encryption/decryption cycle, fan‑out to test RTMP endpoints, host tile behavior across viewports, and that payment buttons open external destinations.

Files added in this commit

- `prisma/cy_schema.prisma` — Prisma models for Users, Categories, Streams.
- `server/cy_live_scaffold.ts` — backend scaffold with encryption helpers and endpoint stubs.
- `src/components/GoldBoardGrid.tsx` — frontend grid component.
- `src/components/HostTile.tsx` — host tile component with gold border.
- `CY_live_production_complete.md` (this file) and `quickstart.md`.

Next steps

- Wire these scaffolds into `server/index.ts`, implement Prisma client usage, and add MediaSoup + ffmpeg worker orchestration.
