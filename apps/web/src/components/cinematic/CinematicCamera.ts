import * as THREE from 'three';

export class CinematicCamera {
  public camera: THREE.PerspectiveCamera;
  private currentPos: THREE.Vector3;
  private currentLookAt: THREE.Vector3;
  private targetPos: THREE.Vector3;
  private targetLookAt: THREE.Vector3;

  // Manual drag override
  public isDragging = false;
  private manualRotationX = 0;
  private manualRotationY = 0;
  private lastMouseX = 0;
  private lastMouseY = 0;

  constructor(aspectRatio: number) {
    this.camera = new THREE.PerspectiveCamera(45, aspectRatio, 0.1, 100);
    this.currentPos = new THREE.Vector3(0, 1.2, 9.5);
    this.currentLookAt = new THREE.Vector3(0, 0.2, 0);
    this.targetPos = this.currentPos.clone();
    this.targetLookAt = this.currentLookAt.clone();

    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentLookAt);
  }

  public setTargets(
    pos: { x: number; y: number; z: number },
    lookAt: { x: number; y: number; z: number },
  ) {
    this.targetPos.set(pos.x, pos.y, pos.z);
    this.targetLookAt.set(lookAt.x, lookAt.y, lookAt.z);
  }

  public onMouseDown(clientX: number, clientY: number) {
    this.isDragging = true;
    this.lastMouseX = clientX;
    this.lastMouseY = clientY;
  }

  public onMouseMove(clientX: number, clientY: number) {
    if (!this.isDragging) return;
    const deltaX = clientX - this.lastMouseX;
    const deltaY = clientY - this.lastMouseY;

    this.manualRotationY += deltaX * 0.005;
    this.manualRotationX += deltaY * 0.005;
    this.manualRotationX = Math.max(-0.6, Math.min(0.6, this.manualRotationX));

    this.lastMouseX = clientX;
    this.lastMouseY = clientY;
  }

  public onMouseUp() {
    this.isDragging = false;
  }

  public update(delta: number) {
    // Smooth lerp (spring-like damping)
    const damping = Math.min(1.0, delta * 3.5);

    this.currentPos.lerp(this.targetPos, damping);
    this.currentLookAt.lerp(this.targetLookAt, damping);

    // Apply manual rotation offsets if any
    if (Math.abs(this.manualRotationX) > 0.001 || Math.abs(this.manualRotationY) > 0.001) {
      if (!this.isDragging) {
        // Return slowly to normal camera track
        this.manualRotationX *= 0.94;
        this.manualRotationY *= 0.94;
      }
    }

    const rotatedPos = this.currentPos.clone();
    rotatedPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.manualRotationY);
    rotatedPos.y += this.manualRotationX * 2;

    this.camera.position.copy(rotatedPos);
    this.camera.lookAt(this.currentLookAt);
  }

  public onResize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
