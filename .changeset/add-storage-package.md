---
"@mikstack/storage": minor
"create-mikstack": minor
---

Add @mikstack/storage package for S3-compatible file storage with Drizzle metadata tracking. Includes S3 client abstraction (AWS S3, Cloudflare R2, MinIO), file metadata schema, server-side helpers (createUpload, presigned URLs, deleteFile), and SvelteKit API route handler. Updates create-mikstack scaffolder with MinIO docker-compose service, S3 env vars, storage initialization, and file attachments on notes (presigned URL upload flow demo).
