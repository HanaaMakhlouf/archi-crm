import { useMemo, useState } from 'react';
import { getInitials } from './Icon';

const MAX_SUGGESTIONS = 6;

// Highlights the matched part of a name.
function Highlight({ text, query }) {
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

// Client-name field that, while typing, lists existing clients whose name
// contains the typed text — so a duplicate is spotted before it's created.
// Picking one calls onOpenClient (navigates to that client's page).
export default function ClientNameInput({ value, onChange, clients, onOpenClient }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const query = value.trim();

  const matches = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return clients
      .filter(c => c.name?.toLowerCase().includes(q))
      // Names starting with the text first, then the rest alphabetically.
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(q);
        const bStarts = b.name.toLowerCase().startsWith(q);
        if (aStarts !== bStarts) return aStarts ? -1 : 1;
        return a.name.localeCompare(b.name, 'he');
      })
      .slice(0, MAX_SUGGESTIONS);
  }, [clients, query]);

  const showList = open && matches.length > 0;

  const handleKeyDown = (e) => {
    if (!showList) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(i => (i + 1) % matches.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(i => (i <= 0 ? matches.length - 1 : i - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault(); // don't submit the form
      onOpenClient(matches[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="suggest-wrap">
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => setOpen(true)}
        // Delay so a click on a suggestion registers before the list closes.
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {showList && (
        <div className="suggest-list" role="listbox">
          <div className="suggest-header">לקוחות קיימים בשם דומה — לחצו כדי לפתוח</div>
          {matches.map((c, i) => (
            <button
              key={c.id}
              type="button"
              role="option"
              aria-selected={i === active}
              className={`suggest-item${i === active ? ' active' : ''}`}
              onMouseDown={e => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => onOpenClient(c)}
            >
              <span className="client-avatar suggest-avatar">{getInitials(c.name)}</span>
              <span className="suggest-text">
                <span className="suggest-name"><Highlight text={c.name} query={query} /></span>
                <span className="suggest-meta">
                  {[c.city, c.phone, (c.client_type || []).join(' · ')].filter(Boolean).join(' · ') || '—'}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
