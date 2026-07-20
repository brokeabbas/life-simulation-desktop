// src/game/ui/jobs/JobCard.tsx

type Props = {
  title: string;
  salaryPerDay: string;
  maxInfo?: string | null;
  req?: string | null;
  // kept for API compatibility, but not used on the card anymore:
  levels?: string[];
  maxLevel?: number;
  currentLevel?: number;

  applyingToCurrent?: boolean;
  onOpen?: () => void;

  // Market info
  listingsCount?: number;
  avgDemand?: number | null; // 0..100
};

export default function JobCard({
  title,
  salaryPerDay,
  maxInfo,
  req,
  applyingToCurrent,
  onOpen,
  listingsCount = 0,
  avgDemand = null,
}: Props) {
  const noListings = listingsCount === 0;

  return (
    <button
      onClick={onOpen}
      className="card job-card"
      aria-label={`Open ${title} details`}
      title="Open details"
      type="button"
    >
      {/* Header */}
      <div className="job-card__header">
        <div className="job-card__title-row">
          <div className="job-card__title">{title}</div>
          {applyingToCurrent && <BadgeEmployed />}
        </div>

        <div className="job-card__meta">
          <strong className="job-card__pay">{salaryPerDay}</strong>
          {maxInfo ? <span className="job-card__bullet">•</span> : null}
          {maxInfo ? <span className="job-card__muted">{maxInfo}</span> : null}
        </div>

        {req && (
          <div className="job-card__req">
            <ReqChip label={req} />
          </div>
        )}
      </div>

      {/* Footer: listings + demand */}
      <div className="job-card__footer">
        {noListings ? (
          <span className="job-card__no-listing">
            <NoIcon />
            No listing available
          </span>
        ) : (
          <>
            <span className="job-card__hiring">
              <BuildingIcon />
              {listingsCount} compan{listingsCount === 1 ? 'y' : 'ies'} hiring
            </span>

            {typeof avgDemand === 'number' && (
              <span className="job-card__demand">
                <span className="job-card__muted">Avg Demand</span>
                <DemandBar value={avgDemand} />
              </span>
            )}
          </>
        )}
      </div>
    </button>
  );
}

/* ----------------- UI bits ----------------- */

function DemandBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <span className="demand">
      <span className="demand__track">
        <span className="demand__fill" style={{ width: `${v}%` }} />
      </span>
      <span className="demand__value">{v}%</span>
    </span>
  );
}

function ReqChip({ label }: { label: string }) {
  return <span className="chip chip--blue">{label}</span>;
}

function BadgeEmployed() {
  return <span className="chip chip--green">Employed</span>;
}

/* ----------------- Icons (inline SVG) ----------------- */

function BuildingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 20V6a2 2 0 0 1 2-2h6v16H4zm8 0h8V10a2 2 0 0 0-2-2h-6v12zM7 8h2M7 12h2M7 16h2M17 12h2M17 16h2"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function NoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.7"/>
      <path d="M7 7l10 10" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
