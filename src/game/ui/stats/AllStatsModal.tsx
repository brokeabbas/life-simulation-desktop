import React from 'react';
import { createPortal } from 'react-dom';
import StarMeter from './StarMeter';
import GroupSection from './GroupSection';
import {
  CORE_STAT_KEYS,
  PROFESSIONAL_STAT_KEYS,
  RELATIONSHIP_STAT_KEYS,
  PERSONAL_STAT_KEYS,
  SKILLS_STAT_KEYS,
  MIND_STAT_KEYS,
  GROUP_CAPACITY,
  type StatBlock,
} from '../../types';

type Props = {
  open: boolean;
  onClose: () => void;
  stats: StatBlock;
  star: number;
  seed: string;
};

export default function AllStatsModal({ open, onClose, stats, star, seed }: Props) {
  if (!open) return null;
  if (typeof document === 'undefined') return null;

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const node = (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,.45)',
        display: 'grid',
        placeItems: 'center',
        padding: 12,
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="all-stats-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 'min(1180px, 98vw)',     // wider modal
          maxHeight: '92vh',
          overflow: 'hidden',
          padding: 16,                    // base surface padding
        }}
      >
        {/* Top-right × only (footer button removed) */}
        <button
          aria-label="Close modal"
          className="modal-close"
          onClick={onClose}
          style={{
            position: 'absolute',
            right: 8,
            top: 8,
            width: 34,
            height: 34,
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,.15)',
            background: 'rgba(255,255,255,.06)',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          ×
        </button>

        {/* Title + inner padding so nothing touches edges */}
        <div id="all-stats-title" className="title" style={{ margin: '2px 44px 12px 2px' }}>
          All Stats
        </div>

        {/* Scrollable content with themed scrollbar and comfy padding */}
        <div
          className="modal-scroll"
          style={{
            overflow: 'auto',
            maxHeight: 'calc(92vh - 72px)',
            padding: '8px 12px 12px 12px', // inner padding
          }}
        >
          <StarMeter value={star} />

          <div className="group-stack" style={{ paddingBottom: 6 }}>
            <GroupSection
              title="Core Stats"
              groupId="core"
              keys={CORE_STAT_KEYS}
              stats={stats}
              capacity={GROUP_CAPACITY.core}
              seed={seed}
            />
            <GroupSection
              title="Professional Stats"
              groupId="professional"
              keys={PROFESSIONAL_STAT_KEYS}
              stats={stats}
              capacity={GROUP_CAPACITY.professional}
              seed={seed}
            />
            <GroupSection
              title="Relationship Stats"
              groupId="relationship"
              keys={RELATIONSHIP_STAT_KEYS}
              stats={stats}
              capacity={GROUP_CAPACITY.relationship}
              seed={seed}
            />
            <GroupSection
              title="Personal Stats"
              groupId="personal"
              keys={PERSONAL_STAT_KEYS}
              stats={stats}
              capacity={GROUP_CAPACITY.personal}
              seed={seed}
            />
            <GroupSection
              title="Skills Stats"
              groupId="skills"
              keys={SKILLS_STAT_KEYS}
              stats={stats}
              capacity={GROUP_CAPACITY.skills}
              seed={seed}
            />
            <GroupSection
              title="Mind Stats"
              groupId="mind"
              keys={MIND_STAT_KEYS}
              stats={stats}
              capacity={GROUP_CAPACITY.mind}
              seed={seed}
            />
          </div>
        </div>

        {/* Footer Close button removed as requested */}
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
