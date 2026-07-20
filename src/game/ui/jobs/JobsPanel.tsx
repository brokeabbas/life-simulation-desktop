// src/game/ui/jobs/JobsPanel.tsx
import React from 'react';
import CurrentEmployment from './CurrentEmployment';
import { BriefcaseIcon } from '../Icon';
import SeekJobsView from './SeekJobsView'; // ✅ add this import

type Mode = 'seek' | 'current';

export default function JobsPanel() {
  const [mode, setMode] = React.useState<Mode>('seek');

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="header" style={{ position: 'sticky', top: 0, zIndex: 5, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <BriefcaseIcon />
          <div style={{ minWidth: 0 }}>
            <div className="title">Jobs</div>
            <div className="sub">Find work, grow your career</div>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Jobs mode switch"
          style={{
            marginLeft: 'auto',
            display: 'inline-grid',
            gridAutoFlow: 'column',
            gap: 6,
            padding: 4,
            border: '1px solid var(--border)',
            borderRadius: 12,
            background: 'linear-gradient(170deg, #0d1424, #0c1322)',
          }}
        >
          <SegButton active={mode === 'seek'} onClick={() => setMode('seek')} label="Seek Jobs" />
          <SegButton active={mode === 'current'} onClick={() => setMode('current')} label="Current Employment" />
        </div>
      </div>

      {/* ✅ switch to the view that wires the modal */}
      {mode === 'seek' && <SeekJobsView />}

      {mode === 'current' && <CurrentEmployment />}
    </div>
  );
}

function SegButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="btn"
      style={{
        padding: '6px 10px',
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: active ? 'linear-gradient(160deg, #0ea5e9, #3b82f6)' : 'transparent',
        color: active ? '#fff' : 'var(--text)',
        boxShadow: active ? '0 8px 24px rgba(33,112,224,.35)' : 'none',
        cursor: 'pointer',
        fontSize: 12,
      }}
    >
      {label}
    </button>
  );
}
