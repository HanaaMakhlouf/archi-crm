import Icon from '../Icon';

// Drawn glyphs for the file tiles — a folder with a tab, and a page with a
// folded corner carrying a small type stamp.
function TileGlyph({ kind }) {
  if (kind === 'folder') {
    return (
      <svg className="file-tile-glyph" viewBox="0 0 48 40" aria-hidden="true">
        <path className="glyph-back" d="M4 6a3 3 0 0 1 3-3h11l4 5h19a3 3 0 0 1 3 3v24a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" />
        <path className="glyph-front" d="M4 15a3 3 0 0 1 3-3h34a3 3 0 0 1 3 3v19a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" />
      </svg>
    );
  }
  const stamp = kind === 'pdf' ? 'PDF' : kind === 'link' ? 'URL' : 'DOC';
  return (
    <svg className="file-tile-glyph" viewBox="0 0 48 40" aria-hidden="true">
      <path className="glyph-back" d="M12 2h17l9 9v25a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
      <path className="glyph-fold" d="M29 2v7a2 2 0 0 0 2 2h7z" />
      <rect className="glyph-stamp" x="4" y="21" width="26" height="12" rx="2" />
      <text className="glyph-stamp-text" x="17" y="30" textAnchor="middle">{stamp}</text>
    </svg>
  );
}

// "W: › … › kfarem › כור סקר" — the folder's location without the full path noise.
function Crumbs({ parts }) {
  const shown = parts.length > 3 ? [parts[0], '…', ...parts.slice(-2)] : parts;
  return (
    <span className="file-tile-crumbs" dir="ltr">
      {shown.map((p, i) => (
        <span key={i}>{i > 0 && <span className="crumb-sep">›</span>}<bdi>{p}</bdi></span>
      ))}
    </span>
  );
}

// One tile in קבצים מהירים: a folder, PDF, document or link — or an empty slot
// that invites adding one. Opens on click (or follows `href`); edit / remove
// buttons appear on hover.
export default function FileTile({
  kind, label, name, meta, crumbs, title, error,
  empty, emptyText, emptyHint,
  onOpen, href, external, onReplace, onRemove,
}) {
  const body = (
    <>
      <TileGlyph kind={kind} />
      <span className="file-tile-text">
        <span className="file-tile-label">{label}</span>
        <span className="file-tile-name">{empty ? emptyText : name}</span>
        {empty ? <span className="file-tile-meta">{emptyHint}</span>
          : error ? <span className="file-tile-meta is-error">{error}</span>
          : crumbs?.length ? <Crumbs parts={crumbs} />
          : meta && <span className="file-tile-meta">{meta}</span>}
      </span>
    </>
  );
  const mainClass = 'file-tile-main';
  return (
    <div className={`file-tile file-tile--${kind}${empty ? ' is-empty' : ''}${error ? ' has-error' : ''}`}>
      {href ? (
        <a className={mainClass} href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>{body}</a>
      ) : (
        <button type="button" className={mainClass} onClick={onOpen || undefined} disabled={!onOpen} title={title}>{body}</button>
      )}
      {!empty && (onReplace || onRemove) && (
        <div className="file-tile-actions">
          {onReplace && <button type="button" className="file-tile-action" onClick={onReplace} title="החלפה"><Icon name="edit" size={14} /></button>}
          {onRemove && <button type="button" className="file-tile-action is-danger" onClick={onRemove} title="הסרה"><Icon name="trash" size={14} /></button>}
        </div>
      )}
    </div>
  );
}
