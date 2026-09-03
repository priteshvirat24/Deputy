export type SceneId =
  'HOOK' | 'LEARN' | 'SYNTHESIZE' | 'AUTHORIZE' | 'EXECUTE' | 'REJECT' | 'AUDIT' | 'OUTRO';

export interface SceneDefinition {
  id: SceneId;
  index: number;
  startTime: number; // in seconds
  endTime: number; // in seconds
  duration: number;
  title: string;
  tagline: string;
  supporting: string;
  technicalLabel: string;
  semanticColor: string; // hex
  cameraTarget: { x: number; y: number; z: number };
  cameraPosition: { x: number; y: number; z: number };
  coreColor: string;
  coreIntensity: number;
  glowColor: string;
}

export const TOTAL_DURATION = 38; // 38 seconds total runtime

export const SCENES: SceneDefinition[] = [
  {
    id: 'HOOK',
    index: 0,
    startTime: 0,
    endTime: 4.5,
    duration: 4.5,
    title: 'DEPUTY',
    tagline: 'LEARN. SYNTHESIZE. EXECUTE.',
    supporting: 'Trust is not assumed. It is engineered.',
    technicalLabel: 'CAPABILITY TRUST CORE · INITIALIZING',
    semanticColor: '#818cf8', // Electric Violet
    cameraPosition: { x: 0, y: 1.2, z: 9.5 },
    cameraTarget: { x: 0, y: 0.2, z: 0 },
    coreColor: '#818cf8',
    coreIntensity: 0.6,
    glowColor: '#6366f1',
  },
  {
    id: 'LEARN',
    index: 1,
    startTime: 4.5,
    endTime: 10,
    duration: 5.5,
    title: 'LEARN FROM REAL OPERATIONS',
    tagline: 'Capture. Understand. Generalize.',
    supporting: 'DEPUTY records semantic application calls, not pixels or fragile DOM macros.',
    technicalLabel: 'ACTION_REGISTRY · INGESTING DEMONSTRATIONS',
    semanticColor: '#06b6d4', // Cyan
    cameraPosition: { x: 3.5, y: 1.8, z: 7.2 },
    cameraTarget: { x: 0, y: 0, z: 0 },
    coreColor: '#06b6d4',
    coreIntensity: 1.2,
    glowColor: '#0891b2',
  },
  {
    id: 'SYNTHESIZE',
    index: 2,
    startTime: 10,
    endTime: 16,
    duration: 6.0,
    title: 'SYNTHESIZE CAPABILITIES',
    tagline: 'Deterministic. Explainable. Repeatable.',
    supporting: 'Variational parameter inference extracts intent while discarding volatile noise.',
    technicalLabel: 'SYNTHESIS_ENGINE · JSON_SCHEMA CRYSTALLIZATION',
    semanticColor: '#a855f7', // Electric Violet
    cameraPosition: { x: -3.2, y: 2.2, z: 6.8 },
    cameraTarget: { x: 0, y: 0.1, z: 0 },
    coreColor: '#c084fc',
    coreIntensity: 1.6,
    glowColor: '#9333ea',
  },
  {
    id: 'AUTHORIZE',
    index: 3,
    startTime: 16,
    endTime: 22,
    duration: 6.0,
    title: 'HUMAN AUTHORIZATION',
    tagline: 'The machine proposes, the human authorizes.',
    supporting:
      'High-risk and monetary actions require hardware-backed WebAuthn User Verification.',
    technicalLabel: 'FIDO2 / WEBAUTHN · EXACT ARGUMENT BINDING',
    semanticColor: '#818cf8', // Electric Violet
    cameraPosition: { x: 0, y: 0.9, z: 6.0 },
    cameraTarget: { x: 0, y: 0, z: 0 },
    coreColor: '#818cf8',
    coreIntensity: 1.8,
    glowColor: '#4f46e5',
  },
  {
    id: 'EXECUTE',
    index: 4,
    startTime: 22,
    endTime: 27.5,
    duration: 5.5,
    title: 'EXECUTE WITH CONFIDENCE',
    tagline: 'Verified capability. Controlled execution.',
    supporting: 'Single-use cryptographic tokens route securely through native ActionRegistry.',
    technicalLabel: 'WEBMCP RUNTIME · EXECUTION_SUCCESS (VERIFIED)',
    semanticColor: '#10b981', // Emerald
    cameraPosition: { x: 2.8, y: -0.6, z: 6.5 },
    cameraTarget: { x: 0, y: 0, z: 0 },
    coreColor: '#10b981',
    coreIntensity: 2.0,
    glowColor: '#059669',
  },
  {
    id: 'REJECT',
    index: 5,
    startTime: 27.5,
    endTime: 32.5,
    duration: 5.0,
    title: 'TAMPER REJECTION',
    tagline: 'ARGUMENT DIGEST MISMATCH · EXECUTION BLOCKED',
    supporting:
      'Mutating parameters from ₹2,500 to ₹5,000 invalidates the canonical SHA-256 digest.',
    technicalLabel: 'SECURITY_GATE · FAIL-CLOSED DETERMINISTIC REFUSAL',
    semanticColor: '#f43f5e', // Coral / Red
    cameraPosition: { x: -2.2, y: 0.4, z: 5.8 },
    cameraTarget: { x: 0, y: 0, z: 0 },
    coreColor: '#f43f5e',
    coreIntensity: 2.4,
    glowColor: '#e11d48',
  },
  {
    id: 'AUDIT',
    index: 6,
    startTime: 32.5,
    endTime: 36,
    duration: 3.5,
    title: 'EVERY ACTION LEAVES PROOF',
    tagline: 'Append-only. Cryptographically verifiable.',
    supporting: 'Every decision and execution is permanently sealed in an immutable hash chain.',
    technicalLabel: 'GENESIS_LINKED · SHA-256 AUDIT LEDGER',
    semanticColor: '#38bdf8', // Slate Blue / Cyan
    cameraPosition: { x: 0, y: 2.5, z: 10.5 },
    cameraTarget: { x: 0, y: -0.2, z: 0 },
    coreColor: '#38bdf8',
    coreIntensity: 1.3,
    glowColor: '#0284c7',
  },
  {
    id: 'OUTRO',
    index: 7,
    startTime: 36,
    endTime: 38,
    duration: 2.0,
    title: 'DEPUTY',
    tagline: 'TRUSTED BY DESIGN.',
    supporting: 'Built for the age of agentic operations.',
    technicalLabel: 'DEPUTY PLATFORM · ACTIVE & ENFORCED',
    semanticColor: '#818cf8',
    cameraPosition: { x: 0, y: 0.8, z: 8.0 },
    cameraTarget: { x: 0, y: 0, z: 0 },
    coreColor: '#818cf8',
    coreIntensity: 1.0,
    glowColor: '#6366f1',
  },
];

export function getSceneAtTime(timeSeconds: number): {
  scene: SceneDefinition;
  sceneProgress: number; // 0 to 1 within the current scene
  overallProgress: number; // 0 to 1 across entire experience
} {
  const clamped = Math.max(0, Math.min(TOTAL_DURATION, timeSeconds));
  const overallProgress = clamped / TOTAL_DURATION;

  for (let i = 0; i < SCENES.length; i++) {
    const s = SCENES[i];
    if (s && clamped >= s.startTime && clamped <= s.endTime) {
      const sceneProgress = (clamped - s.startTime) / s.duration;
      return { scene: s, sceneProgress: Math.min(1, Math.max(0, sceneProgress)), overallProgress };
    }
  }

  const defaultScene = SCENES[0] as SceneDefinition;
  const last = (SCENES[SCENES.length - 1] || defaultScene) as SceneDefinition;
  return { scene: last, sceneProgress: 1, overallProgress: 1 };
}
