
const toNaira = (n: number) => `₦${Math.max(0, Math.round(n)).toLocaleString()}`;

export default function CareerTrackCard({
  title,
  positions,
  entryPay,
  maxPay,
  minIntellect,
  intellect,
  isCurrent,
  onApply,
}: {
  title: string;
  positions: string[];     // ordered by level 0..N
  entryPay: number;
  maxPay: number;
  minIntellect?: number;
  intellect: number;
  isCurrent: boolean;
  onApply: () => void;
}) {
  const canApply = intellect >= (minIntellect ?? 0);
  const reqText = minIntellect ? `Requires Intellect ≥ ${minIntellect}` : null;

  return (
    <div className="choice" style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'grid', gap: 6 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
          <div style={{ fontWeight: 800 }}>{title}</div>
          <div className="muted" style={{ fontSize: 12 }}>
            {positions.join(' → ')}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="tag" title="Entry (Level 0)">
              {toNaira(entryPay)}/day
            </span>
            <span className="tag" title="Max (Top Level)">
              ~{toNaira(maxPay)}/day
            </span>
          </div>
        </div>
        {reqText ? <div className="muted" style={{ fontSize: 12 }}>{reqText}</div> : null}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        {isCurrent ? (
          <button className="btn" disabled title="You already work in this field">
            Employed
          </button>
        ) : (
          <button
            className={`btn ${canApply ? 'primary' : 'ghost'}`}
            onClick={onApply}
            disabled={!canApply}
            title={!canApply ? 'Raise your Intellect to qualify' : 'Apply to this track'}
          >
            {canApply ? 'Apply' : 'Not Eligible'}
          </button>
        )}
      </div>
    </div>
  );
}
