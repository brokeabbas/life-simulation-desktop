// src/game/ui/business/BusinessDeepDive.tsx
import React from 'react';
import type { Business } from '../../store';
import { seededRandom } from '../../rng';

/* ================================
   Types (UI-only simulation preview)
   ================================ */

type Trend = 'Boom' | 'Recession' | 'Stable' | 'Volatile';
type Pressure = 'Low' | 'Medium' | 'High';
type Culture = 'Innovative' | 'Strict' | 'Casual' | 'Customer-first';
type Lifestyle = 'Balanced' | 'Hustle Mode' | 'Burnout Risk' | 'Chill Founder';

type PricingStrategy = 'premium' | 'value' | 'dynamic' | 'penetration';
type RiskAppetite = 'conservative' | 'balanced' | 'aggressive';
type PeopleStrategy = 'lean' | 'balanced' | 'talent-first';
type OpsFocus = 'efficiency' | 'resilience' | 'speed';

type DeepProfile = {
  marketTrend: Trend;
  pricePressure: Pressure;
  competition: Pressure;
  weeklyDemandShift: number; // -15..+15 %
  reviewScore: number; // 0..5
  reviewVolume: number;

  legalRisk: Pressure;
  taxComplexity: Pressure;
  nextInspectionHint: string;

  supplyReliability: number; // 0..100
  supplyCostPressure: Pressure;
  mainVendor: string;

  morale: number;
  burnoutRisk: Pressure;
  avgSkill: number;
  culture: Culture;
  lifestyle: Lifestyle;
  staffTurnoverRisk: Pressure;

  logisticsModel: string;
  deliverySpeed: Pressure;
  deliveryRisk: Pressure;

  innovationPace: Pressure;
  roadmapItems: string[];

  contractsSummary: string;
  franchisePotential: Pressure;
  expansionReadyScore: number;
  sustainabilityScore: number;

  competitorMoves: string[];
  crisisExamples: string[];
  industryHooks: string[];

  // New systemic metrics
  systemStress: number; // 0..100
  brandStrength: number; // 0..100
  cashflowVolatility: number; // 0..100
  scaleTension: number; // 0..100

  // Narrative summaries for strategies
  pricingSummary: string;
  riskSummary: string;
  peopleStrategySummary: string;
  opsFocusSummary: string;
};

/* UI-only controls */
type MarketScenario = 'baseline' | 'boom' | 'recession' | 'volatile';
type CampaignStyle = 'aggressive' | 'creative' | 'influencer' | 'discount';
type LogisticsChoice = 'auto' | 'local' | 'nationwide' | 'fleet';
type FinanceView = 'cashflow' | 'loans' | 'pitch';
type CultureChoice = Culture | 'auto';

export default function BusinessDeepDive({ biz }: { biz: Business }) {
  // Base derived profile (deterministic, from biz)
  const baseProfile = React.useMemo(() => deriveDeepProfile(biz), [biz]);

  // UI-only interactive state
  const [marketScenario, setMarketScenario] = React.useState<MarketScenario>('baseline');
  const [cultureChoice, setCultureChoice] = React.useState<CultureChoice>('auto');
  const [campaignStyle, setCampaignStyle] = React.useState<CampaignStyle>('aggressive');
  const [logisticsChoice, setLogisticsChoice] = React.useState<LogisticsChoice>('auto');
  const [financeView, setFinanceView] = React.useState<FinanceView>('cashflow');

  const [pricingStrategy, setPricingStrategy] =
    React.useState<PricingStrategy>('value');
  const [riskAppetite, setRiskAppetite] =
    React.useState<RiskAppetite>('balanced');
  const [peopleStrategy, setPeopleStrategy] =
    React.useState<PeopleStrategy>('balanced');
  const [opsFocus, setOpsFocus] =
    React.useState<OpsFocus>('efficiency');

  // Apply UI overrides on top of the base profile (still UI-only)
  const profile = React.useMemo(
    () =>
      applyUiOverrides(baseProfile, {
        marketScenario,
        cultureChoice,
        logisticsChoice,
        campaignStyle,
        pricingStrategy,
        riskAppetite,
        peopleStrategy,
        opsFocus,
      }),
    [
      baseProfile,
      marketScenario,
      cultureChoice,
      logisticsChoice,
      campaignStyle,
      pricingStrategy,
      riskAppetite,
      peopleStrategy,
      opsFocus,
    ],
  );

  const scenarioLabel = React.useMemo(() => {
    const parts: string[] = [];

    parts.push(profile.marketTrend);
    parts.push(profile.pricingSummary);
    parts.push(profile.riskSummary);

    return `What-if: ${parts.join(' • ')}`;
  }, [profile.marketTrend, profile.pricingSummary, profile.riskSummary]);

  return (
    <div className="card" style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontWeight: 800 }}>Simulation Preview</div>
          <div className="muted" style={{ fontSize: 11 }}>
            UI-only — experiment with systems before wiring real logic.
          </div>
        </div>
        <div className="muted" style={{ fontSize: 11, opacity: 0.85 }}>
          {scenarioLabel}
        </div>
      </div>

      <div
        className="choices"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}
      >
        {/* 1. Market & Competition (1,4,6,8,9,15,19) */}
        <SectionCard title="Market & Competition" subtitle="Trends, customers, rivals & brand">
          {/* Market scenario controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
            <span className="muted" style={{ fontSize: 10 }}>
              Market scenario
            </span>
            {[
              { id: 'baseline', label: 'Baseline' },
              { id: 'boom', label: 'Boom' },
              { id: 'recession', label: 'Recession' },
              { id: 'volatile', label: 'Volatile' },
            ].map((opt) => (
              <ChipToggle
                key={opt.id}
                label={opt.label}
                active={marketScenario === opt.id}
                onClick={() => setMarketScenario(opt.id as MarketScenario)}
              />
            ))}
          </div>

          <InfoRow label="Market trend" value={profile.marketTrend} />
          <InfoRow
            label="Weekly demand shift"
            value={`${profile.weeklyDemandShift > 0 ? '+' : ''}${profile.weeklyDemandShift.toFixed(
              1,
            )}%`}
            hint="Dynamic demand vs last week"
          />
          <InfoRow label="Price pressure" value={profile.pricePressure} />
          <InfoRow label="Competition" value={profile.competition} />
          <InfoRow
            label="Customer reviews"
            value={`${profile.reviewScore.toFixed(1)} ★ (${profile.reviewVolume} reviews)`}
            hint="Reviews & reputation"
          />
          <InfoRow
            label="Brand strength"
            value={`${Math.round(profile.brandStrength)}/100`}
            hint="How strong & trusted your brand feels"
          />

          {/* Campaign style controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            <span className="muted" style={{ fontSize: 10 }}>
              Campaign style
            </span>
            {[
              { id: 'aggressive', label: 'Aggressive' },
              { id: 'creative', label: 'Creative' },
              { id: 'influencer', label: 'Influencer' },
              { id: 'discount', label: 'Discount' },
            ].map((opt) => (
              <ChipToggle
                key={opt.id}
                label={opt.label}
                active={campaignStyle === opt.id}
                onClick={() => setCampaignStyle(opt.id as CampaignStyle)}
              />
            ))}
          </div>
          <InfoRow
            label="Brand & marketing"
            value={campaignStyleLabel(campaignStyle)}
            hint="Ad style & positioning"
          />

          {/* Pricing strategy controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            <span className="muted" style={{ fontSize: 10 }}>
              Pricing strategy
            </span>
            {[
              { id: 'premium', label: 'Premium' },
              { id: 'value', label: 'Value' },
              { id: 'dynamic', label: 'Dynamic' },
              { id: 'penetration', label: 'Penetration' },
            ].map((opt) => (
              <ChipToggle
                key={opt.id}
                label={opt.label}
                active={pricingStrategy === opt.id}
                onClick={() => setPricingStrategy(opt.id as PricingStrategy)}
              />
            ))}
          </div>
          <InfoRow
            label="Pricing narrative"
            value={pricingStrategyLabel(pricingStrategy)}
            hint="How you position prices vs value"
          />

          <InfoRow
            label="Sustainability score"
            value={`${Math.round(profile.sustainabilityScore)}/100`}
            hint="Eco-conscious operations & brand"
          />
          <TagRow label="Industry hooks" tags={profile.industryHooks} />
        </SectionCard>

        {/* 2. Team & Culture (2,11,17,20,13,14) */}
        <SectionCard title="Team, Culture & Lifestyle" subtitle="People, culture & the founder">
          {/* Culture controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
            <span className="muted" style={{ fontSize: 10 }}>
              Culture
            </span>
            {[
              { id: 'auto', label: 'Auto' },
              { id: 'Innovative', label: 'Innovative' },
              { id: 'Strict', label: 'Strict' },
              { id: 'Casual', label: 'Casual' },
              { id: 'Customer-first', label: 'Customer-first' },
            ].map((opt) => (
              <ChipToggle
                key={opt.id}
                label={opt.label}
                active={cultureChoice === opt.id}
                onClick={() => setCultureChoice(opt.id as CultureChoice)}
              />
            ))}
          </div>

          {/* People strategy controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
            <span className="muted" style={{ fontSize: 10 }}>
              People strategy
            </span>
            {[
              { id: 'lean', label: 'Lean team' },
              { id: 'balanced', label: 'Balanced' },
              { id: 'talent-first', label: 'Talent-first' },
            ].map((opt) => (
              <ChipToggle
                key={opt.id}
                label={opt.label}
                active={peopleStrategy === opt.id}
                onClick={() => setPeopleStrategy(opt.id as PeopleStrategy)}
              />
            ))}
          </div>

          <InfoRow label="Culture" value={profile.culture} hint="Company culture archetype" />
          <InfoRow
            label="People dynamics"
            value={profile.peopleStrategySummary}
            hint="How you hire, grow & retain talent"
          />
          <InfoRow
            label="Team morale"
            value={`${Math.round(profile.morale)}/100`}
            hint="Employee moods & management"
          />
          <InfoRow label="Burnout risk" value={profile.burnoutRisk} />
          <InfoRow
            label="Staff turnover risk"
            value={profile.staffTurnoverRisk}
            hint="Likelihood of people leaving"
          />
          <InfoRow
            label="System stress"
            value={`${Math.round(profile.systemStress)}/100`}
            hint="How stretched the whole business feels"
          />
          <InfoRow
            label="Avg. skill level"
            value={`${Math.round(profile.avgSkill)}/100`}
            hint="Employee strengths & growth"
          />
          <InfoRow
            label="Negotiation edge"
            value={profile.burnoutRisk === 'Low' ? 'Confident & prepared' : 'Under pressure'}
            hint="Vendor / investor / union talks"
          />
          <InfoRow
            label="Founder lifestyle"
            value={profile.lifestyle}
            hint="Work-life balance & burnout"
          />
          <InfoRow
            label="Facilities & office"
            value={profile.morale > 70 ? 'Comfortable & motivating' : 'Basic setup'}
            hint="Upgrades & morale"
          />
          <InfoRow
            label="Tech stack"
            value={profile.avgSkill > 60 ? 'POS · CRM · Analytics' : 'Basic spreadsheets'}
            hint="POS / CRM / payroll"
          />
        </SectionCard>

        {/* 3. Operations, Risk & Logistics (3,5,6,10,15,19) */}
        <SectionCard title="Operations, Supply & Risk" subtitle="Vendors, logistics & compliance">
          {/* Logistics controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
            <span className="muted" style={{ fontSize: 10 }}>
              Logistics plan
            </span>
            {[
              { id: 'auto', label: 'Auto' },
              { id: 'local', label: 'Local only' },
              { id: 'nationwide', label: 'Nationwide' },
              { id: 'fleet', label: 'Own fleet' },
            ].map((opt) => (
              <ChipToggle
                key={opt.id}
                label={opt.label}
                active={logisticsChoice === opt.id}
                onClick={() => setLogisticsChoice(opt.id as LogisticsChoice)}
              />
            ))}
          </div>

          {/* Ops focus controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
            <span className="muted" style={{ fontSize: 10 }}>
              Ops focus
            </span>
            {[
              { id: 'efficiency', label: 'Efficiency' },
              { id: 'resilience', label: 'Resilience' },
              { id: 'speed', label: 'Speed' },
            ].map((opt) => (
              <ChipToggle
                key={opt.id}
                label={opt.label}
                active={opsFocus === opt.id}
                onClick={() => setOpsFocus(opt.id as OpsFocus)}
              />
            ))}
          </div>

          {/* Risk posture controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
            <span className="muted" style={{ fontSize: 10 }}>
              Risk posture
            </span>
            {[
              { id: 'conservative', label: 'Conservative' },
              { id: 'balanced', label: 'Balanced' },
              { id: 'aggressive', label: 'Aggressive' },
            ].map((opt) => (
              <ChipToggle
                key={opt.id}
                label={opt.label}
                active={riskAppetite === opt.id}
                onClick={() => setRiskAppetite(opt.id as RiskAppetite)}
              />
            ))}
          </div>

          <InfoRow
            label="Main vendor"
            value={profile.mainVendor}
            hint="Supply chain & vendor choice"
          />
          <InfoRow
            label="Supply reliability"
            value={`${Math.round(profile.supplyReliability)}/100`}
          />
          <InfoRow label="Supply cost pressure" value={profile.supplyCostPressure} />
          <InfoRow
            label="Ops focus"
            value={profile.opsFocusSummary}
            hint="Where your operations optimise"
          />
          <InfoRow
            label="Risk posture"
            value={profile.riskSummary}
            hint="How much volatility you are comfortable with"
          />
          <InfoRow
            label="Logistics model"
            value={profile.logisticsModel}
            hint="Local vs national vs third-party"
          />
          <InfoRow label="Delivery speed" value={profile.deliverySpeed} />
          <InfoRow label="Delivery risk" value={profile.deliveryRisk} />
          <InfoRow
            label="Legal & compliance"
            value={`${profile.legalRisk} risk`}
            hint="Licensing, inspections, permits"
          />
          <InfoRow label="Next inspection" value={profile.nextInspectionHint} />
          <BulletList label="Potential crises" items={profile.crisisExamples} />
        </SectionCard>

        {/* 4. Product, Contracts & Scale (7,12,16,18,19) */}
        <SectionCard title="Product, Contracts & Scale" subtitle="Innovation, deals & expansion">
          <InfoRow
            label="Innovation pace"
            value={profile.innovationPace}
            hint="Product development & upgrades"
          />
          <BulletList label="Roadmap focus" items={profile.roadmapItems} />
          <InfoRow
            label="Contracts & B2B deals"
            value={profile.contractsSummary}
            hint="Bulk orders & long-term contracts"
          />
          <InfoRow
            label="Expansion readiness"
            value={`${Math.round(profile.expansionReadyScore)}/100`}
            hint="New cities & franchising"
          />
          <InfoRow
            label="Scale tension"
            value={`${Math.round(profile.scaleTension)}/100`}
            hint="How much scaling strains current systems"
          />
          <InfoRow label="Franchise potential" value={profile.franchisePotential} />

          {/* Finance view controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            <span className="muted" style={{ fontSize: 10 }}>
              Finance focus
            </span>
            {[
              { id: 'cashflow', label: 'Cashflow' },
              { id: 'loans', label: 'Loans' },
              { id: 'pitch', label: 'Investor pitch' },
            ].map((opt) => (
              <ChipToggle
                key={opt.id}
                label={opt.label}
                active={financeView === opt.id}
                onClick={() => setFinanceView(opt.id as FinanceView)}
              />
            ))}
          </div>

          <InfoRow
            label="Financial depth"
            value={financeViewLabel(financeView)}
            hint="Loans, interest, budgeting & forecasting"
          />
          <InfoRow
            label="Cashflow volatility"
            value={`${Math.round(profile.cashflowVolatility)}/100`}
            hint="How bumpy day-to-day cash feels"
          />
          <BulletList label="Competitor moves" items={profile.competitorMoves} />
        </SectionCard>
      </div>
    </div>
  );
}

/* === Deep Profile Logic (deterministic, UI-only) === */

function clamp01(n: number) {
  return Math.max(0, Math.min(100, n));
}

function adjustScore(n: number, delta: number) {
  return clamp01(n + delta);
}

function bumpPressure(p: Pressure, dir: 1 | -1): Pressure {
  const order: Pressure[] = ['Low', 'Medium', 'High'];
  const idx = order.indexOf(p);
  const nextIdx = Math.max(0, Math.min(order.length - 1, idx + dir));
  return order[nextIdx];
}

function computeScaleTension(systemStress: number, expansionReadyScore: number): number {
  // High stress + high expansion creates tension
  const base = 40 + (systemStress - expansionReadyScore) * 0.5;
  return clamp01(base);
}

function deriveDeepProfile(biz: Business): DeepProfile {
  const r = seededRandom(`biz-ui:${biz.id}:${biz.foundedDay}`);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(r() * arr.length)];

  const baseMorale = clamp01(40 + biz.quality * 0.3 + biz.marketing * 0.1 + (r() - 0.5) * 30);
  const baseSkill = clamp01(35 + biz.quality * 0.4 + (r() - 0.5) * 20);
  const supplyReliability = clamp01(50 + biz.quality * 0.25 + (r() - 0.5) * 30);
  const sustainabilityScore = clamp01(40 + biz.quality * 0.2 + (r() - 0.5) * 40);
  const expansionReadyScore = clamp01(30 + biz.demand * 0.3 + biz.marketing * 0.2);

  let marketTrend: Trend = 'Stable';
  if (biz.demand > 70) marketTrend = 'Boom';
  else if (biz.demand < 35) marketTrend = 'Recession';
  else if (r() > 0.6) marketTrend = 'Volatile';

  const weeklyDemandShift = (r() - 0.5) * 30; // -15..+15%

  const competition: Pressure =
    biz.demand > 60 ? 'High' : biz.demand > 40 ? 'Medium' : 'Low';

  const pricePressure: Pressure =
    biz.industry === 'food' || biz.industry === 'transport'
      ? 'High'
      : biz.industry === 'tech' || biz.industry === 'media'
      ? 'Medium'
      : 'Low';

  const legalRisk: Pressure =
    biz.industry === 'food' || biz.industry === 'health'
      ? 'High'
      : biz.industry === 'transport' || biz.industry === 'energy'
      ? 'Medium'
      : 'Low';

  const taxComplexity: Pressure =
    biz.industry === 'energy' || (biz.industry as string) === 'finance'
      ? 'High'
      : 'Medium';

  const reviewScore = 3.2 + (biz.quality / 100) * 2 + (r() - 0.5) * 0.6; // ~3–5
  const reviewVolume = 20 + Math.round(biz.demand * 1.5 + biz.marketing * 1.2 + r() * 40);

  const burnoutRisk: Pressure =
    baseMorale < 40 ? 'High' : baseMorale < 65 ? 'Medium' : 'Low';

  const culture: Culture = pick(['Innovative', 'Strict', 'Casual', 'Customer-first']);
  const lifestyle: Lifestyle = pick(['Balanced', 'Hustle Mode', 'Burnout Risk', 'Chill Founder']);

  const supplyCostPressure: Pressure =
    biz.industry === 'food' || biz.industry === 'energy'
      ? 'High'
      : biz.industry === 'transport'
      ? 'Medium'
      : 'Low';

  const logisticsModel =
    biz.industry === 'transport'
      ? pick(['Local bike fleet', 'City-wide vans', 'Regional trucking'])
      : biz.industry === 'tech'
      ? pick(['Digital delivery', 'App-based bookings'])
      : pick(['Local delivery partners', 'Nationwide courier', 'Pickup only']);

  const deliverySpeed: Pressure =
    biz.industry === 'tech' ? 'High' : biz.industry === 'transport' ? 'High' : 'Medium';

  const deliveryRisk: Pressure =
    biz.industry === 'transport' || biz.industry === 'energy'
      ? 'High'
      : 'Medium';

  const innovationPace: Pressure =
    biz.industry === 'tech' || biz.industry === 'media' ? 'High' : 'Medium';

  const roadmapItems = (() => {
    if (biz.industry === 'food') {
      return ['New signature recipe', 'Faster kitchen line', 'Delivery packaging upgrade'];
    }
    if (biz.industry === 'fashion') {
      return ['Next season collection', 'Influencer collab', 'Better fabric sourcing'];
    }
    if (biz.industry === 'tech') {
      return ['Feature update sprint', 'Bug-fixing cycle', 'Analytics dashboard v2'];
    }
    if (biz.industry === 'transport') {
      return ['Route optimization', 'Fleet maintenance', 'Driver training program'];
    }
    if (biz.industry === 'health') {
      return ['Diagnostic upgrade', 'Patient app improvements', 'New service line'];
    }
    return ['Product refinement', 'Customer feedback loop', 'Cost-efficiency experiments'];
  })();

  const contractsSummary = pick([
    '2 B2B contracts (retail & corporate)',
    '1 bulk supply contract in negotiation',
    '3 recurring SME clients on 6–12 month deals',
  ]);

  const franchisePotential: Pressure =
    biz.branches > 2 || expansionReadyScore > 70
      ? 'High'
      : expansionReadyScore > 50
      ? 'Medium'
      : 'Low';

  const competitorMoves = [
    'Rival launches discount campaign',
    'New entrant targeting your best-selling segment',
    'Competitor poaching staff with higher salaries',
  ];

  const crisisExamples = [
    'Inventory loss due to storage issues',
    'Local power outages hitting operating hours',
    'FX swings affecting import prices',
  ];

  const industryHooks = getIndustryHooks(biz.industry);

  const mainVendor = pick([
    'Sunrise Supplies Ltd.',
    'Metro Wholesale Co.',
    'Prime Logistics & Sourcing',
    'Everfresh Imports',
  ]);

  const nextInspectionHint =
    legalRisk === 'High'
      ? 'High chance of hygiene / safety inspection soon'
      : legalRisk === 'Medium'
      ? 'Occasional licensing / compliance checks'
      : 'Low regulatory attention expected';

  // New systemic metrics
  const brandStrength = clamp01(
    30 + biz.marketing * 0.45 + biz.quality * 0.3 + (r() - 0.5) * 25,
  );

  const cashflowVolatility = clamp01(
    40 + (100 - biz.demand) * 0.25 + (r() - 0.5) * 30,
  );

  let systemStress =
    35 +
    (100 - baseMorale) * 0.3 +
    (competition === 'High' ? 8 : competition === 'Medium' ? 4 : 0) +
    (legalRisk === 'High' ? 8 : legalRisk === 'Medium' ? 4 : 0) +
    (supplyReliability < 60 ? 8 : supplyReliability < 75 ? 4 : 0) +
    (biz.branches > 1 ? (biz.branches - 1) * 3 : 0) +
    (biz.staff > 8 ? 4 : 0);

  systemStress += (r() - 0.5) * 20;
  systemStress = clamp01(systemStress);

  let staffTurnoverRisk: Pressure;
  if (baseMorale < 35 || burnoutRisk === 'High') staffTurnoverRisk = 'High';
  else if (baseMorale < 60) staffTurnoverRisk = 'Medium';
  else staffTurnoverRisk = 'Low';

  const scaleTension = computeScaleTension(systemStress, expansionReadyScore);

  const pricingSummary = 'Default pricing with occasional promos';
  const riskSummary = 'Balanced risk posture';
  const peopleStrategySummary = 'Standard mix of hiring and retention';
  const opsFocusSummary = 'No specific ops focus chosen';

  return {
    marketTrend,
    pricePressure,
    competition,
    weeklyDemandShift,
    reviewScore: Math.max(0, Math.min(5, reviewScore)),
    reviewVolume,
    legalRisk,
    taxComplexity,
    nextInspectionHint,
    supplyReliability,
    supplyCostPressure,
    mainVendor,
    morale: baseMorale,
    burnoutRisk,
    avgSkill: baseSkill,
    culture,
    lifestyle,
    staffTurnoverRisk,
    logisticsModel,
    deliverySpeed,
    deliveryRisk,
    innovationPace,
    roadmapItems,
    contractsSummary,
    franchisePotential,
    expansionReadyScore,
    sustainabilityScore,
    competitorMoves,
    crisisExamples,
    industryHooks,
    systemStress,
    brandStrength,
    cashflowVolatility,
    scaleTension,
    pricingSummary,
    riskSummary,
    peopleStrategySummary,
    opsFocusSummary,
  };
}

function applyUiOverrides(
  base: DeepProfile,
  opts: {
    marketScenario: MarketScenario;
    cultureChoice: CultureChoice;
    logisticsChoice: LogisticsChoice;
    campaignStyle: CampaignStyle;
    pricingStrategy: PricingStrategy;
    riskAppetite: RiskAppetite;
    peopleStrategy: PeopleStrategy;
    opsFocus: OpsFocus;
  },
): DeepProfile {
  const p: DeepProfile = { ...base };

  // === Market scenario tweaks ===
  if (opts.marketScenario === 'boom') {
    p.marketTrend = 'Boom';
    p.weeklyDemandShift = Math.max(p.weeklyDemandShift, 10);
    p.competition = 'High';
    p.brandStrength = adjustScore(p.brandStrength, 6);
    p.systemStress = adjustScore(p.systemStress, 4);
    p.cashflowVolatility = adjustScore(p.cashflowVolatility, 3);
  } else if (opts.marketScenario === 'recession') {
    p.marketTrend = 'Recession';
    p.weeklyDemandShift = Math.min(p.weeklyDemandShift, -10);
    p.pricePressure = 'High';
    p.brandStrength = adjustScore(p.brandStrength, -6);
    p.systemStress = adjustScore(p.systemStress, 10);
    p.cashflowVolatility = adjustScore(p.cashflowVolatility, 12);
  } else if (opts.marketScenario === 'volatile') {
    p.marketTrend = 'Volatile';
    p.weeklyDemandShift =
      p.weeklyDemandShift >= 0
        ? Math.max(p.weeklyDemandShift, 8)
        : Math.min(p.weeklyDemandShift, -8);
    p.systemStress = adjustScore(p.systemStress, 6);
    p.cashflowVolatility = adjustScore(p.cashflowVolatility, 8);
  }

  // === Culture overrides ===
  if (opts.cultureChoice !== 'auto') {
    p.culture = opts.cultureChoice;
    if (opts.cultureChoice === 'Innovative') {
      p.morale = adjustScore(p.morale, 6);
      p.burnoutRisk = p.burnoutRisk === 'High' ? 'Medium' : p.burnoutRisk;
      p.brandStrength = adjustScore(p.brandStrength, 8);
      p.innovationPace = 'High';
      p.systemStress = adjustScore(p.systemStress, 3);
    } else if (opts.cultureChoice === 'Strict') {
      p.morale = adjustScore(p.morale, -5);
      p.burnoutRisk = 'High';
      p.staffTurnoverRisk = bumpPressure(p.staffTurnoverRisk, 1);
      p.systemStress = adjustScore(p.systemStress, 6);
    } else if (opts.cultureChoice === 'Casual') {
      p.morale = adjustScore(p.morale, 3);
      p.systemStress = adjustScore(p.systemStress, -4);
    } else if (opts.cultureChoice === 'Customer-first') {
      p.reviewScore = Math.min(5, p.reviewScore + 0.3);
      p.brandStrength = adjustScore(p.brandStrength, 5);
      p.staffTurnoverRisk = bumpPressure(p.staffTurnoverRisk, -1);
    }
  }

  // === Logistics overrides ===
  if (opts.logisticsChoice === 'local') {
    p.logisticsModel = 'Local delivery only';
    p.deliverySpeed = 'Medium';
    p.deliveryRisk = 'Low';
    p.systemStress = adjustScore(p.systemStress, -3);
    p.cashflowVolatility = adjustScore(p.cashflowVolatility, -2);
    p.expansionReadyScore = adjustScore(p.expansionReadyScore, -5);
  } else if (opts.logisticsChoice === 'nationwide') {
    p.logisticsModel = 'Nationwide courier network';
    p.deliverySpeed = 'Medium';
    p.deliveryRisk = 'Medium';
    p.systemStress = adjustScore(p.systemStress, 5);
    p.brandStrength = adjustScore(p.brandStrength, 3);
    p.cashflowVolatility = adjustScore(p.cashflowVolatility, 4);
  } else if (opts.logisticsChoice === 'fleet') {
    p.logisticsModel = 'Owned fleet (vans / bikes)';
    p.deliverySpeed = 'High';
    p.deliveryRisk = bumpPressure(p.deliveryRisk, -1);
    p.systemStress = adjustScore(p.systemStress, 7);
    p.supplyReliability = adjustScore(p.supplyReliability, 6);
    p.brandStrength = adjustScore(p.brandStrength, 4);
    p.cashflowVolatility = adjustScore(p.cashflowVolatility, 5);
  }

  // === Campaign style tweaks ===
  if (opts.campaignStyle === 'influencer') {
    p.weeklyDemandShift = p.weeklyDemandShift + 2;
    p.brandStrength = adjustScore(p.brandStrength, 6);
    p.cashflowVolatility = adjustScore(p.cashflowVolatility, 3);
  } else if (opts.campaignStyle === 'discount') {
    p.weeklyDemandShift = p.weeklyDemandShift + 1;
    p.reviewScore = Math.min(5, p.reviewScore + 0.1);
    p.brandStrength = adjustScore(p.brandStrength, -2);
    p.cashflowVolatility = adjustScore(p.cashflowVolatility, 2);
  } else if (opts.campaignStyle === 'creative') {
    p.weeklyDemandShift = p.weeklyDemandShift + 1.5;
    p.brandStrength = adjustScore(p.brandStrength, 4);
  } else if (opts.campaignStyle === 'aggressive') {
    p.weeklyDemandShift = p.weeklyDemandShift + 1.2;
    p.brandStrength = adjustScore(p.brandStrength, 5);
    p.cashflowVolatility = adjustScore(p.cashflowVolatility, 4);
    p.systemStress = adjustScore(p.systemStress, 4);
  }

  // === Pricing strategy ===
  switch (opts.pricingStrategy) {
    case 'premium':
      p.pricePressure = 'High';
      p.weeklyDemandShift = p.weeklyDemandShift - 1.5;
      p.brandStrength = adjustScore(p.brandStrength, 7);
      p.cashflowVolatility = adjustScore(p.cashflowVolatility, -4);
      p.pricingSummary = 'Premium pricing with brand focus';
      break;
    case 'value':
      p.pricePressure = 'High';
      p.weeklyDemandShift = p.weeklyDemandShift + 1;
      p.brandStrength = adjustScore(p.brandStrength, 2);
      p.cashflowVolatility = adjustScore(p.cashflowVolatility, 2);
      p.pricingSummary = 'Value pricing competing on affordability';
      break;
    case 'dynamic':
      p.brandStrength = adjustScore(p.brandStrength, 3);
      p.cashflowVolatility = adjustScore(p.cashflowVolatility, -6);
      p.systemStress = adjustScore(p.systemStress, 4);
      p.pricingSummary = 'Dynamic pricing driven by data';
      break;
    case 'penetration':
      p.weeklyDemandShift = p.weeklyDemandShift + 3;
      p.brandStrength = adjustScore(p.brandStrength, 2);
      p.cashflowVolatility = adjustScore(p.cashflowVolatility, 6);
      p.pricingSummary = 'Aggressive penetration pricing for market share';
      break;
  }

  // === Risk appetite ===
  switch (opts.riskAppetite) {
    case 'conservative':
      p.systemStress = adjustScore(p.systemStress, -8);
      p.cashflowVolatility = adjustScore(p.cashflowVolatility, -6);
      p.expansionReadyScore = adjustScore(p.expansionReadyScore, -5);
      p.riskSummary = 'Conservative: protect cash and avoid downside';
      break;
    case 'balanced':
      p.riskSummary = 'Balanced: measured bets with safeguards';
      break;
    case 'aggressive':
      p.systemStress = adjustScore(p.systemStress, 10);
      p.cashflowVolatility = adjustScore(p.cashflowVolatility, 10);
      p.expansionReadyScore = adjustScore(p.expansionReadyScore, 6);
      p.riskSummary = 'Aggressive: chase upside with higher risk';
      break;
  }

  // === People strategy ===
  switch (opts.peopleStrategy) {
    case 'lean':
      p.morale = adjustScore(p.morale, -6);
      p.staffTurnoverRisk = bumpPressure(p.staffTurnoverRisk, 1);
      p.systemStress = adjustScore(p.systemStress, 5);
      p.cashflowVolatility = adjustScore(p.cashflowVolatility, -4);
      p.peopleStrategySummary = 'Lean team: high individual load, lower fixed cost';
      break;
    case 'balanced':
      p.peopleStrategySummary = 'Balanced: sustainable team size & workload';
      break;
    case 'talent-first':
      p.morale = adjustScore(p.morale, 10);
      p.staffTurnoverRisk = bumpPressure(p.staffTurnoverRisk, -1);
      p.systemStress = adjustScore(p.systemStress, -6);
      p.cashflowVolatility = adjustScore(p.cashflowVolatility, 3);
      p.brandStrength = adjustScore(p.brandStrength, 3);
      p.peopleStrategySummary = 'Talent-first: invest heavily in top people';
      break;
  }

  // === Ops focus ===
  switch (opts.opsFocus) {
    case 'efficiency':
      p.supplyReliability = adjustScore(p.supplyReliability, 7);
      p.systemStress = adjustScore(p.systemStress, 4);
      p.cashflowVolatility = adjustScore(p.cashflowVolatility, -6);
      p.opsFocusSummary = 'Efficiency: squeeze waste and optimize margins';
      break;
    case 'resilience':
      p.deliveryRisk = bumpPressure(p.deliveryRisk, -1);
      p.supplyReliability = adjustScore(p.supplyReliability, 5);
      p.systemStress = adjustScore(p.systemStress, -6);
      p.opsFocusSummary = 'Resilience: buffer shocks via backups';
      break;
    case 'speed':
      p.deliverySpeed = 'High';
      p.deliveryRisk = bumpPressure(p.deliveryRisk, 1);
      p.systemStress = adjustScore(p.systemStress, 6);
      p.brandStrength = adjustScore(p.brandStrength, 4);
      p.opsFocusSummary = 'Speed: win via fast turnaround';
      break;
  }

  // === Combo effects (interactions) ===
  if (opts.marketScenario === 'recession' && opts.riskAppetite === 'aggressive') {
    p.systemStress = adjustScore(p.systemStress, 7);
    p.cashflowVolatility = adjustScore(p.cashflowVolatility, 4);
  }

  if (opts.marketScenario === 'boom' && opts.riskAppetite === 'aggressive') {
    p.brandStrength = adjustScore(p.brandStrength, 4);
    p.expansionReadyScore = adjustScore(p.expansionReadyScore, 5);
  }

  if (opts.cultureChoice === 'Strict' && opts.peopleStrategy === 'lean') {
    p.staffTurnoverRisk = bumpPressure(p.staffTurnoverRisk, 1);
    p.systemStress = adjustScore(p.systemStress, 4);
  }

  if (opts.cultureChoice === 'Customer-first' && opts.pricingStrategy === 'premium') {
    p.brandStrength = adjustScore(p.brandStrength, 3);
    p.reviewScore = Math.min(5, p.reviewScore + 0.1);
  }

  if (opts.logisticsChoice === 'fleet' && opts.opsFocus === 'speed') {
    p.brandStrength = adjustScore(p.brandStrength, 3);
    p.systemStress = adjustScore(p.systemStress, 3);
  }

  // Tie staff turnover to final morale as a small correction
  if (p.morale > 70 && p.staffTurnoverRisk === 'High') {
    p.staffTurnoverRisk = 'Medium';
  } else if (p.morale > 80 && p.staffTurnoverRisk === 'Medium') {
    p.staffTurnoverRisk = 'Low';
  }

  // Final scale tension recompute
  p.scaleTension = computeScaleTension(p.systemStress, p.expansionReadyScore);

  return p;
}

function getIndustryHooks(industry: string): string[] {
  switch (industry) {
    case 'food':
      return ['Recipes & menu design', 'Food freshness & hygiene', 'Delivery & dine-in balance'];
    case 'fashion':
      return ['Seasonal collections', 'Fabric quality & fit', 'Influencer & runway moments'];
    case 'tech':
      return ['Server uptime & SLAs', 'Bug fixes vs new features', 'Security & data privacy'];
    case 'transport':
      return ['Route planning & delays', 'Fuel costs & maintenance', 'Peak-hour capacity'];
    case 'health':
      return ['Patient trust & outcomes', 'Hygiene & compliance', 'Service capacity limits'];
    case 'media':
      return ['Content cadence', 'Viral hits vs evergreen', 'Advertiser relationships'];
    case 'energy':
      return ['Fuel / input volatility', 'Grid reliability', 'Regulatory caps & permits'];
    case 'education':
      return ['Curriculum quality', 'Student outcomes', 'Online vs in-person mix'];
    case 'agriculture':
      return ['Seasonality & weather', 'Yield vs quality', 'Storage & transport losses'];
    default:
      return ['Customer expectations', 'Operational bottlenecks', 'Margin vs growth trade-offs'];
  }
}

/* === Small helpers for labels === */

function campaignStyleLabel(style: CampaignStyle): string {
  switch (style) {
    case 'aggressive':
      return 'Aggressive performance marketing';
    case 'creative':
      return 'Creative, story-driven campaigns';
    case 'influencer':
      return 'Influencer & social buzz';
    case 'discount':
      return 'Heavy discounts & promos';
    default:
      return 'Mixed campaigns';
  }
}

function pricingStrategyLabel(strategy: PricingStrategy): string {
  switch (strategy) {
    case 'premium':
      return 'Premium pricing; protect brand & margins';
    case 'value':
      return 'Value pricing; win on affordability';
    case 'dynamic':
      return 'Dynamic pricing; adapt to demand';
    case 'penetration':
      return 'Penetration pricing; grab market share fast';
    default:
      return 'Default pricing';
  }
}

function financeViewLabel(view: FinanceView): string {
  switch (view) {
    case 'cashflow':
      return 'Cashflow tracking & runway planning';
    case 'loans':
      return 'Loan options, rates & repayments';
    case 'pitch':
      return 'Investor pitch, valuation & terms';
    default:
      return 'Financial controls overview';
  }
}

/* === Deep-dive UI helpers === */

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="card"
      style={{
        display: 'grid',
        gap: 6,
        padding: 10,
        borderRadius: 12,
        background: 'linear-gradient(170deg, rgba(15,23,42,.9), rgba(15,23,42,.8))',
        border: '1px solid rgba(148,163,184,.45)',
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 13 }}>{title}</div>
      {subtitle && (
        <div className="muted" style={{ fontSize: 11 }}>
          {subtitle}
        </div>
      )}
      <div style={{ marginTop: 4, display: 'grid', gap: 4 }}>{children}</div>
    </div>
  );
}

function InfoRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'baseline',
        justifyContent: 'space-between',
        fontSize: 11,
      }}
    >
      <div style={{ display: 'grid', gap: 2 }}>
        <span className="muted" style={{ fontSize: 11 }}>
          {label}
        </span>
        {hint && (
          <span className="muted" style={{ fontSize: 10, opacity: 0.8 }}>
            {hint}
          </span>
        )}
      </div>
      <span style={{ fontWeight: 700, fontSize: 11, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function TagRow({ label, tags }: { label: string; tags: string[] }) {
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <span className="muted" style={{ fontSize: 11 }}>
        {label}
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {tags.map((t) => (
          <span
            key={t}
            className="chip"
            style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 999,
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function BulletList({ label, items }: { label: string; items: string[] }) {
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <span className="muted" style={{ fontSize: 11 }}>
        {label}
      </span>
      <ul
        style={{
          margin: 0,
          paddingLeft: 14,
          listStyle: 'disc',
          fontSize: 11,
          color: 'rgba(226,232,240,.9)',
        }}
      >
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  );
}

function ChipToggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="chip"
      onClick={onClick}
      style={{
        fontSize: 10,
        padding: '2px 8px',
        borderRadius: 999,
        borderColor: active ? '#3b82f6' : 'rgba(148,163,184,.45)',
        background: active ? 'rgba(37,99,235,.2)' : 'transparent',
        color: active ? '#e5e7eb' : 'inherit',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}
