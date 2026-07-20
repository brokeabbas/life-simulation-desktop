// src/game/ui/jobs/CoworkersModal.tsx
import React from 'react';
import { createPortal } from 'react-dom';
import { generateCoworkers, type Employee } from './coworkers';
import CoworkerProfile from './CoworkerProfile';

type Props = {
  companyName: string;
  seed: string;  // e.g. `${state.seed}:${job.company}`
  onClose: () => void;
};

export default function CoworkersModal({ companyName, seed, onClose }: Props) {
  const [q, setQ] = React.useState('');
  const all = React.useMemo(() => generateCoworkers(seed, companyName), [seed, companyName]);
  const [selected, setSelected] = React.useState<Employee | null>(all[0] || null);

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return all;
    return all.filter(e =>
      e.name.toLowerCase().includes(s) ||
      e.title.toLowerCase().includes(s) ||
      e.department.toLowerCase().includes(s)
    );
  }, [q, all]);

  // ensure selection stays in filtered list
  React.useEffect(() => {
    if (selected && !filtered.some(e => e.id === selected.id)) {
      setSelected(filtered[0] ?? null);
    }
  }, [filtered, selected]);

  const body = (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coworkers-title"
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains('modal-backdrop')) onClose();
      }}
    >
      <div className="modal coworkers-modal cw--two" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cw__top">
          <div className="cw__title">
            <div className="title" id="coworkers-title">Employees — {companyName}</div>
            <div className="muted">{filtered.length} of {all.length} shown</div>
          </div>
          <div className="cw__search">
            <input
              className="input"
              placeholder="Search name, title, or department…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {/* Content: list + profile */}
        <div className="cw__split">
          <div className="cw__list">
            <table className="table cw__table">
              <thead>
                <tr>
                  <th align="left">Name</th>
                  <th align="left">Title</th>
                  <th align="left">Department</th>
                  <th align="right">Age</th>
                  <th align="right">Tenure</th>
                  <th align="right">Influence</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const isSel = selected?.id === e.id;
                  return (
                    <tr
                      key={e.id}
                      className={`${e.id === 'ceo' ? 'is-ceo' : ''} ${isSel ? 'is-selected' : ''}`}
                      onClick={() => setSelected(e)}
                      style={{ cursor: 'pointer' }}
                      title="Open profile"
                    >
                      <td>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          <Avatar seed={`${seed}:${e.id}`} />
                          <div>
                            <div style={{ fontWeight: 700 }}>{e.name}</div>
                            {e.id === 'ceo' && <span className="chip chip--gold">CEO</span>}
                          </div>
                        </div>
                      </td>
                      <td>{e.title}</td>
                      <td>{e.department}</td>
                      <td align="right">{e.age}</td>
                      <td align="right">{e.tenure}y</td>
                      <td align="right">
                        <span className="demand" title={`${e.influence}%`}>
                          <span className="demand__track"><span className="demand__fill" style={{ width: `${e.influence}%` }} /></span>
                          <span className="demand__value">{e.influence}%</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Profile panel */}
          <div className="cw__profile">
            {selected ? (
              <CoworkerProfile employee={selected} companyKey={`${seed}:${companyName}`} />
            ) : (
              <div className="empty">No selection</div>
            )}
          </div>
        </div>

        <div className="cw__footer">
          <button className="btn ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );

  return createPortal(body, document.body);
}

/* Avatar */
function Avatar({ seed }: { seed: string }) {
  const hue = hashToHue(seed);
  const bg = `hsl(${hue}deg 70% 18%)`;
  const fg = `hsl(${hue}deg 85% 85%)`;
  const initials = seed.split(':').pop()?.slice(0, 2).toUpperCase() ?? 'U';
  return (
    <span
      aria-hidden
      style={{
        width: 28, height: 28, borderRadius: 8,
        background: bg, color: fg, display: 'inline-grid', placeItems: 'center',
        fontSize: 11, fontWeight: 800, border: '1px solid rgba(255,255,255,.08)'
      }}
    >
      {initials}
    </span>
  );
}
function hashToHue(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
}
