import * as THREE from 'three';

export class AuditChain3D {
  public group: THREE.Group;
  private blocks: THREE.Mesh[] = [];
  private connectorLines: THREE.Line[] = [];
  private numBlocks = 5;

  constructor() {
    this.group = new THREE.Group();

    const boxGeo = new THREE.BoxGeometry(0.7, 0.45, 0.45);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: false,
    });

    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.8,
    });

    for (let i = 0; i < this.numBlocks; i++) {
      const block = new THREE.Mesh(boxGeo, boxMat.clone());
      const zPos = -(i + 1) * 1.8;
      const xPos = Math.sin(i * 0.8) * 1.2;
      const yPos = -i * 0.3;

      block.position.set(xPos, yPos, zPos);
      this.blocks.push(block);
      this.group.add(block);

      // Add edge highlights
      const edges = new THREE.EdgesGeometry(boxGeo);
      const edgeLine = new THREE.LineSegments(edges, edgeMat);
      block.add(edgeLine);

      // Connector line to previous block / core
      const lineGeo = new THREE.BufferGeometry();
      const prevX = i === 0 ? 0 : Math.sin((i - 1) * 0.8) * 1.2;
      const prevY = i === 0 ? 0 : -(i - 1) * 0.3;
      const prevZ = i === 0 ? 0 : -i * 1.8;

      lineGeo.setFromPoints([
        new THREE.Vector3(prevX, prevY, prevZ),
        new THREE.Vector3(xPos, yPos, zPos),
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.6,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      this.connectorLines.push(line);
      this.group.add(line);
    }

    this.group.visible = false;
  }

  public update(sceneProgress: number, isVisible: boolean) {
    this.group.visible = isVisible;
    if (!isVisible) return;

    // Stagger block reveal
    for (let i = 0; i < this.blocks.length; i++) {
      const block = this.blocks[i];
      const connector = this.connectorLines[i];
      const blockThreshold = i / this.numBlocks;

      if (block && connector) {
        if (sceneProgress >= blockThreshold) {
          block.visible = true;
          connector.visible = true;
          const scale = Math.min(1.0, (sceneProgress - blockThreshold) * 4);
          block.scale.set(scale, scale, scale);
        } else {
          block.visible = false;
          connector.visible = false;
        }
      }
    }
  }

  public dispose() {
    for (const b of this.blocks) {
      b.geometry.dispose();
      (b.material as THREE.Material).dispose();
    }
    for (const l of this.connectorLines) {
      l.geometry.dispose();
      (l.material as THREE.Material).dispose();
    }
  }
}
