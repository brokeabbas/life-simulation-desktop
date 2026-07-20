import type { CSSProperties } from 'react';
import { useGame } from '../../store';
import { getEducationChoices, educationLevelLabel, possibleEducationOutcomes } from '../../education/educationSimulation';
import type { EducationChoice, EducationSubjectId } from '../../education/types';
import { SUBJECT_CATALOG } from '../../education/types';
import { ageInYears, formatSimDate } from '../../world/date';
import { fullName, getActivePerson } from '../../world/selectors';
import Button from '../Button';
import Tag from '../Tag';
import { BoltIcon, BrainIcon, CalendarIcon } from '../Icon';
import StatMeter from '../stats/StatMeter';

const grid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 12,
};

const wideGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 12,
};

export default function EducationPanel() {
  const {
    state,
    back,
    startEducation,
    applyEducationChoice,
    advanceEducationTerm,
    runEducationExam,
  } = useGame();
  const world = state.world;
  const education = world.education;
  const active = getActivePerson(world);
  const profile = education.activeProfile;
  const school = profile?.currentSchoolId ? education.schools[profile.currentSchoolId] : null;
  const age = active ? ageInYears(active.birthDate, world.currentDate) : 0;
  const choices = profile ? getEducationChoices(world) : [];
  const recentEvents = education.eventLog.slice(0, 5);
  const recentExams = education.examHistory.slice(-3).reverse();
  const possibleOutcomes = possibleEducationOutcomes();

  if (!profile || !school) {
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        <div className="header">
          <div>
            <div className="title">Education</div>
            <div className="sub">
              {active ? `${fullName(active)} - Age ${age} - ${formatSimDate(world.currentDate)}` : 'No active student'}
            </div>
          </div>
          <div className="toolbar">
            <Button onClick={back} variant="ghost">Back</Button>
          </div>
        </div>

        <section className="card" style={{ display: 'grid', gap: 12 }}>
          <div>
            <div className="sub">School Life</div>
            <h2>Start primary school</h2>
          </div>
          <p>
            Your family chooses a school. A teacher calls your name. The first term begins with new
            subjects, classmates, rules, clubs, pressure, and memories.
          </p>
          <div className="tags">
            <Tag>public/private placement</Tag>
            <Tag>persistent classmates</Tag>
            <Tag>subject grades</Tag>
            <Tag>term exams</Tag>
          </div>
          <div className="toolbar">
            <Button onClick={startEducation} variant="primary" iconLeft={<BrainIcon />}>Start School</Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="header">
        <div>
          <div className="title">Education</div>
          <div className="sub">
            {active ? `${fullName(active)} - ${profile.className} - Age ${age} - ${formatSimDate(world.currentDate)}` : school.name}
          </div>
        </div>
        <div className="toolbar">
          <Button onClick={advanceEducationTerm} iconLeft={<CalendarIcon />}>Advance Term</Button>
          <Button onClick={runEducationExam} variant="primary" iconLeft={<BoltIcon />}>Run Exams</Button>
          <Button onClick={back} variant="ghost">Back</Button>
        </div>
      </div>

      {profile.lastConsequence ? (
        <section className="card" style={{ display: 'grid', gap: 8 }}>
          <div className="sub">Latest Consequence</div>
          <p>{profile.lastConsequence}</p>
        </section>
      ) : null}

      <div style={grid}>
        <section className="card" style={{ display: 'grid', gap: 10 }}>
          <div>
            <div className="sub">Current School</div>
            <h2>{school.name}</h2>
          </div>
          <div className="tags">
            <Tag>{school.type}</Tag>
            <Tag>{educationLevelLabel(profile.level)}</Tag>
            <Tag>{profile.term.label}</Tag>
          </div>
          <Info label="Schedule" value={`Week ${profile.term.week}/10 - ${profile.term.focus}`} />
          <Info label="Fees" value={school.tuition ? `${school.tuition} per year` : 'public placement'} />
          <Info label="Future options" value={profile.futureOptions.length ? profile.futureOptions.join(', ') : 'still forming'} />
        </section>

        <section className="card" style={{ display: 'grid', gap: 10 }}>
          <div>
            <div className="sub">School Pressure</div>
            <h2>Student Profile</h2>
          </div>
          <Metric label="Attendance" value={profile.attendance} />
          <Metric label="Homework" value={profile.homeworkCompletion} />
          <Metric label="Exam readiness" value={profile.examReadiness} />
          <Metric label="Behavior" value={profile.behaviorRecord} />
          <Metric label="Popularity" value={profile.popularity} />
          <Metric label="Bullying risk" value={profile.bullyingRisk} dangerHigh />
        </section>

        <section className="card" style={{ display: 'grid', gap: 10 }}>
          <div>
            <div className="sub">Stats Shaped By School</div>
            <h2>Character State</h2>
          </div>
          {active ? (
            <div className="stats" style={{ display: 'grid', gap: 8 }}>
              {(['academicAbility', 'schoolGrades', 'discipline', 'confidence', 'social', 'stress', 'mentalHealth'] as const).map((stat) => (
                <StatMeter key={stat} stat={stat} value={active.stats[stat]} />
              ))}
            </div>
          ) : null}
        </section>
      </div>

      <section className="card" style={{ display: 'grid', gap: 10 }}>
        <div>
          <div className="sub">Subjects</div>
          <h2>Grades, interest, effort, and stress</h2>
        </div>
        <div style={wideGrid}>
          {SUBJECT_CATALOG.map((subject) => {
            const item = profile.subjects[subject.id];
            const teacher = item.teacherId ? education.teachers[item.teacherId] : null;
            return (
              <div key={subject.id} className="choice" style={{ display: 'grid', gap: 8, cursor: 'default' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <b>{item.label}</b>
                  <Tag>{item.currentGrade}/100</Tag>
                </div>
                <div className="sub">{teacher ? teacher.name : 'No teacher assigned'} - {item.careerRelevance.slice(0, 3).join(', ')}</div>
                <Metric label="Understanding" value={item.understanding} />
                <Metric label="Interest" value={item.interest} />
                <Metric label="Effort" value={item.effort} />
                <Metric label="Subject stress" value={item.stress} dangerHigh />
              </div>
            );
          })}
        </div>
      </section>

      <div style={wideGrid}>
        <section className="card" style={{ display: 'grid', gap: 10 }}>
          <div>
            <div className="sub">Teachers</div>
            <h2>{profile.teacherIds.length} staff relationships</h2>
          </div>
          {profile.teacherIds.map((id) => {
            const teacher = education.teachers[id];
            if (!teacher) return null;
            return (
              <Info
                key={id}
                label={`${teacher.name} - ${subjectName(teacher.primarySubjectId)}`}
                value={`Skill ${teacher.teachingSkill}, strictness ${teacher.strictness}, fairness ${teacher.fairness}, relationship ${teacher.relationship}`}
              />
            );
          })}
        </section>

        <section className="card" style={{ display: 'grid', gap: 10 }}>
          <div>
            <div className="sub">Classmates</div>
            <h2>{profile.classmateIds.length} persistent NPCs</h2>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {profile.classmateIds.map((id) => {
              const classmate = education.classmates[id];
              if (!classmate) return null;
              return (
                <div key={id} style={{ display: 'grid', gap: 4, borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <b>{classmate.name}</b>
                    <Tag>{classmate.relationship}/100</Tag>
                  </div>
                  <div className="sub">
                    {classmate.archetype.replace(/_/g, ' ')} - {classmate.friendGroup.replace(/_/g, ' ')} - grades {classmate.academicAbility}, popularity {classmate.popularity}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="card" style={{ display: 'grid', gap: 10 }}>
        <div>
          <div className="sub">Clubs And Activities</div>
          <h2>Skills, friends, awards, and future interests</h2>
        </div>
        <div style={grid}>
          {Object.values(education.clubs).map((club) => (
            <div key={club.id} className="choice" style={{ display: 'grid', gap: 8, cursor: 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <b>{club.name}</b>
                <Tag>{club.joined ? 'joined' : 'available'}</Tag>
              </div>
              <div className="sub">{club.skillBenefits.join(', ')} - {club.careerRelevance.slice(0, 3).join(', ')}</div>
              <Metric label="Participation" value={club.participation} />
            </div>
          ))}
        </div>
      </section>

      <section className="card" style={{ display: 'grid', gap: 10 }}>
        <div>
          <div className="sub">Choices And Consequences</div>
          <h2>{choices.length} available school actions</h2>
        </div>
        <div className="choices" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))' }}>
          {choices.map((choiceItem) => (
            <button
              key={choiceItem.id}
              type="button"
              className="choice"
              onClick={() => applyEducationChoice(choiceItem.id)}
              style={{ alignItems: 'stretch', textAlign: 'left' }}
            >
              <span style={{ display: 'grid', gap: 6 }}>
                <b>{choiceItem.title}</b>
                <span className="sub">{choiceItem.description}</span>
                <span>{choiceItem.consequence}</span>
                <span className="tags" style={{ margin: 0 }}>
                  <Tag>{choiceItem.category}</Tag>
                  {choiceItem.targetSubjectId ? <Tag>{subjectName(choiceItem.targetSubjectId)}</Tag> : null}
                  {previewEffects(choiceItem).map((effect) => <Tag key={effect}>{effect}</Tag>)}
                </span>
              </span>
              <BoltIcon size={16} />
            </button>
          ))}
        </div>
      </section>

      <div style={wideGrid}>
        <section className="card" style={{ display: 'grid', gap: 10 }}>
          <div>
            <div className="sub">Recent School Events</div>
            <h2>{recentEvents.length ? 'State-driven events' : 'No school events yet'}</h2>
          </div>
          {recentEvents.length ? recentEvents.map((event) => (
            <Info
              key={event.id}
              label={`${event.title} - ${event.dateLabel}`}
              value={`${event.description} ${event.consequenceSummary}`}
            />
          )) : <p>The school year is quiet for now.</p>}
        </section>

        <section className="card" style={{ display: 'grid', gap: 10 }}>
          <div>
            <div className="sub">Exam History</div>
            <h2>{recentExams.length ? 'Latest results' : 'No exams taken'}</h2>
          </div>
          {recentExams.length ? recentExams.map((exam) => (
            <Info
              key={exam.id}
              label={`${educationLevelLabel(exam.level)} Year ${exam.schoolYear}, Term ${exam.termPeriod}`}
              value={`Score ${exam.overallScore}/100, rank ${exam.classRank}. ${exam.parentReaction}`}
            />
          )) : <p>No exam record has been created yet.</p>}
        </section>
      </div>

      <div style={wideGrid}>
        <section className="card" style={{ display: 'grid', gap: 10 }}>
          <div>
            <div className="sub">Important School Memories</div>
            <h2>{profile.schoolMemories.length ? 'What school has done to you' : 'No memories yet'}</h2>
          </div>
          {profile.schoolMemories.slice(-7).reverse().map((memory) => (
            <Info key={memory} label="Memory" value={memory} />
          ))}
        </section>

        <section className="card" style={{ display: 'grid', gap: 10 }}>
          <div>
            <div className="sub">Education Outcomes</div>
            <h2>{education.outcomes[0]?.title ?? 'Possible end states'}</h2>
          </div>
          {education.outcomes[0] ? (
            <Info label="Unlocked" value={education.outcomes[0].unlockedOptions.join(', ')} />
          ) : possibleOutcomes.map((outcome) => (
            <Info key={outcome.id} label={outcome.title} value={outcome.description} />
          ))}
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value, dangerHigh = false }: { label: string; value: number; dangerHigh?: boolean }) {
  const width = `${Math.max(0, Math.min(100, Math.round(value)))}%`;
  const color = dangerHigh
    ? 'linear-gradient(90deg,#34d399,#f59e0b,#f87171)'
    : 'linear-gradient(90deg,var(--accent),var(--accent-2))';
  return (
    <div className="meter">
      <div className="label" style={{ justifyContent: 'space-between' }}>
        <span>{label}</span>
        <span className="sub">{Math.round(value)}/100</span>
      </div>
      <div className="bar">
        <div className="fill" style={{ width, background: color }} />
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

function subjectName(subjectId: EducationSubjectId) {
  return SUBJECT_CATALOG.find((subject) => subject.id === subjectId)?.label ?? subjectId.replace(/_/g, ' ');
}

function previewEffects(choice: EducationChoice) {
  const statEffects = Object.entries(choice.statEffects)
    .slice(0, 2)
    .map(([stat, delta]) => `${stat} ${Number(delta) >= 0 ? '+' : ''}${delta}`);
  const profileEffects = Object.entries(choice.profileEffects)
    .slice(0, 2)
    .map(([field, delta]) => `${field.replace(/([A-Z])/g, ' $1')} ${Number(delta) >= 0 ? '+' : ''}${delta}`);
  return [...statEffects, ...profileEffects].slice(0, 3);
}
