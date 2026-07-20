// src/game/ui/KebabMenu.tsx
import React from 'react';
import { useGame } from '../store';
import { MenuIcon } from './Icon';

type Props = {
  onOpenNewGame: () => void;
  onOpenCategory: () => void;
  onToast?: (msg: string) => void;
};

export default function KebabMenu({ onOpenNewGame, onOpenCategory, onToast }: Props) {
  const { save, load, roll, execute, advance, current, screen, back } = useGame();
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  async function handleSave() { await save(); onToast?.('Saved ✓'); setOpen(false); }
  async function handleLoad() { await load(); onToast?.('Loaded ✓'); setOpen(false); }

  return (
    <div className="menu-wrap" ref={wrapRef}>
      <button className="menu-button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(v => !v)}>
        <MenuIcon />
      </button>

      {open && (
        <div className="menu-popover" role="menu">
          <button className="menu-item" onClick={() => { roll(); setOpen(false); }}>Roll Event</button>
          <button className="menu-item" onClick={() => { execute(); setOpen(false); }} disabled={!current.event}>Execute</button>
          <button className="menu-item" onClick={() => { advance(); setOpen(false); }}>Advance Day</button>
          <div className="menu-divider" />
          <button className="menu-item" onClick={() => { onOpenCategory(); setOpen(false); }}>Select Category…</button>
          {screen === 'category' && <button className="menu-item" onClick={() => { back(); setOpen(false); }}>Back to Dashboard</button>}
          <div className="menu-divider" />
          <button className="menu-item" onClick={() => { onOpenNewGame(); /* keep open? */ setOpen(false); }}>New Game…</button>
          <button className="menu-item" onClick={handleSave}>Save</button>
          <button className="menu-item" onClick={handleLoad}>Load</button>
        </div>
      )}
    </div>
  );
}
