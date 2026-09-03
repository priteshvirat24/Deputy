ALTER TABLE "audit_events" ADD COLUMN IF NOT EXISTS "previous_event_hash" varchar(64);
ALTER TABLE "audit_events" ADD COLUMN IF NOT EXISTS "event_hash" varchar(64);
CREATE INDEX IF NOT EXISTS "audit_events_hash_idx" ON "audit_events" ("event_hash");
