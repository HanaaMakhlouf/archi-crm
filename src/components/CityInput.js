import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { cityKey, suggestCities } from '../utils/cities';
import { Highlight } from './ClientNameInput';

// The עיר field: type to search, pick from the list (arrows + Enter or a
// click). A place that isn't on the list can be added as typed.
export default function CityInput({ value, onChange, onBlur, placeholder, required }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const text = value ?? '';

  // A filled field shows the whole list (its text is selected, so typing
  // starts a new search); otherwise the cities matching what's typed.
  const [typed, setTyped] = useState(false);
  const matches = useMemo(() => suggestCities(typed ? text : ''), [text, typed]);
  // Typed a place that isn't on the list: offer to keep it as written.
  const typedCity = text.trim();
  const isNew = typed && !!typedCity && !matches.some(c => cityKey(c) === cityKey(typedCity));
  const items = useMemo(() => (isNew ? [...matches, typedCity] : matches), [matches, isNew, typedCity]);
  const showList = open && items.length > 0;
  const listRef = useRef(null);

  // Opening on a filled field marks its city in the list.
  useEffect(() => {
    if (open && !typed) setActive(items.indexOf(text.trim()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, typed]);

  // The marked city stays in view (arrow keys, or opening on a filled field).
  useEffect(() => {
    if (active < 0) return;
    listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [active, showList]);

  const pick = (city) => {
    onChange(city);
    setTyped(false);
    setOpen(false);
    setActive(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive(i => (i + 1) % Math.max(items.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(i => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === 'Enter' && showList && active >= 0) {
      e.preventDefault(); // pick, don't submit the form
      pick(items[active]);
    } else if (e.key === 'Escape' && showList) {
      e.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div className="suggest-wrap city-input">
      <input
        type="text"
        value={text}
        onChange={e => { onChange(e.target.value); setTyped(true); setOpen(true); setActive(-1); }}
        // A filled field is selected, so typing replaces the city.
        onFocus={e => { e.target.select(); setTyped(false); setOpen(true); }}
        onClick={() => setOpen(true)}
        // Delay so a click on a suggestion registers before the list closes.
        onBlur={() => setTimeout(() => { setOpen(false); onBlur?.(); }, 150)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
      />
      {showList && (
        <div id={listId} ref={listRef} className="suggest-list city-suggest-list" role="listbox">
          {items.map((city, i) => {
            const manual = isNew && i === items.length - 1;
            return (
              <button
                key={manual ? '__manual' : city}
                type="button"
                role="option"
                aria-selected={i === active}
                className={`suggest-item city-suggest-item${manual ? ' city-suggest-new' : ''}${i === active ? ' active' : ''}`}
                onMouseDown={e => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(city)}
              >
                {manual
                  ? <>{matches.length ? 'לא ברשימה? ' : 'העיר לא נמצאה. '}הוספה ידנית: <strong>{city}</strong></>
                  : typed ? <Highlight text={city} query={typedCity} /> : city}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
