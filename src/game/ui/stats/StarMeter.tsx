type Props = {
  value: number; // -100..+100
  onClose?: () => void;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export default function StarMeter({ value }: Props) {
  const v = clamp(value, -100, 100);
  const pct = (v + 100) / 2; // map -100..+100 -> 0..100

  return (
    <div className="star-wrap">
      <div className="star-head">
        <b>STAR</b>
        <span className="star-legend">
          <span>Infamous</span>
          <span>Normal</span>
          <span>Famous</span>
        </span>
      </div>

      <div className="star-bar" role="meter" aria-valuemin={-100} aria-valuemax={100} aria-valuenow={v}>
        <div className="star-fill" style={{ left: `${pct}%` }}>
          <div className="star-knob" />
        </div>
        <div className="star-midline" aria-hidden />
      </div>
    </div>
  );
}
