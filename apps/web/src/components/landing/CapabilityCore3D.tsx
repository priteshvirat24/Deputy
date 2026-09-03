import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export type CoreLayer = 'ALL' | 'EVIDENCE' | 'SCHEMA' | 'AUTHORIZATION' | 'EXECUTION';

interface CapabilityCore3DProps {
  activeLayer: CoreLayer;
  onHoverNode?: (nodeName: string | null, clientPos: { x: number; y: number } | null) => void;
}

export const CapabilityCore3D: React.FC<CapabilityCore3DProps> = ({ activeLayer, onHoverNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Mesh & Layer references
  const coreGroupRef = useRef<THREE.Group | null>(null);
  const innerOctaRef = useRef<THREE.Mesh | null>(null);
  const ringsRef = useRef<{ [key: string]: THREE.Line }>({});
  const nodesRef = useRef<{ mesh: THREE.Mesh; name: string; desc: string }[]>([]);

  // Mouse interaction state
  const mousePos = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07080a);
    scene.fog = new THREE.FogExp2(0x07080a, 0.05);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 7.5);
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    containerRef.current.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.0);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);

    const rimLightViolet = new THREE.PointLight(0x7c3aed, 2.5, 10);
    rimLightViolet.position.set(-4, 2, -3);
    scene.add(rimLightViolet);

    const rimLightCyan = new THREE.PointLight(0x06b6d4, 2.0, 10);
    rimLightCyan.position.set(4, -2, -3);
    scene.add(rimLightCyan);

    // 5. Main Hero Core Group
    const coreGroup = new THREE.Group();
    coreGroupRef.current = coreGroup;
    scene.add(coreGroup);

    // Central Dark Graphite Core
    const cubeGeo = new THREE.BoxGeometry(1.4, 1.4, 1.4);
    const cubeMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      roughness: 0.15,
      metalness: 0.6,
      transparent: true,
      opacity: 0.75,
      transmission: 0.4,
      reflectivity: 0.9,
    });
    const cubeMesh = new THREE.Mesh(cubeGeo, cubeMat);
    coreGroup.add(cubeMesh);

    // Cube Edge Lines
    const edges = new THREE.EdgesGeometry(cubeGeo);
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.45,
    });
    const edgeLines = new THREE.LineSegments(edges, edgeMat);
    cubeMesh.add(edgeLines);

    // Inner Geometric Luminous Octahedron
    const octaGeo = new THREE.OctahedronGeometry(0.55, 0);
    const octaMat = new THREE.MeshBasicMaterial({ color: 0x7c3aed });
    const innerOcta = new THREE.Mesh(octaGeo, octaMat);
    innerOctaRef.current = innerOcta;
    coreGroup.add(innerOcta);

    // Inner Wireframe Cage
    const cageGeo = new THREE.OctahedronGeometry(0.72, 1);
    const cageMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
    });
    const cage = new THREE.Mesh(cageGeo, cageMat);
    coreGroup.add(cage);

    // Concentric Precision Rings
    const createRing = (
      radius: number,
      color: number,
      tiltX: number,
      tiltY: number,
      key: string,
    ) => {
      const ringGeo = new THREE.BufferGeometry();
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
      }
      ringGeo.setFromPoints(points);
      const ringMat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.45,
        linewidth: 2,
      });
      const ring = new THREE.Line(ringGeo, ringMat);
      ring.rotation.x = tiltX;
      ring.rotation.y = tiltY;
      coreGroup.add(ring);
      ringsRef.current[key] = ring;
      return ring;
    };

    createRing(2.1, 0x0891b2, Math.PI * 0.15, 0, 'EVIDENCE');
    createRing(2.5, 0x7c3aed, -Math.PI * 0.25, Math.PI * 0.1, 'SCHEMA');
    createRing(2.9, 0x818cf8, Math.PI * 0.3, Math.PI * 0.2, 'AUTHORIZATION');
    createRing(3.3, 0x059669, 0, Math.PI * 0.35, 'EXECUTION');

    // Semantic Action Nodes
    const nodeNames = [
      {
        name: 'customer.create',
        desc: 'Registers new customer in verified CRM',
        color: 0x0891b2,
        radius: 2.1,
        angle: 0,
      },
      {
        name: 'invoice.create',
        desc: 'Generates accounts receivable invoice',
        color: 0x7c3aed,
        radius: 2.5,
        angle: 2.1,
      },
      {
        name: 'followup.schedule',
        desc: 'Schedules calendar reminder task',
        color: 0x059669,
        radius: 2.9,
        angle: 4.2,
      },
    ];

    const nodeGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const nodesList: { mesh: THREE.Mesh; name: string; desc: string }[] = [];

    nodeNames.forEach(item => {
      const nodeMat = new THREE.MeshBasicMaterial({
        color: item.color,
        transparent: true,
        opacity: 0.9,
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      const x = Math.cos(item.angle) * item.radius;
      const z = Math.sin(item.angle) * item.radius;
      nodeMesh.position.set(x, 0, z);
      coreGroup.add(nodeMesh);
      nodesList.push({ mesh: nodeMesh, name: item.name, desc: item.desc });
    });
    nodesRef.current = nodesList;

    // Raycaster for Hover
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      mousePos.current.targetX = x * 0.35;
      mousePos.current.targetY = y * 0.25;

      mouseVector.set(x, y);
      raycaster.setFromCamera(mouseVector, camera);

      const meshes = nodesList.map(n => n.mesh);
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0 && intersects[0]) {
        const hit = intersects[0].object as THREE.Mesh;
        const matched = nodesList.find(n => n.mesh === hit);
        if (matched && onHoverNode) {
          onHoverNode(matched.name, { x: e.clientX, y: e.clientY });
        }
      } else if (onHoverNode) {
        onHoverNode(null, null);
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      // Smooth mouse follow
      mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.05;
      mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * 0.05;

      if (coreGroupRef.current) {
        coreGroupRef.current.rotation.y += 0.003;
        coreGroupRef.current.rotation.x = mousePos.current.y * 0.6;
        coreGroupRef.current.rotation.z = -mousePos.current.x * 0.4;
      }

      if (innerOctaRef.current) {
        innerOctaRef.current.rotation.x -= 0.008;
        innerOctaRef.current.rotation.y += 0.01;
      }

      // Rotate individual rings
      if (ringsRef.current['EVIDENCE']) ringsRef.current['EVIDENCE'].rotation.z += 0.004;
      if (ringsRef.current['SCHEMA']) ringsRef.current['SCHEMA'].rotation.z -= 0.003;
      if (ringsRef.current['AUTHORIZATION']) ringsRef.current['AUTHORIZATION'].rotation.z += 0.005;
      if (ringsRef.current['EXECUTION']) ringsRef.current['EXECUTION'].rotation.z -= 0.004;

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      dom.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      renderer.dispose();
      if (containerRef.current && dom.parentNode === containerRef.current) {
        containerRef.current.removeChild(dom);
      }
    };
  }, [onHoverNode]);

  // Handle activeLayer changes
  useEffect(() => {
    Object.entries(ringsRef.current).forEach(([key, ring]) => {
      const mat = ring.material as THREE.LineBasicMaterial;
      if (activeLayer === 'ALL' || activeLayer === key) {
        mat.opacity = 0.8;
      } else {
        mat.opacity = 0.15;
      }
    });

    if (innerOctaRef.current) {
      const mat = innerOctaRef.current.material as THREE.MeshBasicMaterial;
      if (activeLayer === 'AUTHORIZATION') {
        mat.color.setHex(0x818cf8);
      } else if (activeLayer === 'EXECUTION') {
        mat.color.setHex(0x059669);
      } else if (activeLayer === 'EVIDENCE') {
        mat.color.setHex(0x0891b2);
      } else {
        mat.color.setHex(0x7c3aed);
      }
    }
  }, [activeLayer]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};
