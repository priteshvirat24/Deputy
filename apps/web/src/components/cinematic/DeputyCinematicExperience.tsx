import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, X, Maximize2, Minimize2, Shield, FastForward } from 'lucide-react';
import { getSceneAtTime, SCENES, TOTAL_DURATION } from './CinematicTimeline.js';
import { TrustCoreScene } from './TrustCoreScene.js';
import { CinematicText } from './CinematicText.js';
import { TechnicalOverlay } from './TechnicalOverlay.js';
import './cinematic.css';

interface DeputyCinematicExperienceProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeputyCinematicExperience: React.FC<DeputyCinematicExperienceProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Playback timer loop
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    let lastTimestamp = performance.now();
    let animId: number;

    const tick = (now: number) => {
      const delta = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      setCurrentTime(prev => {
        const next = prev + delta * playbackSpeed;
        if (next >= TOTAL_DURATION) {
          setIsPlaying(false);
          return TOTAL_DURATION;
        }
        return next;
      });

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, isPlaying, playbackSpeed]);

  // Keyboard navigation (Space: Play/Pause, Esc: Close, Left/Right: Step)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(p => !p);
      } else if (e.key === 'ArrowRight') {
        setCurrentTime(t => Math.min(TOTAL_DURATION, t + 2));
      } else if (e.key === 'ArrowLeft') {
        setCurrentTime(t => Math.max(0, t - 2));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const { scene, sceneProgress, overallProgress } = getSceneAtTime(currentTime);

  const togglePlay = () => setIsPlaying(p => !p);

  const handleRestart = () => {
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setCurrentTime(ratio * TOTAL_DURATION);
  };

  const jumpToScene = (startTime: number) => {
    setCurrentTime(startTime);
    setIsPlaying(true);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  const formatTime = (secs: number) => {
    const s = Math.floor(secs);
    const ms = Math.floor((secs % 1) * 10);
    return `00:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div ref={containerRef} className="cinematic-experience-root" role="dialog" aria-modal="true">
      {/* 3D WebGL Three.js Canvas on White */}
      <TrustCoreScene currentTime={currentTime} isPlaying={isPlaying} />

      {/* Subtle Technical Radial Grid on White */}
      <div className="cinematic-vignette" />

      {/* Interaction Hint */}
      <div className="cinematic-interaction-cue">
        ✦ Click & Drag to Orbit 3D Core · Scroll to Zoom
      </div>

      {/* Top Controls Bar */}
      <header className="cinematic-topbar">
        <div className="cinematic-brand">
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              background: '#09090b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Shield size={16} />
          </div>
          <span className="cinematic-brand-title">DEPUTY</span>
          <span className="cinematic-brand-badge">JUDGE MODE · 38S</span>
        </div>

        <div className="cinematic-controls-top">
          <button
            type="button"
            className="cinematic-btn-icon"
            onClick={() => setPlaybackSpeed(s => (s === 1.0 ? 1.5 : s === 1.5 ? 2.0 : 1.0))}
            title="Toggle playback speed"
            style={{ width: 'auto', padding: '0 10px', gap: 4 }}
          >
            <FastForward size={13} />
            <span className="mono">{playbackSpeed}x</span>
          </button>

          <button
            type="button"
            className="cinematic-btn-icon"
            onClick={toggleFullscreen}
            title="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          <button
            type="button"
            className="cinematic-btn-icon"
            onClick={onClose}
            style={{
              background: '#fef2f2',
              color: '#dc2626',
              borderColor: '#fecaca',
              width: 'auto',
              padding: '0 12px',
              gap: 6,
              fontWeight: 600,
            }}
            title="Exit Cinematic Experience (Esc)"
          >
            <X size={14} />
            <span>Exit</span>
          </button>
        </div>
      </header>

      {/* Narrative Typography Layer */}
      <CinematicText scene={scene} sceneProgress={sceneProgress} />

      {/* Contextual Technical Evidence Overlay */}
      <TechnicalOverlay scene={scene} sceneProgress={sceneProgress} />

      {/* Bottom Timeline & Control Bar */}
      <footer className="cinematic-bottombar">
        {/* Scrubber Track */}
        <div className="cinematic-scrubber-track" onClick={handleScrubberClick}>
          <div className="cinematic-scrubber-fill" style={{ width: `${overallProgress * 100}%` }}>
            <div className="cinematic-scrubber-head" />
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="cinematic-timeline-nav">
          {/* Milestone Scene Markers */}
          <div className="cinematic-milestones">
            {SCENES.map(s => {
              const isActive = s.id === scene.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`cinematic-milestone-btn ${isActive ? 'active' : ''}`}
                  onClick={() => jumpToScene(s.startTime)}
                >
                  {s.index + 1}. {s.title.split(' ')[0]}
                </button>
              );
            })}
          </div>

          {/* Time & Play/Pause Actions */}
          <div className="cinematic-controls-bottom">
            <span className="cinematic-time-readout">{formatTime(currentTime)} / 00:38.0</span>

            <button
              type="button"
              className="cinematic-btn-icon"
              onClick={handleRestart}
              title="Restart from beginning"
            >
              <RotateCcw size={14} />
            </button>

            <button
              type="button"
              className="cinematic-btn-play"
              onClick={togglePlay}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? (
                <Pause size={14} fill="currentColor" />
              ) : (
                <Play size={14} fill="currentColor" />
              )}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
