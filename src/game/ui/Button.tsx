import React from 'react';
type Variant = 'default' | 'primary' | 'ghost';
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; iconLeft?: React.ReactNode; iconRight?: React.ReactNode; };

export default function Button({ variant = 'default', iconLeft, iconRight, children, className, ...props }: Props) {
  const cls = ['btn', variant === 'primary' ? 'primary' : variant === 'ghost' ? 'ghost' : '', className || ''].join(' ');
  return (
    <button className={cls} {...props}>
      {iconLeft ? <span style={{ display: 'grid', placeItems: 'center' }}>{iconLeft}</span> : null}
      <span>{children}</span>
      {iconRight ? <span style={{ marginLeft: 'auto', opacity: .9 }}>{iconRight}</span> : null}
    </button>
  );
}
