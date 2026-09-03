-- Migration: 0001_webauthn_credentials.sql
-- Create webauthn_credentials table and update authorizations table

CREATE TABLE IF NOT EXISTS "webauthn_credentials" (
  "id" varchar(128) PRIMARY KEY,
  "actor_id" varchar(128) NOT NULL,
  "credential_id" varchar(512) NOT NULL UNIQUE,
  "public_key" text NOT NULL,
  "counter" integer NOT NULL DEFAULT 0,
  "transports" jsonb,
  "aaguid" varchar(128),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "last_used_at" timestamp with time zone,
  "revoked_at" timestamp with time zone
);

CREATE INDEX IF NOT EXISTS "webauthn_actor_idx" ON "webauthn_credentials" ("actor_id");
CREATE UNIQUE INDEX IF NOT EXISTS "webauthn_cred_idx" ON "webauthn_credentials" ("credential_id");

ALTER TABLE "authorizations"
  ADD COLUMN IF NOT EXISTS "webauthn_assertion" jsonb,
  ADD COLUMN IF NOT EXISTS "consumed_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "consumed_by_proposal_id" varchar(128);
