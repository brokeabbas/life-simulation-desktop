import { useGame } from '../store';
import type { Category } from '../lifestyle/categories';
import { CATEGORY_LABEL } from '../lifestyle/categories';
import { LIFE_STAGE_LABEL, getActiveLifeStage } from '../life/lifeStage';
import { buildLifeSummary } from '../life/lifeActions';
import { ageInYears, formatSimDate } from '../world/date';
import {
  fullName,
  getActivePerson,
  getChildren,
  getParents,
  getRecentLifeEvents,
  getRelationshipSummaries,
} from '../world/selectors';
import Button from './Button';
import Tag from './Tag';
import StatMeter from './stats/StatMeter';

const quickTabs: Category[] = [
  'education',
  'relationship',
  'career',
  'bank',
  'lifestyle',
  'will',
];

export default function WorldDashboard() {
  const { state, advanceYears, setCategory } = useGame();
  const world = state.world;
  const active = getActivePerson(world);
  const stage = getActiveLifeStage(world);
  const parents = getParents(world, active);
  const children = getChildren(world, active);
  const relationships = getRelationshipSummaries(world, active, 5);
  const recentEvents = getRecentLifeEvents(world, 6);
  const age = active ? ageInYears(active.birthDate, world.currentDate) : 0;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="header">
        <div>
          <div className="title">Life Overview</div>
          <div className="sub">
            {active ? `${fullName(active)} - ${LIFE_STAGE_LABEL[stage]} - Age ${age} - ${formatSimDate(world.currentDate)}` : 'No active character'}
          </div>
        </div>
        <div className="toolbar">
          <Button onClick={() => advanceYears(1)}>Advance Year</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 12 }}>
        <section className="card" style={{ display: 'grid', gap: 10 }}>
          <div>
            <div className="sub">Current Life</div>
            <h2>{active ? fullName(active) : 'Unknown'}</h2>
          </div>
          <p>
            {active?.status === 'dead'
              ? buildLifeSummary(world)
              : 'Play this life through the category tabs. Each category now changes stats, relationships, memories, money, and life outcomes.'}
          </p>
          <div className="tags">
            <Tag>{LIFE_STAGE_LABEL[stage]}</Tag>
            <Tag>{Object.keys(world.people).length} people</Tag>
            <Tag>{Object.keys(world.lifeEvents).length} events</Tag>
          </div>
        </section>

        <section className="card" style={{ display: 'grid', gap: 10 }}>
          <div>
            <div className="sub">Family Background</div>
            <h2>{parents.length ? parents.map(fullName).join(' & ') : 'No parents recorded'}</h2>
          </div>
          <Info label="Children" value={children.length ? children.map(fullName).join(', ') : 'None'} />
          <Info label="Household" value={active ? world.households[active.householdId]?.name ?? 'Unknown' : 'Unknown'} />
          <Info label="Family wealth" value={active ? String(Math.round(world.families[active.familyId]?.wealth ?? 0)) : 'Unknown'} />
        </section>

        <section className="card" style={{ display: 'grid', gap: 10 }}>
          <div>
            <div className="sub">Core Pressures</div>
            <h2>Stats That Matter Now</h2>
          </div>
          {active ? (
            <div className="stats" style={{ display: 'grid', gap: 8 }}>
              {(['health', 'happiness', 'wealth', 'stress', 'familyBond'] as const).map((stat) => (
                <StatMeter key={stat} stat={stat} value={active.stats[stat]} />
              ))}
            </div>
          ) : null}
        </section>
      </div>

      <section className="card" style={{ display: 'grid', gap: 10 }}>
        <div>
          <div className="sub">Play Through Categories</div>
          <h2>Choose a life system</h2>
        </div>
        <div className="choices" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
          {quickTabs.map((category) => (
            <button key={category} type="button" className="choice" onClick={() => setCategory(category)}>
              <span>{CATEGORY_LABEL[category]}</span>
            </button>
          ))}
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
        <section className="card" style={{ display: 'grid', gap: 10 }}>
          <div>
            <div className="sub">Relationships</div>
            <h2>{relationships.length} visible links</h2>
          </div>
          {relationships.map(({ relationship, other }) => (
            <Info
              key={relationship.id}
              label={fullName(other)}
              value={`${relationship.types.join(', ')} - ${relationship.originLabel}`}
            />
          ))}
        </section>

        <section className="card" style={{ display: 'grid', gap: 10 }}>
          <div>
            <div className="sub">Recent Memories</div>
            <h2>Life Events</h2>
          </div>
          {recentEvents.map((event) => (
            <Info key={event.id} label={event.type.replace(/_/g, ' ')} value={`${formatSimDate(event.date)} - ${event.description}`} />
          ))}
        </section>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'grid', gap: 3, borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 8 }}>
      <span className="sub">{label}</span>
      <span>{value}</span>
    </div>
  );
}
