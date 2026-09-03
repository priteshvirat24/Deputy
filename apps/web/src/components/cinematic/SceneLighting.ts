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

    // Soft Studio Ambient on White
    this.ambientLight = new THREE.AmbientLight(0xf1f5f9, 1.2);
    this.group.add(this.ambientLight);

    // Key Directional Light
    this.keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    this.keyLight.position.set(4, 7, 5);
    this.group.add(this.keyLight);

    // Rim Light (Violet)
    this.rimLightViolet = new THREE.PointLight(0x7c3aed, 2.2, 12);
    this.rimLightViolet.position.set(-4, 3, -3);
    this.group.add(this.rimLightViolet);

    // Rim Light (Cyan)
    this.rimLightCyan = new THREE.PointLight(0x0891b2, 1.8, 12);
    this.rimLightCyan.position.set(4, -2, -3);
    this.group.add(this.rimLightCyan);

    // Core Internal Light
    this.coreLight = new THREE.PointLight(0x7c3aed, 2.4, 6);
    this.coreLight.position.set(0, 0, 0);
    this.group.add(this.coreLight);
  }

  public updateColor(hexColor: string, intensity: number) {
    const col = new THREE.Color(hexColor);
    this.coreLight.color.copy(col);
    this.coreLight.intensity = intensity * 2.5;
  }
}
