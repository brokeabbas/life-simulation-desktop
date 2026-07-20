// src/game/ui/BottomTabs.tsx
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

export default function BottomTabs() {
  const { selected, setCategory, advance } = useGame();

  return (
    <div className="bottom-tabs">
      <div className="tabs-scroll" role="tablist" aria-label="Lifestyle">
        {ALL_CATEGORIES.map((c) => (
          <button
            key={c}
            role="tab"
            aria-current={selected === c ? 'page' : undefined}
            className="tab-item"
            onClick={() => setCategory(c)}
            title={CATEGORY_LABEL[c]}
          >
            <span className="tab-icon">{ICON[c] ?? <StarIcon />}</span>
            <span className="tab-label">{CATEGORY_LABEL[c]}</span>
          </button>
        ))}
      </div>

      <button className="advance-pill" onClick={advance} title="Advance Day">
        <BoltIcon />
      </button>
    </div>
  );
}
