-- Lowers the photo buckets' size cap from 5 MB (20260730092236_storage_buckets.sql) to
-- 500 KB, matching MAX_PHOTO_SIZE_BYTES in src/constants/storage.ts. The client now
-- compresses photos to fit before upload (PhotoUpload.tsx), but the bucket limit is the
-- real boundary (architecture.md §18: Storage Security) — it must reject an oversized
-- file even if a client skips or fails compression, not just rely on the browser.

update storage.buckets
set file_size_limit = 512000
where id in ('group-photos', 'student-photos');
