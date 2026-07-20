// src/game/ui/ChoiceButton.tsx
import React from 'react';

export type ChoiceButtonProps = {
  id: string;
  onPick: (id: string) => void;
  children: React.ReactNode;
};

export const ChoiceButton: React.FC<ChoiceButtonProps> = ({ id, onPick, children }) => (
  <button className="choice" onClick={() => onPick(id)}>
    {children}
  </button>
);

export default ChoiceButton;
