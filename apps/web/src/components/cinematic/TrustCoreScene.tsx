import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { getSceneAtTime } from './CinematicTimeline.js';
import { CinematicCamera } from './CinematicCamera.js';
import { SceneLighting } from './SceneLighting.js';
import { ParticleField } from './ParticleField.js';
import { SpatialNodeGraph3D } from './SpatialNodeGraph3D.js';

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
  const graphRef = useRef<SpatialNodeGraph3D | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene on Pure White Architectural Canvas
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
    renderer.toneMappingExposure = 1.2;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting
    const lighting = new SceneLighting();
    lightingRef.current = lighting;
    scene.add(lighting.group);

    // 5. Subtle Dust Particles
    const particles = new ParticleField();
    particlesRef.current = particles;
    scene.add(particles.group);

    // 6. 16-Node Spatial Capability Graph System
    const graph = new SpatialNodeGraph3D();
    graphRef.current = graph;
    scene.add(graph.group);

    // Mouse drag-to-inspect & zoom listeners
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
    const startTime = performance.now();
    let lastTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const time = (now - startTime) / 1000;
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Update camera controller
      cameraController.update(delta);

      // Rotate entire spatial constellation gently
      graph.group.rotation.y += 0.003;

      // Update 16 spherical nodes & dynamic graph edges
      graph.update(time, delta);

      // Update subtle ambient dust particles
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
      graph.dispose();
      renderer.dispose();

      if (mountRef.current && dom.parentNode === mountRef.current) {
        mountRef.current.removeChild(dom);
      }
    };
  }, []);

  // Update scene based on currentTime & timeline state
  useEffect(() => {
    if (
      !sceneRef.current ||
      !cameraControllerRef.current ||
      !lightingRef.current ||
      !graphRef.current
    ) {
      return;
    }

    const { scene, sceneProgress } = getSceneAtTime(currentTime);

    // 1. Update Camera Choreography
    cameraControllerRef.current.setTargets(scene.cameraPosition, scene.cameraTarget);

    // 2. Update Lighting & Color State
    lightingRef.current.updateColor(scene.coreColor, scene.coreIntensity);

    // 3. Update 16 Spherical Nodes Cinematic Formation
    graphRef.current.setCinematicFormation(scene.id, sceneProgress);
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
