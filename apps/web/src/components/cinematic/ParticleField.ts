import * as THREE from 'three';

export class ParticleField {
  public group: THREE.Group;
  private points: THREE.Points;
  private count = 300;
  private positions: Float32Array;
  private velocities: Float32Array;

  constructor() {
    this.group = new THREE.Group();

    const geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.count * 3);
    this.velocities = new Float32Array(this.count * 3);

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      this.positions[i3] = (Math.random() - 0.5) * 24;
      this.positions[i3 + 1] = (Math.random() - 0.5) * 16;
      this.positions[i3 + 2] = (Math.random() - 0.5) * 20;

      this.velocities[i3] = (Math.random() - 0.5) * 0.004;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.003;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.004;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.05,
      transparent: true,
      opacity: 0.4,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(geometry, material);
    this.group.add(this.points);
  }

  public update(_delta: number, intensity = 1.0) {
    const positionAttr = this.points.geometry.attributes.position as THREE.BufferAttribute;
    const array = positionAttr.array as Float32Array;

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      const vx = this.velocities[i3] ?? 0;
      const vy = this.velocities[i3 + 1] ?? 0;
      const vz = this.velocities[i3 + 2] ?? 0;

      const px = array[i3] ?? 0;
      const py = array[i3 + 1] ?? 0;
      const pz = array[i3 + 2] ?? 0;

      let nextX = px + vx * intensity;
      let nextY = py + vy * intensity;
      let nextZ = pz + vz * intensity;

      // Wrap around bounds
      if (nextX > 12) nextX = -12;
      if (nextX < -12) nextX = 12;
      if (nextY > 8) nextY = -8;
      if (nextY < -8) nextY = 8;
      if (nextZ > 10) nextZ = -10;
      if (nextZ < -10) nextZ = 10;

      array[i3] = nextX;
      array[i3 + 1] = nextY;
      array[i3 + 2] = nextZ;
    }

    positionAttr.needsUpdate = true;
  }

  public dispose() {
    this.points.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}
