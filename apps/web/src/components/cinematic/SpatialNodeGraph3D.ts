import * as THREE from 'three';

export interface GraphNodeDefinition {
  id: string;
  name: string;
  role: string;
  category: 'ACTION' | 'AUTH' | 'SCHEMA' | 'SECURITY' | 'AUDIT';
  color: number;
  basePos: THREE.Vector3;
  phase: number;
  radius: number;
}

export const SPATIAL_NODES: GraphNodeDefinition[] = [
  // 0. Center Authority Core
  {
    id: 'node_core',
    name: 'Authority Core',
    role: 'Security Boundary & Policy Master',
    category: 'SECURITY',
    color: 0x7c3aed,
    basePos: new THREE.Vector3(0, 0, 0),
    phase: 0,
    radius: 0.38,
  },
  // 1-4. Business Application Actions (Tier 1 Orbit)
  {
    id: 'node_cust_create',
    name: 'customer.create',
    role: 'CRM Ingestion Action',
    category: 'ACTION',
    color: 0x0891b2,
    basePos: new THREE.Vector3(1.8, 0.6, 0.8),
    phase: 0.5,
    radius: 0.22,
  },
  {
    id: 'node_inv_create',
    name: 'invoice.create',
    role: 'Financial Billing Action',
    category: 'ACTION',
    color: 0x7c3aed,
    basePos: new THREE.Vector3(2.4, -0.4, -0.5),
    phase: 1.1,
    radius: 0.24,
  },
  {
    id: 'node_followup',
    name: 'followup.schedule',
    role: 'Calendar Automation Action',
    category: 'ACTION',
    color: 0x059669,
    basePos: new THREE.Vector3(1.2, 1.4, -1.2),
    phase: 1.8,
    radius: 0.2,
  },
  {
    id: 'node_refund',
    name: 'refund.process',
    role: 'Monetary Transaction (High Risk)',
    category: 'ACTION',
    color: 0xe11d48,
    basePos: new THREE.Vector3(-1.9, -0.7, 1.1),
    phase: 2.3,
    radius: 0.23,
  },
  // 5-8. Governance & Synthesis Gateways
  {
    id: 'node_fido2',
    name: 'webauthn.fido2',
    role: 'Hardware User Verification',
    category: 'AUTH',
    color: 0x7c3aed,
    basePos: new THREE.Vector3(-1.6, 1.2, 0.4),
    phase: 2.9,
    radius: 0.26,
  },
  {
    id: 'node_digest',
    name: 'digest.sha256',
    role: 'Canonical Parameter Digest',
    category: 'SECURITY',
    color: 0x2563eb,
    basePos: new THREE.Vector3(-0.8, 1.8, -0.7),
    phase: 3.5,
    radius: 0.2,
  },
  {
    id: 'node_schema',
    name: 'schema.contract',
    role: 'Strict JSON Schema (no extra props)',
    category: 'SCHEMA',
    color: 0x0284c7,
    basePos: new THREE.Vector3(0.5, -1.5, 1.4),
    phase: 4.1,
    radius: 0.24,
  },
  {
    id: 'node_quarantine',
    name: 'quarantine.fence',
    role: 'External Taint Containment',
    category: 'SECURITY',
    color: 0xd97706,
    basePos: new THREE.Vector3(-2.5, 0.2, -1.3),
    phase: 4.7,
    radius: 0.22,
  },
  // 9-12. Runtime & Execution
  {
    id: 'node_webmcp',
    name: 'webmcp.gateway',
    role: 'Dynamic Protocol Adapter',
    category: 'SECURITY',
    color: 0x0891b2,
    basePos: new THREE.Vector3(1.4, -1.2, -1.5),
    phase: 5.3,
    radius: 0.24,
  },
  {
    id: 'node_token',
    name: 'token.consume',
    role: 'Atomic Single-Use Token Gate',
    category: 'SECURITY',
    color: 0x059669,
    basePos: new THREE.Vector3(0.0, -1.8, -0.6),
    phase: 5.9,
    radius: 0.2,
  },
  {
    id: 'node_audit',
    name: 'audit.merkle',
    role: 'Immutable Genesis Hash Seal',
    category: 'AUDIT',
    color: 0x475569,
    basePos: new THREE.Vector3(-1.2, -1.3, -1.8),
    phase: 6.4,
    radius: 0.22,
  },
  // 13-15. Deterministic Targets & Provenance
  {
    id: 'node_policy',
    name: 'policy.evaluator',
    role: 'Fail-Closed Decision Engine',
    category: 'SECURITY',
    color: 0x7c3aed,
    basePos: new THREE.Vector3(-2.2, -1.4, 0.2),
    phase: 7.0,
    radius: 0.2,
  },
  {
    id: 'node_provenance',
    name: 'provenance.track',
    role: 'First-Party Lineage Verifier',
    category: 'AUDIT',
    color: 0x059669,
    basePos: new THREE.Vector3(2.1, 1.1, 1.2),
    phase: 7.6,
    radius: 0.18,
  },
  {
    id: 'node_reversal',
    name: 'reversal.guard',
    role: 'Compensating Action Engine',
    category: 'SECURITY',
    color: 0xd97706,
    basePos: new THREE.Vector3(0.6, 1.9, 0.9),
    phase: 8.2,
    radius: 0.19,
  },
  {
    id: 'node_registry',
    name: 'action.registry',
    role: 'Deterministic Native Targets',
    category: 'SECURITY',
    color: 0x0891b2,
    basePos: new THREE.Vector3(-0.5, 0.3, 2.2),
    phase: 8.8,
    radius: 0.22,
  },
];

export const GRAPH_EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [0, 5],
  [0, 6],
  [0, 7],
  [0, 8],
  [0, 9],
  [0, 10],
  [0, 11],
  [1, 2],
  [2, 3],
  [1, 13],
  [3, 14],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [8, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [12, 4],
  [13, 14],
  [14, 15],
  [15, 1],
  [15, 0],
];

export class SpatialNodeGraph3D {
  public group: THREE.Group;
  public nodeMeshes: THREE.Mesh[] = [];
  public nodePositions: THREE.Vector3[] = [];
  public currentPositions: THREE.Vector3[] = [];
  public targetPositions: THREE.Vector3[] = [];

  private edgeLines: THREE.Line[] = [];
  private dataPulses: THREE.Mesh[] = [];
  private pulseProgress: number[] = [];

  // Central Core Special Geometry
  private innerCoreMesh: THREE.Mesh | null = null;
  private coreShieldRing: THREE.Line | null = null;

  // Ground Contact Shadow & Rings
  private platformGroup: THREE.Group;

  constructor() {
    this.group = new THREE.Group();
    this.platformGroup = new THREE.Group();

    // 1. Create Ground Shadow Plane & Floor Rings
    this.platformGroup.position.y = -2.2;
    const shadowGeo = new THREE.CircleGeometry(2.4, 32);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.2,
    });
    this.platformGroup.add(new THREE.Mesh(shadowGeo, shadowMat));

    for (let r = 1.4; r <= 4.2; r += 0.9) {
      const circleGeo = new THREE.BufferGeometry();
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(theta) * r, 0, Math.sin(theta) * r));
      }
      circleGeo.setFromPoints(pts);
      const circleMat = new THREE.LineBasicMaterial({
        color: 0xcbd5e1,
        transparent: true,
        opacity: 0.6 - r * 0.08,
      });
      this.platformGroup.add(new THREE.Line(circleGeo, circleMat));
    }
    this.group.add(this.platformGroup);

    // 2. Build the 16 Spatial Spherical Nodes
    SPATIAL_NODES.forEach((def, index) => {
      const geo = new THREE.SphereGeometry(def.radius, 24, 24);

      // Metallic graphite with semantic accent sheen
      const mat = new THREE.MeshStandardMaterial({
        color: 0x18181b,
        metalness: 0.75,
        roughness: 0.25,
        emissive: new THREE.Color(def.color),
        emissiveIntensity: index === 0 ? 0.4 : 0.25,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(def.basePos);
      mesh.userData = { index, id: def.id, name: def.name, role: def.role, category: def.category };

      // Add subtle outer wireframe glow ring
      const ringGeo = new THREE.BufferGeometry();
      const ringPts: THREE.Vector3[] = [];
      for (let i = 0; i <= 32; i++) {
        const theta = (i / 32) * Math.PI * 2;
        ringPts.push(
          new THREE.Vector3(
            Math.cos(theta) * (def.radius * 1.25),
            0,
            Math.sin(theta) * (def.radius * 1.25),
          ),
        );
      }
      ringGeo.setFromPoints(ringPts);
      const ringMat = new THREE.LineBasicMaterial({
        color: def.color,
        transparent: true,
        opacity: 0.6,
      });
      const ring = new THREE.Line(ringGeo, ringMat);
      ring.rotation.x = Math.PI * 0.25 * index;
      mesh.add(ring);

      this.nodeMeshes.push(mesh);
      this.nodePositions.push(def.basePos.clone());
      this.currentPositions.push(def.basePos.clone());
      this.targetPositions.push(def.basePos.clone());
      this.group.add(mesh);
    });

    // Special central core octahedron inside Node 0
    const innerGeo = new THREE.OctahedronGeometry(0.24, 0);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0x7c3aed });
    this.innerCoreMesh = new THREE.Mesh(innerGeo, innerMat);
    const node0 = this.nodeMeshes[0];
    if (node0) {
      node0.add(this.innerCoreMesh);
    }

    // Special authorization shield ring
    const shieldGeo = new THREE.BufferGeometry();
    const shieldPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      shieldPts.push(new THREE.Vector3(Math.cos(theta) * 0.8, Math.sin(theta) * 0.8, 0));
    }
    shieldGeo.setFromPoints(shieldPts);
    const shieldMat = new THREE.LineBasicMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.0,
      linewidth: 2,
    });
    this.coreShieldRing = new THREE.Line(shieldGeo, shieldMat);
    if (node0) {
      node0.add(this.coreShieldRing);
    }

    // 3. Build Dynamic Connecting Graph Lines (Edges)
    GRAPH_EDGES.forEach(([fromIdx, toIdx]) => {
      const fromPos = this.currentPositions[fromIdx] ?? new THREE.Vector3();
      const toPos = this.currentPositions[toIdx] ?? new THREE.Vector3();

      const lineGeo = new THREE.BufferGeometry().setFromPoints([fromPos, toPos]);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x7c3aed,
        transparent: true,
        opacity: 0.35,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      this.edgeLines.push(line);
      this.group.add(line);
    });

    // 4. Data Pulses (Traveling Packets)
    const pulseGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const pulseMat = new THREE.MeshBasicMaterial({ color: 0x0891b2 });

    for (let i = 0; i < 8; i++) {
      const pulse = new THREE.Mesh(pulseGeo, pulseMat);
      this.dataPulses.push(pulse);
      this.pulseProgress.push(i / 8);
      this.group.add(pulse);
    }
  }

  public update(time: number, delta: number) {
    // 1. Update harmonic breathing and interpolate positions toward targets
    for (let i = 0; i < SPATIAL_NODES.length; i++) {
      const def = SPATIAL_NODES[i];
      const mesh = this.nodeMeshes[i];
      const current = this.currentPositions[i];
      const target = this.targetPositions[i];

      if (def && mesh && current && target) {
        // Subtle harmonic floating wave
        const floatY = Math.sin(time * 1.8 + def.phase) * 0.08;
        const floatX = Math.cos(time * 1.4 + def.phase) * 0.05;

        // Smooth position damping toward target
        current.lerp(target, Math.min(1.0, delta * 3.5));
        mesh.position.set(current.x + floatX, current.y + floatY, current.z);

        // Slow independent mesh rotation
        mesh.rotation.y += 0.008;
        mesh.rotation.x += 0.004;
      }
    }

    // Rotate central inner octahedron
    if (this.innerCoreMesh) {
      this.innerCoreMesh.rotation.x -= 0.015;
      this.innerCoreMesh.rotation.y += 0.02;
    }

    // 2. Update Dynamic Graph Edge Geometry
    GRAPH_EDGES.forEach(([fromIdx, toIdx], edgeIdx) => {
      const line = this.edgeLines[edgeIdx];
      const meshA = this.nodeMeshes[fromIdx];
      const meshB = this.nodeMeshes[toIdx];

      if (line && meshA && meshB) {
        const positions = line.geometry.attributes.position as THREE.BufferAttribute;
        const array = positions.array as Float32Array;

        array[0] = meshA.position.x;
        array[1] = meshA.position.y;
        array[2] = meshA.position.z;

        array[3] = meshB.position.x;
        array[4] = meshB.position.y;
        array[5] = meshB.position.z;

        positions.needsUpdate = true;
      }
    });

    // 3. Update Traveling Data Pulses along Random Active Edges
    this.dataPulses.forEach((pulse, pIdx) => {
      const edgeIndex = (pIdx * 3) % GRAPH_EDGES.length;
      const edge = GRAPH_EDGES[edgeIndex];
      if (!edge) return;

      const [fromIdx, toIdx] = edge;
      const meshA = this.nodeMeshes[fromIdx];
      const meshB = this.nodeMeshes[toIdx];

      if (meshA && meshB) {
        const prevProg = this.pulseProgress[pIdx] ?? 0;
        const nextProg = (prevProg + delta * 0.6) % 1.0;
        this.pulseProgress[pIdx] = nextProg;

        pulse.position.lerpVectors(meshA.position, meshB.position, nextProg);
      }
    });
  }

  // Cinematic Formation Controller for the 38s Judge Flow
  public setCinematicFormation(sceneId: string, sceneProgress: number) {
    if (sceneId === 'INTRO') {
      // Idle spatial constellation
      SPATIAL_NODES.forEach((def, i) => {
        const target = this.targetPositions[i];
        if (target) target.copy(def.basePos);
      });
      this.resetEdgeColors(0x7c3aed, 0.35);
      if (this.coreShieldRing) {
        (this.coreShieldRing.material as THREE.LineBasicMaterial).opacity = 0;
      }
    } else if (sceneId === 'DEMONSTRATE') {
      // Action nodes (1, 2, 3) assemble into a sequential workflow line in front of camera
      const p1 = this.targetPositions[1];
      const p2 = this.targetPositions[2];
      const p3 = this.targetPositions[3];

      if (p1) p1.set(-1.4, 0.2, 1.2);
      if (p2) p2.set(0.0, 0.2, 1.2);
      if (p3) p3.set(1.4, 0.2, 1.2);

      // Light up action nodes with cyan glow
      [1, 2, 3].forEach(idx => {
        const m = this.nodeMeshes[idx];
        if (m) {
          (m.material as THREE.MeshStandardMaterial).emissive.setHex(0x0891b2);
          (m.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8;
        }
      });
    } else if (sceneId === 'SYNTHESIZE') {
      // Nodes converge toward center, forming a clustered crystalline polyhedron
      SPATIAL_NODES.forEach((def, i) => {
        const target = this.targetPositions[i];
        if (target) {
          target.copy(def.basePos).multiplyScalar(0.45);
        }
      });
      this.resetEdgeColors(0x7c3aed, 0.7);
    } else if (sceneId === 'SCHEMA') {
      // Nodes form a structured spherical lattice
      SPATIAL_NODES.forEach((def, i) => {
        const target = this.targetPositions[i];
        if (target && i > 0) {
          target.copy(def.basePos).normalize().multiplyScalar(1.6);
        }
      });
      this.resetEdgeColors(0x0284c7, 0.6);
    } else if (sceneId === 'AUTHORIZE') {
      // Pulse the central auth shield ring
      if (this.coreShieldRing) {
        (this.coreShieldRing.material as THREE.LineBasicMaterial).opacity =
          0.6 + Math.sin(sceneProgress * Math.PI * 4) * 0.35;
        (this.coreShieldRing.material as THREE.LineBasicMaterial).color.setHex(0x7c3aed);
      }
      // Monetary node 4 (refund.process) highlighted
      const m4 = this.nodeMeshes[4];
      if (m4) {
        (m4.material as THREE.MeshStandardMaterial).emissive.setHex(0x7c3aed);
        (m4.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.9;
      }
    } else if (sceneId === 'EXECUTE') {
      // All nodes turn emerald as execution routes successfully
      this.nodeMeshes.forEach(m => {
        (m.material as THREE.MeshStandardMaterial).emissive.setHex(0x059669);
        (m.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.7;
      });
      this.resetEdgeColors(0x059669, 0.8);
      if (this.coreShieldRing) {
        (this.coreShieldRing.material as THREE.LineBasicMaterial).opacity = 0;
      }
    } else if (sceneId === 'TAMPER_REJECTION') {
      // Node 4 turns coral/red and connecting edges flash red!
      const m4 = this.nodeMeshes[4];
      if (m4) {
        (m4.material as THREE.MeshStandardMaterial).emissive.setHex(0xdc2626);
        (m4.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.2;
        // Jitter / vibrate node 4
        m4.position.x += (Math.random() - 0.5) * 0.08;
      }
      this.resetEdgeColors(0xdc2626, 0.9);
    } else if (sceneId === 'ARCHITECTURE') {
      // Nodes align along an append-only chain in Z depth
      SPATIAL_NODES.forEach((_def, i) => {
        const target = this.targetPositions[i];
        if (target) {
          const z = -(i - 4) * 0.65;
          const x = Math.sin(i * 0.7) * 0.8;
          const y = i % 2 === 0 ? 0.3 : -0.3;
          target.set(x, y, z);
        }
      });
      this.resetEdgeColors(0x0891b2, 0.6);
    } else if (sceneId === 'FINALE') {
      // Nodes smoothly expand back to expansive spatial constellation
      SPATIAL_NODES.forEach((def, i) => {
        const target = this.targetPositions[i];
        if (target) target.copy(def.basePos);
      });
      this.resetEdgeColors(0x7c3aed, 0.4);
    }
  }

  // Layer filter helper for the landing page layer buttons
  public filterLayer(layer: string) {
    SPATIAL_NODES.forEach((def, i) => {
      const mesh = this.nodeMeshes[i];
      if (!mesh) return;

      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (
        layer === 'ALL' ||
        def.category === layer ||
        (layer === 'EVIDENCE' && def.category === 'ACTION')
      ) {
        mat.opacity = 1.0;
        mesh.scale.set(1.0, 1.0, 1.0);
      } else {
        mat.opacity = 0.2;
        mesh.scale.set(0.6, 0.6, 0.6);
      }
    });
  }

  private resetEdgeColors(hex: number, opacity: number) {
    this.edgeLines.forEach(line => {
      const mat = line.material as THREE.LineBasicMaterial;
      mat.color.setHex(hex);
      mat.opacity = opacity;
    });
  }

  public dispose() {
    this.nodeMeshes.forEach(m => {
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    });
    this.edgeLines.forEach(l => {
      l.geometry.dispose();
      (l.material as THREE.Material).dispose();
    });
    this.dataPulses.forEach(p => {
      p.geometry.dispose();
      (p.material as THREE.Material).dispose();
    });
  }
}
