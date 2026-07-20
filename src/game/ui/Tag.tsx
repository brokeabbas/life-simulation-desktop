import React from 'react';
export default function Tag({ children }: { children: React.ReactNode }) {
  return <span className="tag">{children}</span>;
}
