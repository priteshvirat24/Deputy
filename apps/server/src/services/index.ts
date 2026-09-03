import { getEnv } from '@deputy/config';
import {
  ActionRegistry,
  createDatabaseClient,
  DatabaseInstance,
  DrizzleAuditRepository,
  DrizzleAuthorizationRepository,
  DrizzleDemonstrationRepository,
  DrizzleToolRepository,
  DrizzleWebAuthnRepository,
  IAuthorizationRepository,
  IDemonstrationRepository,
  InMemoryAuditRepository,
  InMemoryAuthorizationRepository,
  InMemoryDemonstrationRepository,
  InMemoryToolRepository,
  InMemoryWebAuthnRepository,
  IToolRepository,
  IWebAuthnRepository,
} from '@deputy/database';
import {
  IActionRegistry,
  IAuditRepository,
  IPolicyEngine,
  IToolExecutor,
  SynthesisCandidateResult,
} from '@deputy/domain';
import {
  AuthorizationVerifier,
  NonceManager,
  PolicyEngine,
  QuarantinePolicyEngine,
  ResponseBudgetEnforcer,
  ToolExecutor,
  WebAuthnChallengeStore,
  WebAuthnService,
} from '@deputy/security';
import { RecordingStateMachine, ToolSynthesisEngine } from '@deputy/synthesis';
import { WebMCPAdapter } from '@deputy/webmcp';

export interface AppServices {
  toolRepo: IToolRepository;
  demonstrationRepo: IDemonstrationRepository;
  auditRepo: IAuditRepository;
  authorizationRepo: IAuthorizationRepository;
  webauthnRepo: IWebAuthnRepository;
  actionRegistry: IActionRegistry;
  policyEngine: IPolicyEngine;
  toolExecutor: IToolExecutor;
  webmcpAdapter: WebMCPAdapter;
  nonceManager: NonceManager;
  verifier: AuthorizationVerifier;
  webauthnService: WebAuthnService;
  quarantineEngine: QuarantinePolicyEngine;
  synthesisEngine: ToolSynthesisEngine;
  activeRecordingSessions: Map<string, RecordingStateMachine>;
  candidateTools: Map<string, SynthesisCandidateResult>;
  challengeStore: WebAuthnChallengeStore;
  activeChallenges: Map<
    string,
    { challenge: string; createdAt: Date; expiresAt: Date; actorId?: string }
  >;
  repositoryMode: 'MEMORY' | 'POSTGRES';
  db?: DatabaseInstance;
}

export function initializeServices(): AppServices {
  const env = getEnv();
  const actionRegistry = new ActionRegistry();
  const nonceManager = new NonceManager();
  const verifier = new AuthorizationVerifier(nonceManager);
  const policyEngine = new PolicyEngine(verifier);
  const budgetEnforcer = new ResponseBudgetEnforcer();
  const toolExecutor = new ToolExecutor(actionRegistry, verifier, budgetEnforcer);
  const webmcpAdapter = new WebMCPAdapter();
  const webauthnService = new WebAuthnService({
    rpName: env.RP_NAME,
    rpID: env.RP_ID,
    expectedOrigin: env.WEBAUTHN_ORIGIN,
  });
  const quarantineEngine = new QuarantinePolicyEngine(budgetEnforcer);
  const synthesisEngine = new ToolSynthesisEngine();
  const challengeStore = new WebAuthnChallengeStore();

  let toolRepo: IToolRepository;
  let demonstrationRepo: IDemonstrationRepository;
  let auditRepo: IAuditRepository;
  let authorizationRepo: IAuthorizationRepository;
  let webauthnRepo: IWebAuthnRepository;
  let db: DatabaseInstance | undefined;

  if (env.REPOSITORY_MODE === 'POSTGRES') {
    const client = createDatabaseClient(env.DATABASE_URL);
    db = client.db;
    toolRepo = new DrizzleToolRepository(db);
    demonstrationRepo = new DrizzleDemonstrationRepository(db);
    auditRepo = new DrizzleAuditRepository(db);
    authorizationRepo = new DrizzleAuthorizationRepository(db);
    webauthnRepo = new DrizzleWebAuthnRepository(db);
  } else {
    toolRepo = new InMemoryToolRepository();
    demonstrationRepo = new InMemoryDemonstrationRepository();
    auditRepo = new InMemoryAuditRepository();
    authorizationRepo = new InMemoryAuthorizationRepository();
    webauthnRepo = new InMemoryWebAuthnRepository();
  }

  const activeRecordingSessions = new Map<string, RecordingStateMachine>();
  const candidateTools = new Map<string, SynthesisCandidateResult>();
  const activeChallenges = new Map<
    string,
    { challenge: string; createdAt: Date; expiresAt: Date; actorId?: string }
  >();

  return {
    toolRepo,
    demonstrationRepo,
    auditRepo,
    authorizationRepo,
    webauthnRepo,
    actionRegistry,
    policyEngine,
    toolExecutor,
    webmcpAdapter,
    nonceManager,
    verifier,
    webauthnService,
    quarantineEngine,
    synthesisEngine,
    activeRecordingSessions,
    candidateTools,
    challengeStore,
    activeChallenges,
    repositoryMode: env.REPOSITORY_MODE,
    db,
  };
}
