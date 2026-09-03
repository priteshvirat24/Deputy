import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { getSceneAtTime } from './CinematicTimeline.js';
import { CinematicCamera } from './CinematicCamera.js';
import { SceneLighting } from './SceneLighting.js';
import { ParticleField } from './ParticleField.js';
import { ActionTrace3D } from './ActionTrace3D.js';
import { CapabilityOrbit } from './CapabilityOrbit.js';
import { AuditChain3D } from './AuditChain3D.js';

interface TrustCoreSceneProps {
  currentTime: number; // in seconds
  isPlaying: boolean;
}

export const TrustCoreScene: React.FC<TrustCoreSceneProps> = ({
  currentTime,
  isPlaying: _isPlaying,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraControllerRef = useRef<CinematicCamera | null>(null);
  const lightingRef = useRef<SceneLighting | null>(null);
  const particlesRef = useRef<ParticleField | null>(null);
  const actionTraceRef = useRef<ActionTrace3D | null>(null);
  const capabilityOrbitRef = useRef<CapabilityOrbit | null>(null);
  const auditChainRef = useRef<AuditChain3D | null>(null);

  // Trust Core Mesh References
  const outerCubeRef = useRef<THREE.Mesh | null>(null);
  const innerCoreRef = useRef<THREE.Mesh | null>(null);
  const platformRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene on Pure White Architectural Foundation
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    scene.fog = new THREE.FogExp2(0xffffff, 0.02);
    sceneRef.current = scene;

    // 2. Camera Controller
    const cameraController = new CinematicCamera(width / height);
    cameraControllerRef.current = cameraController;

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
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting
    const lighting = new SceneLighting();
    lightingRef.current = lighting;
    scene.add(lighting.group);

    // 5. Particles
    const particles = new ParticleField();
    particlesRef.current = particles;
    scene.add(particles.group);

    // 6. Action Trace (3D Spline)
    const actionTrace = new ActionTrace3D();
    actionTraceRef.current = actionTrace;
    scene.add(actionTrace.group);

    // 7. Capability Orbit Rings & Parameters
    const capabilityOrbit = new CapabilityOrbit();
    capabilityOrbitRef.current = capabilityOrbit;
    scene.add(capabilityOrbit.group);

    // 8. Audit Chain
    const auditChain = new AuditChain3D();
    auditChainRef.current = auditChain;
    scene.add(auditChain.group);

    // 9. Hero "Capability Trust Core" Object
    const coreGroup = new THREE.Group();

    // Outer Translucent Dark-Graphite Box (High Contrast on White)
    const outerGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const outerMat = new THREE.MeshPhysicalMaterial({
      color: 0x18181b,
      transparent: true,
      opacity: 0.85,
      roughness: 0.18,
      metalness: 0.45,
      transmission: 0.25,
      ior: 1.45,
      reflectivity: 0.9,
    });
    const outerCube = new THREE.Mesh(outerGeo, outerMat);
    outerCubeRef.current = outerCube;
    coreGroup.add(outerCube);

    // Outer Edge Highlights
    const edgeGeo = new THREE.EdgesGeometry(outerGeo);
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.6,
    });
    const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
    outerCube.add(edgeLines);

    // Inner Luminous Geometric Core (Octahedron)
    const innerGeo = new THREE.OctahedronGeometry(0.55, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x7c3aed,
      wireframe: false,
    });
    const innerCore = new THREE.Mesh(innerGeo, innerMat);
    innerCoreRef.current = innerCore;
    coreGroup.add(innerCore);

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

    scene.add(coreGroup);

    // 10. Subtle Circular Ground Platform with Contact Shadow
    const platform = new THREE.Group();
    platform.position.y = -1.6;

    // Contact shadow under the core
    const shadowGeo = new THREE.CircleGeometry(1.6, 32);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.2,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    platform.add(shadowMesh);

    // Circular concentric lines
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
        opacity: 0.6 - r * 0.08,
      });
      platform.add(new THREE.Line(circleGeo, circleMat));
    }
    platformRef.current = platform;
    scene.add(platform);

    // Mouse Listeners for drag-to-inspect
    const handleMouseDown = (e: MouseEvent) => cameraController.onMouseDown(e.clientX, e.clientY);
    const handleMouseMove = (e: MouseEvent) => cameraController.onMouseMove(e.clientX, e.clientY);
    const handleMouseUp = () => cameraController.onMouseUp();
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraController.onWheel(e.deltaY);
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraController.onResize(w, h);
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let lastTime = performance.now();
    const animate = () => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Update camera controller
      cameraController.update(delta);

      // Rotate Trust Core
      if (outerCubeRef.current) {
        outerCubeRef.current.rotation.x += 0.003;
        outerCubeRef.current.rotation.y += 0.005;
      }
      if (innerCoreRef.current) {
        innerCoreRef.current.rotation.x -= 0.006;
        innerCoreRef.current.rotation.y += 0.008;
      }

      // Update particles
      particles.update(delta);

      renderer.render(scene, cameraController.camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dom.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);

      particles.dispose();
      actionTrace.dispose();
      capabilityOrbit.dispose();
      auditChain.dispose();
      renderer.dispose();

      if (mountRef.current && dom.parentNode === mountRef.current) {
        mountRef.current.removeChild(dom);
      }
    };
  }, []);

  // Update scene based on currentTime & timeline state
  useEffect(() => {
    if (!sceneRef.current || !cameraControllerRef.current || !lightingRef.current) return;

    const { scene, sceneProgress } = getSceneAtTime(currentTime);

    // 1. Update Camera Choreography
    cameraControllerRef.current.setTargets(scene.cameraPosition, scene.cameraTarget);

    // 2. Update Lighting & Color State
    lightingRef.current.updateColor(scene.coreColor, scene.coreIntensity);

    // 3. Update Inner Core & Outer Cube Colors
    if (innerCoreRef.current) {
      (innerCoreRef.current.material as THREE.MeshBasicMaterial).color.set(scene.coreColor);
    }

    // 4. Update Action Trace Spline
    if (actionTraceRef.current) {
      const isTraceActive = scene.id === 'DEMONSTRATE' || scene.id === 'TAMPER_REJECTION';
      actionTraceRef.current.setTamperMode(scene.id === 'TAMPER_REJECTION');
      actionTraceRef.current.update(sceneProgress, isTraceActive);
    }

    // 5. Update Capability Orbit
    if (capabilityOrbitRef.current) {
      capabilityOrbitRef.current.update(currentTime, scene.id, sceneProgress);
    }

    // 6. Update Audit Chain
    if (auditChainRef.current) {
      const isAuditActive = scene.id === 'ARCHITECTURE';
      auditChainRef.current.update(sceneProgress, isAuditActive);
    }
  }, [currentTime]);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1,
        cursor: 'grab',
      }}
    />
  );
};
