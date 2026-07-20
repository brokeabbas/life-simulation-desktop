import React from 'react';
import StatsPanel from './game/ui/StatsPanel';
import CategoryDetail from './game/ui/CategoryDetail';
import BottomTabs from './game/ui/BottomTabs';
import CategoryPicker from './game/ui/CategoryPicker';
import WorldDashboard from './game/ui/WorldDashboard';
import { useGame } from './game/store';
import Button from './game/ui/Button';
import './styles.css';

export default function App() {
  const { start, setGender, state, screen } = useGame();

  // New Game modal
  const [seedOpen, setSeedOpen] = React.useState(false);
  const [seed, setSeed] = React.useState('yakubu');
  const [gender, setGenderLocal] = React.useState<'male' | 'female'>(state.gender ?? 'female');

  // Category picker
  const [catOpen, setCatOpen] = React.useState(false);

  // Tiny toast
  const [toast, setToast] = React.useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1500);
  };

  return (
    <>
      <div className="app">
        {/* LEFT: sidebar with menu in its title bar */}
        <div>
          <StatsPanel
            onOpenNewGame={() => setSeedOpen(true)}
            onOpenCategory={() => setCatOpen(true)}
            onToast={showToast}
          />
        </div>

        {/* RIGHT: adaptive pane */}
        <div
          className="main-pane"
          style={{
            display: 'grid',
            gridTemplateRows: '1fr',
            gap: 12,
            minHeight: 0,
          }}
        >
          <div
            className="pane-scroll"
            style={{
              overflow: 'auto',
              minHeight: 0,
              height: '100%', // ensure full paint for the background
            }}
          >
            {screen === 'category' ? (
              <CategoryDetail />
            ) : (
              <WorldDashboard />
            )}
          </div>
        </div>
      </div>

      {/* Bottom tabs */}
      <BottomTabs />

      {/* New Game modal */}
      {seedOpen && (
        <div className="modal-backdrop" onClick={() => setSeedOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="title" style={{ marginBottom: 8 }}>Start a New Game</div>
            <div className="row" style={{ marginBottom: 10 }}>
              <input
                className="input"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="Seed (deterministic run)"
              />
            </div>
            <div className="row" style={{ gap: 12, alignItems: 'center', marginBottom: 10 }}>
              <b style={{ width: 70 }}>Gender</b>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="gender"
                  checked={gender === 'female'}
                  onChange={() => setGenderLocal('female')}
                />
                <span>Female</span>
              </label>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="gender"
                  checked={gender === 'male'}
                  onChange={() => setGenderLocal('male')}
                />
                <span>Male</span>
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="ghost" onClick={() => setSeedOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setGender(gender);
                  start(seed.trim() || 'yakubu', gender);
                  setSeedOpen(false);
                  showToast('New game started ✓');
                }}
              >
                Start
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Category picker */}
      <CategoryPicker open={catOpen} onClose={() => setCatOpen(false)} />

      {toast && (
        <div
          style={{
            position: 'fixed',
            right: 16,
            bottom: 84,
            zIndex: 60,
            background: 'linear-gradient(160deg, #0ea5e9, #3b82f6)',
            padding: '10px 12px',
            border: '1px solid #2a5cc1',
            borderRadius: 12,
            boxShadow: '0 10px 24px rgba(0,0,0,.3)',
          }}
        >
          {toast}
        </div>
      )}
    </>
  );
}
