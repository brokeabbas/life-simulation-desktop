import type { CSSProperties } from 'react';
import { useGame } from '../store';
import type { Category } from '../lifestyle/categories';
import { CATEGORY_LABEL } from '../lifestyle/categories';
import { getCategoryLifeActions, getCategoryLifeSummary, buildLifeSummary } from '../life/lifeActions';
import { getActiveLifeStage, LIFE_STAGE_LABEL } from '../life/lifeStage';
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
import { BoltIcon } from './Icon';
import StatMeter from './stats/StatMeter';
import type { StatKey } from '../types';

const cardGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 12,
};

const statFocus: Partial<Record<Category, StatKey[]>> = {
  education: ['academicAbility', 'schoolGrades', 'discipline', 'intellect', 'stress'],
  relationship: ['familyBond', 'social', 'empathy', 'happiness', 'stress'],
  lifestyle: ['happiness', 'mentalHealth', 'energy', 'discipline', 'stress'],
  bank: ['wealth', 'financialLiteracy', 'discipline', 'stress'],
  assets: ['wealth', 'financialLiteracy', 'practicalSkill', 'socialStatus'],
  properties: ['wealth', 'familyBond', 'socialStatus', 'stress'],
  government: ['reputation', 'morality', 'communication', 'socialStatus'],
  media: ['reputation', 'confidence', 'communication', 'socialStatus', 'stress'],
  pets: ['happiness', 'empathy', 'patience', 'mentalHealth'],
  will: ['wealth', 'familyBond', 'happiness', 'mentalHealth', 'stress'],
  lottery: ['luck', 'financialLiteracy', 'wealth', 'stress'],
  shop: ['wealth', 'happiness', 'socialStatus', 'financialLiteracy'],
  become_infamous: ['streetSmarts', 'morality', 'reputation', 'stress'],
};

export default function CategoryLifePanel({ category }: { category: Category }) {
  const { state, back, advanceYears, applyCategoryLifeAction } = useGame();
  const world = state.world;
  const active = getActivePerson(world);
  const stage = getActiveLifeStage(world);
  const actions = getCategoryLifeActions(category, world);
  const summary = getCategoryLifeSummary(category, world);
  const parents = getParents(world, active);
  const children = getChildren(world, active);
  const relationships = getRelationshipSummaries(world, active, 5);
  const recentEvents = getRecentLifeEvents(world, 5);
  const stats = statFocus[category] ?? ['health', 'happiness', 'wealth', 'reputation', 'stress'];
  const age = active ? ageInYears(active.birthDate, world.currentDate) : 0;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="header">
        <div>
          <div className="title">{CATEGORY_LABEL[category]}</div>
          <div className="sub">
            {active ? `${fullName(active)} - ${LIFE_STAGE_LABEL[stage]} - Age ${age} - ${formatSimDate(world.currentDate)}` : 'No active life'}
          </div>
        </div>
        <div className="toolbar">
          <Button onClick={() => advanceYears(1)} iconLeft={<BoltIcon />}>+1 Year</Button>
          <Button onClick={back} variant="ghost">Back</Button>
        </div>
      </div>

      <div style={cardGrid}>
        <section className="card" style={{ display: 'grid', gap: 10 }}>
          <div>
            <div className="sub">Current Pressure</div>
            <h2>{LIFE_STAGE_LABEL[stage]}</h2>
          </div>
          <p>{summary}</p>
          <div className="tags">
            <Tag>{CATEGORY_LABEL[category]}</Tag>
            <Tag>{stage.replace(/_/g, ' ')}</Tag>
            {active?.status === 'dead' ? <Tag>life summary</Tag> : null}
          </div>
        </section>

        <section className="card" style={{ display: 'grid', gap: 10 }}>
          <div>
            <div className="sub">Relevant Stats</div>
            <h2>Character State</h2>
          </div>
          <div className="stats" style={{ display: 'grid', gap: 8 }}>
            {active ? stats.map((key) => <StatMeter key={key} stat={key} value={active.stats[key]} />) : null}
          </div>
        </section>
      </div>

      {category === 'relationship' || category === 'will' || category === 'lifestyle' ? (
        <div style={cardGrid}>
          <section className="card" style={{ display: 'grid', gap: 10 }}>
            <div>
              <div className="sub">Family Context</div>
              <h2>{parents.length ? parents.map(fullName).join(' & ') : 'No parents recorded'}</h2>
            </div>
            <Info label="Children" value={children.length ? children.map(fullName).join(', ') : 'None'} />
            <Info label="Family bond" value={active ? `${Math.round(active.stats.familyBond)}/100` : 'Unknown'} />
          </section>

          <section className="card" style={{ display: 'grid', gap: 10 }}>
            <div>
              <div className="sub">Social Web</div>
              <h2>{relationships.length} close links</h2>
            </div>
            {relationships.map(({ relationship, other }) => (
              <Info
                key={relationship.id}
                label={fullName(other)}
                value={`${relationship.types.join(', ')} - C${relationship.closeness} T${relationship.trust}`}
              />
            ))}
          </section>
        </div>
      ) : null}

      {category === 'will' && active?.status === 'dead' ? (
        <section className="card" style={{ display: 'grid', gap: 10 }}>
          <div>
            <div className="sub">Life Summary</div>
            <h2>{fullName(active)}</h2>
          </div>
          <p>{buildLifeSummary(world)}</p>
        </section>
      ) : null}

      <section className="card" style={{ display: 'grid', gap: 10 }}>
        <div>
          <div className="sub">Choices And Consequences</div>
          <h2>{actions.length ? 'Available Actions' : 'No available actions at this life stage'}</h2>
        </div>
        {actions.length ? (
          <div className="choices" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                className="choice"
                onClick={() => applyCategoryLifeAction(category, action.id)}
                style={{ alignItems: 'stretch', textAlign: 'left' }}
              >
                <span style={{ display: 'grid', gap: 6 }}>
                  <b>{action.title}</b>
                  <span className="sub">{action.description}</span>
                  <span className="tags" style={{ margin: 0 }}>
                    {action.cost ? <Tag>Cost {action.cost}</Tag> : null}
                    {action.income ? <Tag>Income {action.income}</Tag> : null}
                    {action.tags.slice(0, 3).map((tag) => <Tag key={tag}>{tag}</Tag>)}
                  </span>
                </span>
                <BoltIcon size={16} />
              </button>
            ))}
          </div>
        ) : (
          <p>Advance time, build prerequisites in another category, or start a new life stage.</p>
        )}
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
