import React from 'react';

type Props = { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; footer?: React.ReactNode; };
export default function Modal({ open, onClose, title, children, footer }: Props) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {title ? <div className="title" style={{ marginBottom: 8 }}>{title}</div> : null}
        <div style={{ marginBottom: 12 }}>{children}</div>
        {footer ? <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>{footer}</div> : null}
      </div>
    </div>
  );
}
