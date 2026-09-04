import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SpatialNodeGraph3D, SPATIAL_NODES } from '../cinematic/SpatialNodeGraph3D.js';

export type CoreLayer = 'ALL' | 'EVIDENCE' | 'SCHEMA' | 'AUTHORIZATION' | 'EXECUTION';

interface CapabilityCore3DProps {
  activeLayer: CoreLayer;
  onHoverNode?: (nodeName: string | null, clientPos: { x: number; y: number } | null) => void;
  onSelectNode?: (nodeName: string) => void;
}

export const CapabilityCore3D: React.FC<CapabilityCore3DProps> = ({
  activeLayer,
  onHoverNode,
  onSelectNode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const graphRef = useRef<SpatialNodeGraph3D | null>(null);

  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.filterLayer(activeLayer);
    }
  }, [activeLayer]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 540;

    // 1. Scene on Pure White Architectural Canvas
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    scene.fog = new THREE.FogExp2(0xffffff, 0.025);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.4, 7.2);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 4. OrbitControls with smooth damping
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 0.9;
    controls.minDistance = 3.5;
    controls.maxDistance = 14.0;
    controls.maxPolarAngle = Math.PI * 0.58; // Don't flip under floor

    // 5. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xf8fafc, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(5, 9, 6);
    scene.add(keyLight);

    const rimViolet = new THREE.PointLight(0x7c3aed, 2.5, 12);
    rimViolet.position.set(-4, 3, -3);
    scene.add(rimViolet);

    const rimCyan = new THREE.PointLight(0x0891b2, 2.0, 12);
    rimCyan.position.set(4, -2, -3);
    scene.add(rimCyan);

    // 6. Spatial 16-Node Graph Constellation
    const graph = new SpatialNodeGraph3D();
    graphRef.current = graph;
    scene.add(graph.group);

    // Mouse & Raycaster state
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    let hoveredMesh: THREE.Mesh | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      // Raycast against the 16 spherical nodes
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(graph.nodeMeshes);

      if (hits.length > 0 && hits[0]) {
        const hitMesh = hits[0].object as THREE.Mesh;
        if (hoveredMesh !== hitMesh) {
          if (hoveredMesh) hoveredMesh.scale.set(1.0, 1.0, 1.0);
          hoveredMesh = hitMesh;
          hoveredMesh.scale.set(1.4, 1.4, 1.4);
          renderer.domElement.style.cursor = 'pointer';

          const def = SPATIAL_NODES.find(n => n.id === hitMesh.userData.id);
          if (onHoverNode && def) {
            onHoverNode(`${def.name} · ${def.role}`, { x: e.clientX, y: e.clientY });
          }
        }
      } else {
        if (hoveredMesh) {
          hoveredMesh.scale.set(1.0, 1.0, 1.0);
          hoveredMesh = null;
          renderer.domElement.style.cursor = 'grab';
          if (onHoverNode) onHoverNode(null, null);
        }
      }
    };

    const handleClick = () => {
      if (hoveredMesh && onSelectNode) {
        onSelectNode(hoveredMesh.userData.name);
      }
    };

    const dom = renderer.domElement;
    dom.style.cursor = 'grab';
    dom.addEventListener('mousemove', handleMouseMove);
    dom.addEventListener('click', handleClick);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    const startTime = performance.now();
    let lastTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const time = (now - startTime) / 1000;
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // 1. Continuous slow majestic rotation of the entire constellation
      graph.group.rotation.y += 0.003;

      // 2. Update 16 spherical nodes (harmonic breathing & dynamic connecting edges)
      graph.update(time, delta);

      // 3. Update OrbitControls
      controls.update();

      // 4. Render
      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      dom.removeEventListener('mousemove', handleMouseMove);
      dom.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);

      controls.dispose();
      graph.dispose();
      renderer.dispose();

      if (dom.parentNode === container) {
        container.removeChild(dom);
      }
    };
  }, [onHoverNode, onSelectNode]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};
