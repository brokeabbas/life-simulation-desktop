// src/game/ui/EventStrip.tsx
import { useGame } from '../store';
import Tag from './Tag';
import Button from './Button';
import { CATEGORY_LABEL } from '../lifestyle/categories';

export default function EventStrip() {
  const { current, selected, roll, execute, advance } = useGame();
  const categoryTitle = selected ? CATEGORY_LABEL[selected] : 'All Categories';

  return (
    <div className="event-strip">
      <div className="event-main">
        <div className="event-title">{current.event ? current.event.title : 'No eligible events'}</div>
        <div className="event-sub">
          <span className="muted">{categoryTitle}</span>
          {current.event?.tags?.length ? (
            <span className="tags-inline">
              {current.event.tags.slice(0,3).map(t => <Tag key={t}>{t}</Tag>)}
              {current.event.tags.length > 3 ? <span className="muted">+{current.event.tags.length-3}</span> : null}
            </span>
          ) : null}
        </div>
      </div>

      <div className="event-actions">
        <Button className="sm" onClick={roll}>Roll</Button>
        <Button className="sm" variant="primary" onClick={execute} disabled={!current.event}>Execute</Button>
        <Button className="sm" variant="ghost" onClick={advance}>Advance</Button>
      </div>
    </div>
  );
}
