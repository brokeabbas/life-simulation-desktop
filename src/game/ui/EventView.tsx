// src/game/ui/EventView.tsx
import React from 'react';
import { useGame } from '../store';
import Tag from './Tag';
import { CATEGORY_LABEL } from '../lifestyle/categories';

const EventView: React.FC = () => {
  const { current, selected } = useGame();
  const categoryTitle = selected ? CATEGORY_LABEL[selected] : 'All Categories';

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="card">
        <div className="sub" style={{ marginBottom: 6 }}>
          {categoryTitle}
        </div>

        {current.event ? (
          <>
            {current.event.tags?.length ? (
              <div className="tags" style={{ marginBottom: 8 }}>
                {current.event.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
            ) : null}
            <h2>{current.event.title}</h2>
            <p>{current.event.text}</p>
          </>
        ) : (
          <>
            <h2>No eligible events</h2>
            <p>Pick a category from the bottom bar or tap “Advance Day”.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default EventView;
