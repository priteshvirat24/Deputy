-- DEPUTY Initial PostgreSQL Foundation Migration
-- Generated for Prompt 1

CREATE TABLE IF NOT EXISTS "actors" (
  "id" varchar(128) PRIMARY KEY,
  "email" varchar(255),
  "role" varchar(64) NOT NULL,
  "type" varchar(32) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "demonstrations" (
  "id" varchar(128) PRIMARY KEY,
  "session_id" varchar(128) NOT NULL,
  "actor_id" varchar(128) NOT NULL,
  "started_at" timestamp with time zone NOT NULL,
  "completed_at" timestamp with time zone,
  "status" varchar(32) NOT NULL,
  "application_context" jsonb NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "demonstrations_session_idx" ON "demonstrations" ("session_id");
CREATE INDEX IF NOT EXISTS "demonstrations_actor_idx" ON "demonstrations" ("actor_id");

CREATE TABLE IF NOT EXISTS "demonstration_actions" (
  "id" varchar(128) PRIMARY KEY,
  "demonstration_id" varchar(128) NOT NULL REFERENCES "demonstrations"("id") ON DELETE CASCADE,
  "action_type" varchar(128) NOT NULL,
  "action_version" integer NOT NULL,
  "arguments" jsonb NOT NULL,
  "actor" jsonb NOT NULL,
  "timestamp" timestamp with time zone NOT NULL,
  "session_id" varchar(128) NOT NULL,
  "result" jsonb,
  "side_effects" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "reversibility" varchar(32) NOT NULL,
  "provenance" jsonb NOT NULL,
  "correlation_id" varchar(128) NOT NULL,
  "order_index" integer NOT NULL
);

CREATE INDEX IF NOT EXISTS "demo_actions_demo_idx" ON "demonstration_actions" ("demonstration_id");
CREATE INDEX IF NOT EXISTS "demo_actions_type_idx" ON "demonstration_actions" ("action_type");

CREATE TABLE IF NOT EXISTS "learned_tools" (
  "id" varchar(128) PRIMARY KEY,
  "name" varchar(128) NOT NULL UNIQUE,
  "description" text NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "input_schema" jsonb NOT NULL,
  "execution_binding" jsonb NOT NULL,
  "source_demonstrations" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "demonstration_count" integer DEFAULT 0 NOT NULL,
  "parameter_provenance" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "reversibility" varchar(32) NOT NULL,
  "risk_level" varchar(32) NOT NULL,
  "approval_policy" jsonb NOT NULL,
  "status" varchar(32) NOT NULL,
  "creator_id" varchar(128) NOT NULL,
  "creator_role" varchar(64) NOT NULL,
  "provenance" jsonb NOT NULL,
  "origin_restrictions" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "learned_tools_status_idx" ON "learned_tools" ("status");
CREATE INDEX IF NOT EXISTS "learned_tools_risk_idx" ON "learned_tools" ("risk_level");

CREATE TABLE IF NOT EXISTS "learned_tool_versions" (
  "id" varchar(128) PRIMARY KEY,
  "tool_id" varchar(128) NOT NULL REFERENCES "learned_tools"("id") ON DELETE CASCADE,
  "version" integer NOT NULL,
  "definition" jsonb NOT NULL,
  "changelog" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "tool_versions_tool_id_ver_idx" ON "learned_tool_versions" ("tool_id", "version");

CREATE TABLE IF NOT EXISTS "tool_proposals" (
  "id" varchar(128) PRIMARY KEY,
  "tool_id" varchar(128) NOT NULL,
  "tool_version" integer NOT NULL,
  "arguments" jsonb NOT NULL,
  "request_id" varchar(128) NOT NULL,
  "proposed_by" jsonb NOT NULL,
  "timestamp" timestamp with time zone NOT NULL,
  "context" jsonb
);

CREATE INDEX IF NOT EXISTS "tool_proposals_request_idx" ON "tool_proposals" ("request_id");

CREATE TABLE IF NOT EXISTS "authorizations" (
  "id" varchar(128) PRIMARY KEY,
  "request_id" varchar(128) NOT NULL,
  "tool_id" varchar(128) NOT NULL,
  "tool_version" integer NOT NULL,
  "argument_digest" varchar(64) NOT NULL,
  "authorization_method" varchar(64) NOT NULL,
  "actor" jsonb NOT NULL,
  "issued_at" timestamp with time zone NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "nonce" varchar(128) NOT NULL UNIQUE,
  "status" varchar(32) NOT NULL,
  "credential_reference" varchar(255),
  "revoked_at" timestamp with time zone,
  "revocation_reason" text
);

CREATE INDEX IF NOT EXISTS "authorizations_req_idx" ON "authorizations" ("request_id");
CREATE INDEX IF NOT EXISTS "authorizations_digest_idx" ON "authorizations" ("argument_digest");
CREATE INDEX IF NOT EXISTS "authorizations_status_idx" ON "authorizations" ("status");

CREATE TABLE IF NOT EXISTS "audit_events" (
  "id" varchar(128) PRIMARY KEY,
  "timestamp" timestamp with time zone NOT NULL,
  "event_type" varchar(64) NOT NULL,
  "actor" jsonb NOT NULL,
  "session_id" varchar(128),
  "request_id" varchar(128),
  "tool_id" varchar(128),
  "tool_version" integer,
  "status" varchar(32) NOT NULL,
  "reason" text,
  "provenance" jsonb,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS "audit_events_time_idx" ON "audit_events" ("timestamp");
CREATE INDEX IF NOT EXISTS "audit_events_type_idx" ON "audit_events" ("event_type");
CREATE INDEX IF NOT EXISTS "audit_events_tool_idx" ON "audit_events" ("tool_id");
