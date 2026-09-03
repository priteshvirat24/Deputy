import * as THREE from 'three';

export class SceneLighting {
  public group: THREE.Group;
  private keyLight: THREE.DirectionalLight;
  private rimLightViolet: THREE.PointLight;
  private rimLightCyan: THREE.PointLight;
  private coreLight: THREE.PointLight;
  private ambientLight: THREE.AmbientLight;

  constructor() {
    this.group = new THREE.Group();

    // Subtle Ambient
    this.ambientLight = new THREE.AmbientLight(0x0f172a, 0.7);
    this.group.add(this.ambientLight);

    // Key Directional Light
    this.keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.keyLight.position.set(4, 6, 5);
    this.group.add(this.keyLight);

    // Rim Light (Electric Violet)
    this.rimLightViolet = new THREE.PointLight(0x818cf8, 2.5, 12);
    this.rimLightViolet.position.set(-4, 3, -3);
    this.group.add(this.rimLightViolet);

    // Rim Light (Cyan)
    this.rimLightCyan = new THREE.PointLight(0x06b6d4, 2.0, 12);
    this.rimLightCyan.position.set(4, -2, -3);
    this.group.add(this.rimLightCyan);

    // Core Internal Light (Floating inside the Trust Core)
    this.coreLight = new THREE.PointLight(0x818cf8, 2.0, 6);
    this.coreLight.position.set(0, 0, 0);
    this.group.add(this.coreLight);
  }

  public updateColor(hexColor: string, intensity: number) {
    const col = new THREE.Color(hexColor);
    this.coreLight.color.copy(col);
    this.coreLight.intensity = intensity * 2.2;
  }
}
