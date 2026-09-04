export type SceneId =
  | 'INTRO'
  | 'DEMONSTRATE'
  | 'SYNTHESIZE'
  | 'SCHEMA'
  | 'AUTHORIZE'
  | 'EXECUTE'
  | 'TAMPER_REJECTION'
  | 'ARCHITECTURE'
  | 'FINALE';

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

export const TOTAL_DURATION = 38.0; // Exactly 38 seconds target runtime

export const SCENES: SceneDefinition[] = [
  {
    id: 'INTRO',
    index: 0,
    startTime: 0,
    endTime: 3.5,
    duration: 3.5,
    title: 'DEPUTY',
    tagline: 'AI learns from demonstrations.',
    supporting: 'But learning is not permission.',
    technicalLabel: 'CAPABILITY TRUST CORE · INITIALIZING',
    semanticColor: '#818cf8', // Electric Violet
    cameraPosition: { x: 0, y: 1.2, z: 9.5 },
    cameraTarget: { x: 0, y: 0.2, z: 0 },
    coreColor: '#818cf8',
    coreIntensity: 0.6,
    glowColor: '#6366f1',
  },
  {
    id: 'DEMONSTRATE',
    index: 1,
    startTime: 3.5,
    endTime: 7.5,
    duration: 4.0,
    title: 'DEMONSTRATE',
    tagline: 'Semantic actions, not pixels or DOM macros.',
    supporting: 'DEPUTY records real business calls: customer.create and invoice.create.',
    technicalLabel: 'ACTION_REGISTRY · INGESTING DEMONSTRATIONS',
    semanticColor: '#06b6d4', // Cyan
    cameraPosition: { x: 3.2, y: 1.5, z: 7.2 },
    cameraTarget: { x: 0, y: 0, z: 0 },
    coreColor: '#06b6d4',
    coreIntensity: 1.2,
    glowColor: '#0891b2',
  },
  {
    id: 'SYNTHESIZE',
    index: 2,
    startTime: 7.5,
    endTime: 12.0,
    duration: 4.5,
    title: 'SYNTHESIZE',
    tagline: 'Deterministic. Explainable. Repeatable.',
    supporting:
      'Variational parameter inference extracts intent while discarding volatile timestamps and nonces.',
    technicalLabel: 'SYNTHESIS_ENGINE · PARAMETER INFERENCE',
    semanticColor: '#a855f7', // Electric Violet
    cameraPosition: { x: -3.0, y: 2.0, z: 6.8 },
    cameraTarget: { x: 0, y: 0.1, z: 0 },
    coreColor: '#c084fc',
    coreIntensity: 1.6,
    glowColor: '#9333ea',
  },
  {
    id: 'SCHEMA',
    index: 3,
    startTime: 12.0,
    endTime: 17.0,
    duration: 5.0,
    title: 'STRICT CONTRACT',
    tagline: 'No arbitrary code. Only declarative capability metadata.',
    supporting:
      'JSON Schema with additionalProperties: false guarantees the model cannot escape parameter bounds.',
    technicalLabel: 'JSON_SCHEMA · STRICT CONTRACT BINDING',
    semanticColor: '#38bdf8', // Sky Blue
    cameraPosition: { x: 0, y: 1.0, z: 5.5 },
    cameraTarget: { x: 0, y: 0, z: 0 },
    coreColor: '#38bdf8',
    coreIntensity: 1.5,
    glowColor: '#0284c7',
  },
  {
    id: 'AUTHORIZE',
    index: 4,
    startTime: 17.0,
    endTime: 23.0,
    duration: 6.0,
    title: 'PROPOSE ≠ AUTHORIZE',
    tagline: 'High-risk execution requires explicit human approval.',
    supporting:
      'FIDO2 WebAuthn User Verification cryptographically seals the canonical SHA-256 parameter digest.',
    technicalLabel: 'WEBAUTHN · EXACT ARGUMENT BINDING',
    semanticColor: '#818cf8', // Electric Violet
    cameraPosition: { x: 0, y: 0.8, z: 6.0 },
    cameraTarget: { x: 0, y: 0, z: 0 },
    coreColor: '#818cf8',
    coreIntensity: 1.8,
    glowColor: '#4f46e5',
  },
  {
    id: 'EXECUTE',
    index: 5,
    startTime: 23.0,
    endTime: 28.0,
    duration: 5.0,
    title: 'EXECUTE ONLY WHAT WAS AUTHORIZED',
    tagline: 'Verified capability. Single-use execution.',
    supporting:
      'Token is atomically consumed and routes exclusively to registered native application handlers.',
    technicalLabel: 'WEBMCP RUNTIME · VERIFIED EXECUTION',
    semanticColor: '#10b981', // Emerald
    cameraPosition: { x: 2.6, y: -0.5, z: 6.5 },
    cameraTarget: { x: 0, y: 0, z: 0 },
    coreColor: '#10b981',
    coreIntensity: 2.0,
    glowColor: '#059669',
  },
  {
    id: 'TAMPER_REJECTION',
    index: 6,
    startTime: 28.0,
    endTime: 32.0,
    duration: 4.0,
    title: 'TAMPER REJECTION',
    tagline: 'ARGUMENT DIGEST MISMATCH · EXECUTION BLOCKED',
    supporting:
      'Mutating parameters from ₹2,500 to ₹5,000 invalidates the signature. Fail-closed rejection.',
    technicalLabel: 'SECURITY_GATE · DETERMINISTIC REFUSAL',
    semanticColor: '#f43f5e', // Coral / Red
    cameraPosition: { x: -2.0, y: 0.4, z: 5.8 },
    cameraTarget: { x: 0, y: 0, z: 0 },
    coreColor: '#f43f5e',
    coreIntensity: 2.4,
    glowColor: '#e11d48',
  },
  {
    id: 'ARCHITECTURE',
    index: 7,
    startTime: 32.0,
    endTime: 35.0,
    duration: 3.0,
    title: 'EVERY ACTION LEAVES PROOF',
    tagline: 'Append-only. Cryptographically verifiable.',
    supporting:
      'WebMCP, WebAuthn, ActionRegistry, Quarantine, and Audit operate as synchronized security layers.',
    technicalLabel: 'GENESIS_LINKED · IMMUTABLE SHA-256 AUDIT',
    semanticColor: '#38bdf8', // Slate Blue
    cameraPosition: { x: 0, y: 2.2, z: 10.0 },
    cameraTarget: { x: 0, y: -0.2, z: 0 },
    coreColor: '#38bdf8',
    coreIntensity: 1.4,
    glowColor: '#0284c7',
  },
  {
    id: 'FINALE',
    index: 8,
    startTime: 35.0,
    endTime: 38.0,
    duration: 3.0,
    title: 'DEPUTY',
    tagline: 'Learn the workflow. Keep the boundary.',
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
