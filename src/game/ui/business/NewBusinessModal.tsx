// src/game/ui/business/NewBusinessModal.tsx
import React from 'react';
import { createPortal } from 'react-dom';
import { useGame } from '../../store';
import { INDUSTRIES } from './industries';

const toNaira = (n: number) => `₦${Math.max(0, Math.round(n)).toLocaleString()}`;

export default function NewBusinessModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { state, createBusiness } = useGame();
  const [name, setName] = React.useState('');
  const [industry, setIndustry] = React.useState(INDUSTRIES[0].id);
  const [capital, setCapital] = React.useState(200_000);
  const wealth = state.stats.wealth ?? 0;

  const body = (
    <div
      className="modal-backdrop"
      role="dialog" aria-modal="true" aria-labelledby="nb-title"
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains('modal-backdrop')) onClose();
      }}
    >
      <div className="modal" style={{ width:'min(720px, 96vw)' }} onClick={(e) => e.stopPropagation()}>
        <div className="title" id="nb-title">Start a New Business</div>

        <div style={{ display:'grid', gap:10, marginTop:8 }}>
          <label style={{ display:'grid', gap:6 }}>
            <span className="muted" style={{ fontSize:12 }}>Business Name</span>
            <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. BlueWave Foods" />
          </label>

          <label style={{ display:'grid', gap:6 }}>
            <span className="muted" style={{ fontSize:12 }}>Industry</span>
            <select className="input" value={industry} onChange={e=>setIndustry(e.target.value as any)}>
              {INDUSTRIES.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <span className="muted" style={{ fontSize:12 }}>
              {INDUSTRIES.find(i=>i.id===industry)?.desc}
            </span>
          </label>

          <label style={{ display:'grid', gap:6 }}>
            <span className="muted" style={{ fontSize:12 }}>Initial Capital</span>
            <input
              className="input"
              type="number"
              min={10000}
              step={10000}
              value={capital}
              onChange={e=>setCapital(parseInt(e.target.value || '0', 10))}
            />
            <span className="muted" style={{ fontSize:12 }}>
              Your Wallet: <b>{toNaira(wealth)}</b>
            </span>
          </label>
        </div>

        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn primary"
            disabled={!name.trim() || capital <= 0 || wealth < capital}
            onClick={() => {
              const ok = createBusiness({ name, industry: industry as any, capital });
              if (ok) onCreated(); else alert('Unable to create business (check funds).');
            }}
          >
            Create — {toNaira(capital)}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(body, document.body);
}
