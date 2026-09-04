import * as THREE from 'three';

export class CapabilityOrbit {
  public group: THREE.Group;
  private ring1: THREE.Line;
  private ring2: THREE.Line;
  private authShieldRing: THREE.Line;
  private paramNodes: THREE.Mesh[] = [];

  constructor() {
    this.group = new THREE.Group();

    // Orbital Ring 1 (Horizontal tilt)
    const ring1Geo = new THREE.BufferGeometry();
    const ring1Points: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      ring1Points.push(new THREE.Vector3(Math.cos(theta) * 2.2, 0, Math.sin(theta) * 2.2));
    }
    ring1Geo.setFromPoints(ring1Points);
    const ring1Mat = new THREE.LineBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.4,
    });
    this.ring1 = new THREE.Line(ring1Geo, ring1Mat);
    this.ring1.rotation.x = Math.PI * 0.2;
    this.group.add(this.ring1);

    // Orbital Ring 2 (Vertical tilt)
    const ring2Geo = new THREE.BufferGeometry();
    const ring2Points: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      ring2Points.push(new THREE.Vector3(Math.cos(theta) * 2.6, Math.sin(theta) * 2.6, 0));
    }
    ring2Geo.setFromPoints(ring2Points);
    const ring2Mat = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.3,
    });
    this.ring2 = new THREE.Line(ring2Geo, ring2Mat);
    this.ring2.rotation.y = Math.PI * 0.35;
    this.group.add(this.ring2);

    // Authorization Shield Ring (Glow circle)
    const shieldGeo = new THREE.BufferGeometry();
    const shieldPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      shieldPoints.push(new THREE.Vector3(Math.cos(theta) * 1.8, Math.sin(theta) * 1.8, 0));
    }
    shieldGeo.setFromPoints(shieldPoints);
    const shieldMat = new THREE.LineBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.0,
      linewidth: 3,
    });
    this.authShieldRing = new THREE.Line(shieldGeo, shieldMat);
    this.group.add(this.authShieldRing);

    // Parameter Nodes
    const paramGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const paramMat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      transparent: true,
      opacity: 0.8,
    });

    for (let i = 0; i < 4; i++) {
      const mesh = new THREE.Mesh(paramGeo, paramMat);
      this.paramNodes.push(mesh);
      this.group.add(mesh);
    }
  }

  public update(time: number, sceneId: string, sceneProgress: number) {
    // Continuous slow orbit rotation
    this.ring1.rotation.z += 0.005;
    this.ring2.rotation.z -= 0.004;

    // Position parameter nodes along ring 1
    for (let i = 0; i < this.paramNodes.length; i++) {
      const node = this.paramNodes[i];
      if (node) {
        const angle = (i / this.paramNodes.length) * Math.PI * 2 + time * 0.4;
        const x = Math.cos(angle) * 2.2;
        const z = Math.sin(angle) * 2.2;
        const y = Math.sin(angle * 2) * 0.4;

        node.position.set(x, y, z);
      }
    }

    // Specific scene behaviors
    if (sceneId === 'SYNTHESIZE') {
      this.group.visible = true;
      (this.ring1.material as THREE.LineBasicMaterial).color.setHex(0xa855f7);
      (this.ring1.material as THREE.LineBasicMaterial).opacity = 0.6 * sceneProgress;
      (this.ring2.material as THREE.LineBasicMaterial).opacity = 0.5 * sceneProgress;
      (this.authShieldRing.material as THREE.LineBasicMaterial).opacity = 0.0;
    } else if (sceneId === 'AUTHORIZE') {
      this.group.visible = true;
      (this.ring1.material as THREE.LineBasicMaterial).opacity = 0.3;
      (this.ring2.material as THREE.LineBasicMaterial).opacity = 0.2;
      // Pulse the authorization shield ring
      const pulse = 0.5 + Math.sin(time * 4) * 0.35;
      (this.authShieldRing.material as THREE.LineBasicMaterial).opacity = pulse;
      (this.authShieldRing.material as THREE.LineBasicMaterial).color.setHex(0x818cf8);
    } else if (sceneId === 'EXECUTE') {
      this.group.visible = true;
      (this.ring1.material as THREE.LineBasicMaterial).color.setHex(0x10b981);
      (this.ring2.material as THREE.LineBasicMaterial).color.setHex(0x06b6d4);
      (this.ring1.material as THREE.LineBasicMaterial).opacity = 0.6;
      (this.authShieldRing.material as THREE.LineBasicMaterial).opacity = 0.0;
    } else if (sceneId === 'TAMPER_REJECTION') {
      this.group.visible = true;
      (this.ring1.material as THREE.LineBasicMaterial).color.setHex(0xf43f5e);
      (this.ring2.material as THREE.LineBasicMaterial).color.setHex(0xf43f5e);
      (this.ring1.material as THREE.LineBasicMaterial).opacity = 0.8;
      (this.authShieldRing.material as THREE.LineBasicMaterial).opacity = 0.0;
    } else {
      (this.ring1.material as THREE.LineBasicMaterial).opacity = 0.2;
      (this.ring2.material as THREE.LineBasicMaterial).opacity = 0.15;
      (this.authShieldRing.material as THREE.LineBasicMaterial).opacity = 0.0;
    }
  }

  public dispose() {
    this.ring1.geometry.dispose();
    (this.ring1.material as THREE.Material).dispose();
    this.ring2.geometry.dispose();
    (this.ring2.material as THREE.Material).dispose();
    this.authShieldRing.geometry.dispose();
    (this.authShieldRing.material as THREE.Material).dispose();

    for (const p of this.paramNodes) {
      p.geometry.dispose();
      (p.material as THREE.Material).dispose();
    }
  }
}
