import * as THREE from 'three';

export class ActionTrace3D {
  public group: THREE.Group;
  private curveLine: THREE.Line;
  private nodes: THREE.Mesh[] = [];
  private pulseNodes: THREE.Mesh[] = [];
  private curve: THREE.CatmullRomCurve3;

  constructor() {
    this.group = new THREE.Group();

    // Spline path from right space flowing into the Trust Core at (0, 0, 0)
    const points = [
      new THREE.Vector3(5.5, 1.8, 2.0),
      new THREE.Vector3(3.8, 1.2, 1.2),
      new THREE.Vector3(2.0, 0.6, 0.5),
      new THREE.Vector3(0.8, 0.2, 0.1),
      new THREE.Vector3(0.0, 0.0, 0.0),
    ];

    this.curve = new THREE.CatmullRomCurve3(points);
    const curvePoints = this.curve.getPoints(50);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);

    const lineMat = new THREE.LineBasicMaterial({
      color: 0x0891b2,
      transparent: true,
      opacity: 0.85,
      linewidth: 2,
    });

    this.curveLine = new THREE.Line(lineGeo, lineMat);
    this.group.add(this.curveLine);

    // 3 semantic action nodes
    const nodeGeo = new THREE.SphereGeometry(0.14, 16, 16);
    const nodeMat = new THREE.MeshBasicMaterial({
      color: 0x0891b2,
      transparent: true,
      opacity: 0.95,
    });

    for (let i = 0; i < 3; i++) {
      const mesh = new THREE.Mesh(nodeGeo, nodeMat);
      this.nodes.push(mesh);
      this.group.add(mesh);

      // Glow shell
      const pulseGeo = new THREE.SphereGeometry(0.22, 16, 16);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.4,
        wireframe: true,
      });
      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      this.pulseNodes.push(pulseMesh);
      this.group.add(pulseMesh);
    }

    this.group.visible = false;
  }

  public update(sceneProgress: number, isVisible: boolean) {
    this.group.visible = isVisible;
    if (!isVisible) return;

    // Progress along spline
    for (let i = 0; i < this.nodes.length; i++) {
      const offset = i * 0.28;
      const t = (sceneProgress + offset) % 1.0;
      const point = this.curve.getPointAt(t);

      const node = this.nodes[i];
      const pulseNode = this.pulseNodes[i];

      if (node && pulseNode) {
        node.position.copy(point);
        pulseNode.position.copy(point);

        // Fade out as it enters the core
        const opacity = Math.sin(t * Math.PI);
        (node.material as THREE.MeshBasicMaterial).opacity = opacity * 0.95;
        (pulseNode.material as THREE.MeshBasicMaterial).opacity = opacity * 0.4;
      }
    }
  }

  public setTamperMode(isTampered: boolean) {
    const color = isTampered ? 0xf43f5e : 0x06b6d4;
    (this.curveLine.material as THREE.LineBasicMaterial).color.setHex(color);
    for (const n of this.nodes) {
      (n.material as THREE.MeshBasicMaterial).color.setHex(color);
    }
  }

  public dispose() {
    this.curveLine.geometry.dispose();
    (this.curveLine.material as THREE.Material).dispose();

    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      const pulseNode = this.pulseNodes[i];
      if (node) {
        node.geometry.dispose();
        (node.material as THREE.Material).dispose();
      }
      if (pulseNode) {
        pulseNode.geometry.dispose();
        (pulseNode.material as THREE.Material).dispose();
      }
    }
  }
}
