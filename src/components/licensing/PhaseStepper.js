import { LICENSING_PHASES } from '../../constants';

export default function PhaseStepper({ activePhase, unlockedPhases, completedPhases = [], onPhaseClick }) {
  return (
    <div className="phase-stepper">
      {LICENSING_PHASES.map((phase, i) => {
        const isActive = phase.key === activePhase;
        const isUnlocked = unlockedPhases.includes(phase.key);
        const isDone = completedPhases.includes(phase.key);
        const state = isDone ? 'done' : isActive ? 'active' : isUnlocked ? 'unlocked' : 'locked';
        const clickable = isUnlocked && onPhaseClick && !isActive;
        return (
          <div
            key={phase.key}
            className={`phase-step phase-${state}${isActive ? ' phase-selected' : ''} ${clickable ? 'phase-clickable' : ''}`}
            onClick={clickable ? () => onPhaseClick(phase.key) : undefined}
          >
            <div className="phase-circle">
              {isDone ? '✓' : isUnlocked ? i + 1 : '🔒'}
            </div>
            <span className="phase-label">{phase.label}</span>
          </div>
        );
      })}
    </div>
  );
}
