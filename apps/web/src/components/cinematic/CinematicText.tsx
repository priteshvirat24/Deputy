import React from 'react';
import { SceneDefinition } from './CinematicTimeline.js';

interface CinematicTextProps {
  scene: SceneDefinition;
  sceneProgress: number;
}

export const CinematicText: React.FC<CinematicTextProps> = ({ scene, sceneProgress }) => {
  // Fade in during first 20% of scene, hold, fade slightly out in last 10%
  const opacity =
    sceneProgress < 0.2
      ? sceneProgress / 0.2
      : sceneProgress > 0.9
        ? (1.0 - sceneProgress) / 0.1
        : 1.0;

  const translateY = (1.0 - Math.min(1.0, sceneProgress / 0.2)) * 14;

  return (
    <div
      className="cinematic-text-container"
      style={{
        position: 'absolute',
        bottom: '12%',
        left: '6%',
        maxWidth: '560px',
        zIndex: 10,
        opacity,
        transform: `translateY(${translateY}px)`,
        transition:
          'opacity 180ms cubic-bezier(0.16, 1, 0.3, 1), transform 180ms cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: 'none',
      }}
    >
      {/* Category / Technical cue */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '2px 8px',
          borderRadius: '4px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '0.68rem',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: scene.semanticColor,
          marginBottom: 8,
          textTransform: 'uppercase',
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: scene.semanticColor,
            boxShadow: `0 0 8px ${scene.semanticColor}`,
          }}
        />
        <span>{scene.technicalLabel}</span>
      </div>

      {/* Primary Statement */}
      <h2
        style={{
          fontSize: 'clamp(1.5rem, 3.2vw, 2.4rem)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: '#ffffff',
          lineHeight: 1.15,
          marginBottom: 6,
        }}
      >
        {scene.title}
      </h2>

      {/* Tagline */}
      <div
        style={{
          fontSize: 'clamp(0.95rem, 1.4vw, 1.2rem)',
          fontWeight: 600,
          color: scene.semanticColor,
          marginBottom: 8,
          letterSpacing: '-0.01em',
        }}
      >
        {scene.tagline}
      </div>

      {/* Supporting text */}
      <p
        style={{
          fontSize: 'clamp(0.8rem, 1.1vw, 0.92rem)',
          color: '#94a3b8',
          lineHeight: 1.5,
          maxWidth: '480px',
        }}
      >
        {scene.supporting}
      </p>
    </div>
  );
};
