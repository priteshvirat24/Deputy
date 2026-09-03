import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

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

  // Mesh & Layer references
  const coreGroupRef = useRef<THREE.Group | null>(null);
  const innerOctaRef = useRef<THREE.Mesh | null>(null);
  const ringsRef = useRef<{ [key: string]: THREE.Line }>({});
  const nodesRef = useRef<
    { mesh: THREE.Mesh; name: string; desc: string; connector: THREE.Line }[]
  >([]);

  // Mouse interaction state (Orbit & Drag)
  const isDragging = useRef(false);
  const rotation = useRef({ x: 0.1, y: 0.2, targetX: 0.1, targetY: 0.2 });
  const zoom = useRef({ val: 7.5, target: 7.5 });
  const lastMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene on Pure White Architectural Canvas
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    scene.fog = new THREE.FogExp2(0xffffff, 0.02);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 7.5);
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    containerRef.current.appendChild(renderer.domElement);

    // 4. Studio Lighting on White
    const ambientLight = new THREE.AmbientLight(0xf1f5f9, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);

    const rimLightViolet = new THREE.PointLight(0x7c3aed, 2.2, 10);
    rimLightViolet.position.set(-4, 3, -3);
    scene.add(rimLightViolet);

    const rimLightCyan = new THREE.PointLight(0x0891b2, 1.8, 10);
    rimLightCyan.position.set(4, -2, -3);
    scene.add(rimLightCyan);

    // 5. Main Hero Core Group
    const coreGroup = new THREE.Group();
    coreGroupRef.current = coreGroup;
    scene.add(coreGroup);

    // Subtle Ground Platform with Contact Shadow
    const platform = new THREE.Group();
    platform.position.y = -1.6;

    const shadowGeo = new THREE.CircleGeometry(1.6, 32);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.18,
    });
    platform.add(new THREE.Mesh(shadowGeo, shadowMat));

    for (let r = 1.2; r <= 3.8; r += 0.8) {
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
        opacity: 0.5 - r * 0.08,
      });
      platform.add(new THREE.Line(circleGeo, circleMat));
    }
    scene.add(platform);

    // Central Dark Graphite Core
    const cubeGeo = new THREE.BoxGeometry(1.4, 1.4, 1.4);
    const cubeMat = new THREE.MeshPhysicalMaterial({
      color: 0x18181b,
      roughness: 0.2,
      metalness: 0.5,
      transparent: true,
      opacity: 0.85,
      transmission: 0.25,
      reflectivity: 0.9,
    });
    const cubeMesh = new THREE.Mesh(cubeGeo, cubeMat);
    coreGroup.add(cubeMesh);

    // Cube Edge Lines
    const edges = new THREE.EdgesGeometry(cubeGeo);
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.6,
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
      opacity: 0.25,
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
    createRing(2.9, 0x6366f1, Math.PI * 0.3, Math.PI * 0.2, 'AUTHORIZATION');
    createRing(3.3, 0x059669, 0, Math.PI * 0.35, 'EXECUTION');

    // Semantic Action Nodes with Connecting Data Rays
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

    const nodeGeo = new THREE.SphereGeometry(0.14, 16, 16);
    const nodesList: { mesh: THREE.Mesh; name: string; desc: string; connector: THREE.Line }[] = [];

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

      // Connecting line from node to center
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(x, 0, z),
      ]);
      const lineMat = new THREE.LineDashedMaterial({
        color: item.color,
        dashSize: 0.15,
        gapSize: 0.1,
        transparent: true,
        opacity: 0.35,
      });
      const connector = new THREE.Line(lineGeo, lineMat);
      connector.computeLineDistances();
      coreGroup.add(connector);

      nodesList.push({ mesh: nodeMesh, name: item.name, desc: item.desc, connector });
    });
    nodesRef.current = nodesList;

    // Raycaster for Hover & Click
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    const dom = renderer.domElement;

    // Direct Drag-to-Rotate Interaction
    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      if (isDragging.current) {
        const deltaX = e.clientX - lastMouse.current.x;
        const deltaY = e.clientY - lastMouse.current.y;
        rotation.current.targetY += deltaX * 0.008;
        rotation.current.targetX += deltaY * 0.008;
        rotation.current.targetX = Math.max(-0.8, Math.min(0.8, rotation.current.targetX));
        lastMouse.current = { x: e.clientX, y: e.clientY };
      }

      // Raycasting for interactive node hover
      mouseVector.set(x, y);
      raycaster.setFromCamera(mouseVector, camera);

      const meshes = nodesList.map(n => n.mesh);
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0 && intersects[0]) {
        const hit = intersects[0].object as THREE.Mesh;
        const matched = nodesList.find(n => n.mesh === hit);
        if (matched) {
          dom.style.cursor = 'pointer';
          (matched.connector.material as THREE.LineDashedMaterial).opacity = 0.9;
          matched.mesh.scale.set(1.4, 1.4, 1.4);
          if (onHoverNode) {
            onHoverNode(matched.name, { x: e.clientX, y: e.clientY });
          }
          return;
        }
      }

      dom.style.cursor = isDragging.current ? 'grabbing' : 'grab';
      nodesList.forEach(n => {
        (n.connector.material as THREE.LineDashedMaterial).opacity = 0.35;
        n.mesh.scale.set(1.0, 1.0, 1.0);
      });
      if (onHoverNode) {
        onHoverNode(null, null);
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      dom.style.cursor = 'grab';
    };

    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      mouseVector.set(x, y);
      raycaster.setFromCamera(mouseVector, camera);

      const meshes = nodesList.map(n => n.mesh);
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0 && intersects[0]) {
        const hit = intersects[0].object as THREE.Mesh;
        const matched = nodesList.find(n => n.mesh === hit);
        if (matched && onSelectNode) {
          onSelectNode(matched.name);
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoom.current.target += e.deltaY * 0.005;
      zoom.current.target = Math.max(5.0, Math.min(11.0, zoom.current.target));
    };

    dom.style.cursor = 'grab';
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('click', handleClick);
    dom.addEventListener('wheel', handleWheel, { passive: false });

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
      // Smooth rotation damping
      rotation.current.x += (rotation.current.targetX - rotation.current.x) * 0.08;
      rotation.current.y += (rotation.current.targetY - rotation.current.y) * 0.08;

      // Smooth zoom damping
      zoom.current.val += (zoom.current.target - zoom.current.val) * 0.08;
      camera.position.z = zoom.current.val;

      if (coreGroupRef.current) {
        if (!isDragging.current) {
          rotation.current.targetY += 0.002; // slow continuous idle spin
        }
        coreGroupRef.current.rotation.y = rotation.current.y;
        coreGroupRef.current.rotation.x = rotation.current.x;
      }

      if (innerOctaRef.current) {
        innerOctaRef.current.rotation.x -= 0.006;
        innerOctaRef.current.rotation.y += 0.008;
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
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dom.removeEventListener('click', handleClick);
      dom.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);

      renderer.dispose();
      if (containerRef.current && dom.parentNode === containerRef.current) {
        containerRef.current.removeChild(dom);
      }
    };
  }, [onHoverNode, onSelectNode]);

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
        mat.color.setHex(0x7c3aed);
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
