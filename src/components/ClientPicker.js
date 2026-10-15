import { useMemo, useState } from 'react';
import { Highlight } from './ClientNameInput';

const MAX_SUGGESTIONS = 8;

// Searchable client field: typing lists clients whose name contains the text,
// picking one calls onPick(client). Editing the text again drops the pick
// (onPick(null)) until another client is chosen.
export default function ClientPicker({ text, onTextChange, clients, onPick, placeholder }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const query = text.trim();

  const matches = useMemo(() => {
    const q = query.toLowerCase();
    return clients
      .filter(c => c.name && (!q || c.name.toLowerCase().includes(q)))
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

  const pick = (c) => {
    onTextChange(c.name);
    onPick(c);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!showList) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(i => (i + 1) % matches.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(i => (i <= 0 ? matches.length - 1 : i - 1));
    } else if (e.key === 'Enter' && matches.length) {
      e.preventDefault();
      pick(matches[Math.max(active, 0)]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="suggest-wrap">
      <input
        type="search"
        value={text}
        placeholder={placeholder}
        onChange={e => { onTextChange(e.target.value); onPick(null); setOpen(true); setActive(-1); }}
        onFocus={() => setOpen(true)}
        // Delay so a click on a suggestion registers before the list closes.
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {showList && (
        <div className="suggest-list" role="listbox">
          {matches.map((c, i) => (
            <button
              key={c.id}
              type="button"
              role="option"
              aria-selected={i === active}
              className={`suggest-item${i === active ? ' active' : ''}`}
              onMouseDown={e => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(c)}
            >
              <span className="suggest-text">
                <span className="suggest-name"><Highlight text={c.name} query={query} /></span>
                {c.city && <span className="suggest-meta">{c.city}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
