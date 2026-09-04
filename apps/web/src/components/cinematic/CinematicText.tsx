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
          padding: '3px 9px',
          borderRadius: '4px',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
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
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: scene.semanticColor,
          }}
        />
        <span>{scene.technicalLabel}</span>
      </div>

      {/* Primary Statement (Crisp on White) */}
      <h2
        style={{
          fontSize: 'clamp(1.6rem, 3.4vw, 2.5rem)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: '#09090b',
          lineHeight: 1.15,
          marginBottom: 6,
        }}
      >
        {scene.title}
      </h2>

      {/* Tagline */}
      <div
        style={{
          fontSize: 'clamp(0.95rem, 1.4vw, 1.25rem)',
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
          fontSize: 'clamp(0.84rem, 1.1vw, 0.95rem)',
          color: '#52525b',
          lineHeight: 1.55,
          maxWidth: '480px',
        }}
      >
        {scene.supporting}
      </p>
    </div>
  );
};
