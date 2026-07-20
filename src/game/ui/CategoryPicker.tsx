// src/game/ui/CategoryPicker.tsx
import React from 'react';
import { useGame } from '../store';
import { ALL_CATEGORIES, CATEGORY_LABEL, Category } from '../lifestyle/categories';
import { HeartIcon, BriefcaseIcon, CoinsIcon, BrainIcon, StarIcon, BoltIcon, SmileIcon } from './Icon';

const ICON: Partial<Record<Category, React.ReactNode>> = {
  health_food: <HeartIcon />,
  job: <BriefcaseIcon />,
  business: <CoinsIcon />,
  career: <BriefcaseIcon />,
  education: <BrainIcon />,
  government: <StarIcon />,
  assets: <CoinsIcon />,
  bank: <CoinsIcon />,
  lifestyle: <BoltIcon />,
  properties: <CoinsIcon />,
  media: <StarIcon />,
  relationship: <HeartIcon />,
  pets: <SmileIcon />,
  will: <StarIcon />,
  lottery: <BoltIcon />,
  shop: <CoinsIcon />,
  become_infamous: <BoltIcon />,
};

export default function CategoryPicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { setCategory } = useGame();
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="title" style={{ marginBottom: 8 }}>Select Category</div>
        <div className="category-grid">
          {ALL_CATEGORIES.map((c) => (
            <button
              key={c}
              className="category-cell"
              onClick={() => { setCategory(c); onClose(); }}
              title={CATEGORY_LABEL[c]}
            >
              <div className="icon">{ICON[c] ?? <StarIcon />}</div>
              <div style={{ fontWeight: 700 }}>{CATEGORY_LABEL[c]}</div>
            </button>
          ))}
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop: 10 }}>
          <button className="btn ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
