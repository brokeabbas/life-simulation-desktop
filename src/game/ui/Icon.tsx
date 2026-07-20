import React from 'react';

type P = React.SVGProps<SVGSVGElement> & { size?: number };

const iconProps = (size?: number): React.SVGProps<SVGSVGElement> => ({
  width: size ?? 16,
  height: size ?? 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
});

export const CalendarIcon = ({ size, ...rest }: P) => (
  <svg {...iconProps(size)} {...rest}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
);

export const CoinsIcon = ({ size, ...rest }: P) => (
  <svg {...iconProps(size)} {...rest}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v6c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 11c0 1.7 4 3 9 3s9-1.3 9-3"/></svg>
);

export const HeartIcon = ({ size, ...rest }: P) => (
  <svg {...iconProps(size)} {...rest}><path d="M20.8 8.6a5.4 5.4 0 0 0-9.1-3.9l-.7.7-.7-.7a5.4 5.4 0 0 0-7.7 7.7l8.4 8.4 8.4-8.4a5.4 5.4 0 0 0 1.4-3.8z"/></svg>
);

export const SmileIcon = ({ size, ...rest }: P) => (
  <svg {...iconProps(size)} {...rest}><circle cx="12" cy="12" r="9"/><path d="M8 14s2 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/></svg>
);

export const BrainIcon = ({ size, ...rest }: P) => (
  <svg {...iconProps(size)} {...rest}><path d="M8 6a3 3 0 0 0-3 3v1a3 3 0 1 0 0 6h1M16 6a3 3 0 0 1 3 3v1a3 3 0 1 1 0 6h-1"/><path d="M12 4v16"/></svg>
);

export const StarIcon = ({ size, ...rest }: P) => (
  <svg {...iconProps(size)} {...rest}><path d="m12 17 5.09 3.36-1.64-5.64L20 10.4l-5.8-.18L12 5l-2.2 5.22L4 10.4l4.55 4.33L6.91 20.36 12 17z"/></svg>
);

export const BriefcaseIcon = ({ size, ...rest }: P) => (
  <svg {...iconProps(size)} {...rest}><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M16 7V6a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v1"/><path d="M2 13h20"/></svg>
);

export const BoltIcon = ({ size, ...rest }: P) => (
  <svg {...iconProps(size)} {...rest}><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>
);
export const MenuIcon = ({ size, ...rest }: P) => (
    <svg {...iconProps(size)} {...rest}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
  
