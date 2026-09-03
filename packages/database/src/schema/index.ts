import {
  pgTable,
  varchar,
  text,
  integer,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

export const actors = pgTable('actors', {
  id: varchar('id', { length: 128 }).primaryKey(),
  email: varchar('email', { length: 255 }),
  role: varchar('role', { length: 64 }).notNull(),
  type: varchar('type', { length: 32 }).notNull(), // 'HUMAN', 'AGENT', 'SYSTEM'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const demonstrations = pgTable(
  'demonstrations',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    sessionId: varchar('session_id', { length: 128 }).notNull(),
    actorId: varchar('actor_id', { length: 128 }).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    status: varchar('status', { length: 32 }).notNull(), // 'RECORDING', 'COMPLETED', 'DISCARDED'
    applicationContext: jsonb('application_context').notNull(),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => [
    index('demonstrations_session_idx').on(table.sessionId),
    index('demonstrations_actor_idx').on(table.actorId),
  ],
);

export const demonstrationActions = pgTable(
  'demonstration_actions',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    demonstrationId: varchar('demonstration_id', { length: 128 })
      .notNull()
      .references(() => demonstrations.id, { onDelete: 'cascade' }),
    actionType: varchar('action_type', { length: 128 }).notNull(),
    actionVersion: integer('action_version').notNull(),
    arguments: jsonb('arguments').notNull(),
    actor: jsonb('actor').notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    sessionId: varchar('session_id', { length: 128 }).notNull(),
    result: jsonb('result'),
    sideEffects: jsonb('side_effects').notNull().default([]),
    reversibility: varchar('reversibility', { length: 32 }).notNull(),
    provenance: jsonb('provenance').notNull(),
    correlationId: varchar('correlation_id', { length: 128 }).notNull(),
    orderIndex: integer('order_index').notNull(),
  },
  table => [
    index('demo_actions_demo_idx').on(table.demonstrationId),
    index('demo_actions_type_idx').on(table.actionType),
  ],
);

export const learnedTools = pgTable(
  'learned_tools',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    name: varchar('name', { length: 128 }).notNull().unique(),
    description: text('description').notNull(),
    version: integer('version').notNull().default(1),
    inputSchema: jsonb('input_schema').notNull(),
    executionBinding: jsonb('execution_binding').notNull(),
    sourceDemonstrations: jsonb('source_demonstrations').notNull().default([]),
    demonstrationCount: integer('demonstration_count').notNull().default(0),
    parameterProvenance: jsonb('parameter_provenance').notNull().default({}),
    reversibility: varchar('reversibility', { length: 32 }).notNull(),
    riskLevel: varchar('risk_level', { length: 32 }).notNull(),
    approvalPolicy: jsonb('approval_policy').notNull(),
    status: varchar('status', { length: 32 }).notNull(), // 'DRAFT', 'VALIDATING', 'REGISTERED', 'ACTIVE', 'DISABLED', 'RETIRED', 'DELETED'
    creatorId: varchar('creator_id', { length: 128 }).notNull(),
    creatorRole: varchar('creator_role', { length: 64 }).notNull(),
    provenance: jsonb('provenance').notNull(),
    originRestrictions: jsonb('origin_restrictions').notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => [
    index('learned_tools_status_idx').on(table.status),
    index('learned_tools_risk_idx').on(table.riskLevel),
  ],
);

export const learnedToolVersions = pgTable(
  'learned_tool_versions',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    toolId: varchar('tool_id', { length: 128 })
      .notNull()
      .references(() => learnedTools.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    definition: jsonb('definition').notNull(),
    changelog: text('changelog'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => [uniqueIndex('tool_versions_tool_id_ver_idx').on(table.toolId, table.version)],
);

export const toolProposals = pgTable(
  'tool_proposals',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    toolId: varchar('tool_id', { length: 128 }).notNull(),
    toolVersion: integer('tool_version').notNull(),
    arguments: jsonb('arguments').notNull(),
    requestId: varchar('request_id', { length: 128 }).notNull(),
    proposedBy: jsonb('proposed_by').notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    context: jsonb('context'),
  },
  table => [index('tool_proposals_request_idx').on(table.requestId)],
);

export const authorizations = pgTable(
  'authorizations',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    requestId: varchar('request_id', { length: 128 }).notNull(),
    toolId: varchar('tool_id', { length: 128 }).notNull(),
    toolVersion: integer('tool_version').notNull(),
    argumentDigest: varchar('argument_digest', { length: 64 }).notNull(),
    authorizationMethod: varchar('authorization_method', { length: 64 }).notNull(),
    actor: jsonb('actor').notNull(),
    issuedAt: timestamp('issued_at', { withTimezone: true }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    nonce: varchar('nonce', { length: 128 }).notNull().unique(),
    status: varchar('status', { length: 32 }).notNull(), // 'PENDING', 'AUTHORIZED', 'CONSUMED', 'REJECTED', 'EXPIRED', 'REVOKED'
    webauthnAssertion: jsonb('webauthn_assertion'),
    credentialReference: varchar('credential_reference', { length: 255 }),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    consumedByProposalId: varchar('consumed_by_proposal_id', { length: 128 }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    revocationReason: text('revocation_reason'),
  },
  table => [
    index('authorizations_req_idx').on(table.requestId),
    index('authorizations_digest_idx').on(table.argumentDigest),
    index('authorizations_status_idx').on(table.status),
  ],
);

export const webauthnCredentials = pgTable(
  'webauthn_credentials',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    actorId: varchar('actor_id', { length: 128 }).notNull(),
    credentialId: varchar('credential_id', { length: 512 }).notNull().unique(),
    publicKey: text('public_key').notNull(),
    counter: integer('counter').notNull().default(0),
    transports: jsonb('transports'),
    aaguid: varchar('aaguid', { length: 128 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  table => [
    index('webauthn_actor_idx').on(table.actorId),
    uniqueIndex('webauthn_cred_idx').on(table.credentialId),
  ],
);

export const auditEvents = pgTable(
  'audit_events',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    eventType: varchar('event_type', { length: 64 }).notNull(),
    actor: jsonb('actor').notNull(),
    sessionId: varchar('session_id', { length: 128 }),
    requestId: varchar('request_id', { length: 128 }),
    toolId: varchar('tool_id', { length: 128 }),
    toolVersion: integer('tool_version'),
    status: varchar('status', { length: 32 }).notNull(), // 'SUCCESS', 'FAILURE', 'INFO'
    reason: text('reason'),
    provenance: jsonb('provenance'),
    metadata: jsonb('metadata').notNull().default({}),
    previousEventHash: varchar('previous_event_hash', { length: 64 }),
    eventHash: varchar('event_hash', { length: 64 }),
  },
  table => [
    index('audit_events_time_idx').on(table.timestamp),
    index('audit_events_type_idx').on(table.eventType),
    index('audit_events_tool_idx').on(table.toolId),
    index('audit_events_hash_idx').on(table.eventHash),
  ],
);
