// src/game/ui/business/BusinessDashboard.tsx
import React from 'react';
import { useGame } from '../../store';
import BusinessCard from './BusinessCard';
import NewBusinessModal from './NewBusinessModal';
import BusinessDetailModal from './BusinessDetailModal';

export default function BusinessDashboard() {
  const { businesses, simulateBusinesses, state } = useGame();
  const [openNew, setOpenNew] = React.useState(false);
  const [detailId, setDetailId] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Reconcile on mount when opening Business UI
    simulateBusinesses();
  }, [simulateBusinesses, state.day]);

  const list = Object.values(businesses);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="title">Businesses</div>
        <div className="sub" style={{ marginLeft: 8 }}>{list.length} active</div>
        <button className="btn primary" style={{ marginLeft: 'auto' }} onClick={() => setOpenNew(true)}>
          Start Business
        </button>
        <button className="btn ghost" onClick={() => simulateBusinesses()}>Reconcile Profits</button>
      </div>

      <div className="card" style={{ display: 'grid', gap: 10 }}>
        {list.length === 0 ? (
          <div
            style={{
              padding: 14,
              textAlign: 'center',
              border: '1px dashed var(--border)',
              borderRadius: 12,
              background: 'linear-gradient(170deg, rgba(16,24,39,.35), rgba(16,24,39,.20))',
            }}
          >
            No businesses yet. Click <b>Start Business</b> to found your first venture.
          </div>
        ) : (
          <div className="choices" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {list.map(b => (
              <BusinessCard key={b.id} biz={b} onOpen={() => setDetailId(b.id)} />
            ))}
          </div>
        )}
      </div>

      {openNew && <NewBusinessModal onClose={() => setOpenNew(false)} onCreated={() => setOpenNew(false)} />}
      {detailId && <BusinessDetailModal id={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}
