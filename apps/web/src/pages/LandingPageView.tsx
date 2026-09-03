import React from 'react';
import { LearnedTool, Demonstration, AuditEvent } from '@deputy/domain';
import { LandingNavbar } from '../components/landing/LandingNavbar.js';
import { LandingHero } from '../components/landing/LandingHero.js';
import { ProblemSection } from '../components/landing/ProblemSection.js';
import { DeputyModelSection } from '../components/landing/DeputyModelSection.js';
import { InteractiveCoreSection } from '../components/landing/InteractiveCoreSection.js';
import { LandingFooter } from '../components/landing/LandingFooter.js';
import '../components/landing/landing.css';

interface LandingPageViewProps {
  tools: LearnedTool[];
  demonstrations: Demonstration[];
  auditEvents: AuditEvent[];
  onEnterJudgeMode: () => void;
  onEnterApp: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  tools,
  demonstrations,
  auditEvents,
  onEnterJudgeMode,
  onEnterApp,
}) => {
  return (
    <div className="landing-root">
      {/* Background Subtle Grid */}
      <div className="landing-grid-bg" />

      {/* Sticky Editorial Navbar */}
      <LandingNavbar onEnterJudgeMode={onEnterJudgeMode} onEnterApp={onEnterApp} />

      {/* Section 1: Hero */}
      <LandingHero onEnterJudgeMode={onEnterJudgeMode} onEnterApp={onEnterApp} />

      {/* Section 2: The Problem ("Demonstration is not authorization") */}
      <ProblemSection />

      {/* Section 3: The DEPUTY Model (5-stage synthesis pipeline) */}
      <DeputyModelSection />

      {/* Section 4: Interactive 3D Capability Core (Split 40/60 Layout) */}
      <InteractiveCoreSection
        toolCount={tools.length}
        demonstrationCount={demonstrations.length}
        auditCount={auditEvents.length}
        onEnterApp={onEnterApp}
      />

      {/* Section 5: Editorial Footer */}
      <LandingFooter onEnterApp={onEnterApp} onEnterJudgeMode={onEnterJudgeMode} />
    </div>
  );
};
