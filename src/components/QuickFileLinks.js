import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import Icon from './Icon';
import {
  FILE_LINK_1_PATH, FILE_LINK_1_NAME,
  FILE_LINK_2_PATH, FILE_LINK_2_NAME,
  FILE_LINK_LABEL_1, FILE_LINK_LABEL_2,
} from '../constants';

const PDF_BUCKET = 'offers';

function stripQuotes(str) {
  return str.replace(/^"|"$/g, '').trim();
}

export function isWebUrl(raw) {
  return /^https?:\/\/.+/i.test(raw.trim());
}

export function isFolderLink(raw) { return raw?.startsWith('folder:'); }
export function getFolderName(raw) { return raw?.replace('folder:', '') || ''; }

export function isAbsoluteFolderPath(raw) {
  if (!raw) return false;
  if (isWebUrl(raw)) return false;
  if (raw.startsWith('folder:')) return false;
  // Has a file extension → it's a file, not a folder
  if (/\.(docx?|xlsx?|pptx?)$/i.test(raw)) return false;
  // Looks like an absolute path (Windows C:\ or Unix /)
  return /^([a-zA-Z]:[\\/]|\/)/.test(raw);
}

export function getPathBasename(p) {
  return p.split(/[\\/]/).filter(Boolean).pop() || p;
}

function isValidInput(raw) {
  const val = stripQuotes(raw);
  if (val.length === 0) return false;
  if (isWebUrl(val)) return true;
  // local Office file — must have a known extension
  return /\.(docx?|xlsx?|pptx?)$/i.test(val);
}

function getExt(path) {
  return (path.split('.').pop() || '').toLowerCase();
}

function getFileBadge(raw) {
  const val = stripQuotes(raw);
  if (isWebUrl(val)) return { label: 'קישור — נפתח בדפדפן', color: 'primary' };
  const ext = getExt(val);
  if (['docx', 'doc'].includes(ext)) return { label: 'Word — נפתח ב-Word', color: 'success' };
  if (['xlsx', 'xls'].includes(ext)) return { label: 'Excel — נפתח ב-Excel', color: 'success' };
  if (['pptx', 'ppt'].includes(ext)) return { label: 'PowerPoint — נפתח ב-PowerPoint', color: 'success' };
  return { label: 'קובץ Office', color: 'success' };
}

function buildUri(raw) {
  const val = stripQuotes(raw);
  if (isWebUrl(val)) return val;
  const path = val.replace(/\\/g, '/');
  const ext = getExt(path);
  if (['docx', 'doc'].includes(ext)) return `ms-word:ofe|u|file:///${path}`;
  if (['xlsx', 'xls'].includes(ext)) return `ms-excel:ofe|u|file:///${path}`;
  if (['pptx', 'ppt'].includes(ext)) return `ms-powerpoint:ofe|u|file:///${path}`;
  return `ms-word:ofe|u|file:///${path}`;
}

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

function FileTile({
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

const SLOTS = [
  { slot: 1, label: FILE_LINK_LABEL_1, pathKey: FILE_LINK_1_PATH, nameKey: FILE_LINK_1_NAME },
  { slot: 2, label: FILE_LINK_LABEL_2, pathKey: FILE_LINK_2_PATH, nameKey: FILE_LINK_2_NAME },
];

const BADGE_COLORS = {
  success: { bg: 'var(--color-success-light)', text: 'var(--color-success)' },
  warning: { bg: 'var(--color-warning-light)', text: 'var(--color-warning)' },
  primary: { bg: 'var(--color-primary-light)', text: 'var(--color-primary)' },
};

export default function QuickFileLinks({ client, onUpdateClient }) {
  const [modalSlot, setModalSlot] = useState(null);
  const [draftPath, setDraftPath] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(null);
  const [pdfViewer, setPdfViewer] = useState(false);
  const [pdfSignedUrl, setPdfSignedUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [folderError, setFolderError] = useState(null);
  const dialogRef = useRef(null);
  const folderInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  async function handlePdfUpload(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const path = `${client.id}/${Date.now()}.pdf`;
      const { error } = await supabase.storage.from(PDF_BUCKET).upload(path, file, { upsert: true });
      if (error) throw error;
      await onUpdateClient({ [FILE_LINK_1_PATH]: path, [FILE_LINK_1_NAME]: file.name });
    } catch (err) {
      alert('שגיאה בהעלאת הקובץ: ' + err.message);
    }
    setUploading(false);
  }

  useEffect(() => {
    if (!modalSlot) return;
    const handler = (e) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modalSlot]);

  function closeModal() {
    setModalSlot(null);
    setDraftPath('');
  }

  function handleOverlayClick(e) {
    if (dialogRef.current && !dialogRef.current.contains(e.target)) closeModal();
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      setDraftPath(text);
    } catch { }
  }

  async function handleSave() {
    const s = SLOTS.find(x => x.slot === modalSlot);
    if (!s) return;
    setSaving(true);
    const cleanVal = stripQuotes(draftPath);
    const name = isWebUrl(cleanVal)
      ? cleanVal
      : cleanVal.split('\\').pop().split('/').pop();
    await onUpdateClient({ [s.pathKey]: cleanVal, [s.nameKey]: name });
    setSaving(false);
    closeModal();
  }

  async function handlePickFolder(slot) {
    const s = SLOTS.find(x => x.slot === slot);
    try {
      if (window.electronAPI?.isElectron) {
        const fullPath = await window.electronAPI.pickFolder();
        if (!fullPath) return;
        const name = getPathBasename(fullPath);
        await onUpdateClient({ [s.pathKey]: fullPath, [s.nameKey]: name });
      } else if (window.showDirectoryPicker) {
        const handle = await window.showDirectoryPicker();
        await onUpdateClient({ [s.pathKey]: 'folder:' + handle.name, [s.nameKey]: handle.name });
      } else {
        folderInputRef.current.dataset.slot = slot;
        folderInputRef.current.click();
      }
    } catch {} // user cancelled
  }

  function handleFolderInputChange(e) {
    const files = e.target.files;
    if (!files.length) return;
    const slot = Number(e.target.dataset.slot);
    const s = SLOTS.find(x => x.slot === slot);
    const name = files[0].webkitRelativePath.split('/')[0];
    onUpdateClient({ [s.pathKey]: 'folder:' + name, [s.nameKey]: name });
    e.target.value = '';
  }

  async function handleUnlink(slot) {
    setConfirmUnlink(null);
    if (slot === 1) {
      await onUpdateClient({ [FILE_LINK_1_PATH]: null, [FILE_LINK_1_NAME]: null });
    } else {
      const s = SLOTS.find(x => x.slot === slot);
      await onUpdateClient({ [s.pathKey]: null, [s.nameKey]: null });
    }
  }

  const valid = isValidInput(draftPath);
  const badge = draftPath && valid ? getFileBadge(draftPath) : null;
  const activeLabel = modalSlot ? SLOTS.find(s => s.slot === modalSlot)?.label : '';

  async function openPdf() {
    const { data, error } = await supabase.storage.from(PDF_BUCKET).createSignedUrl(client[FILE_LINK_1_PATH], 300);
    if (error) { alert('שגיאה בפתיחת הקובץ'); return; }
    setPdfSignedUrl(data.signedUrl);
    setPdfViewer(true);
  }

  async function openFolder(path) {
    setFolderError(null);
    const err = await window.electronAPI.openFolder(path);
    if (err) setFolderError('התיקייה לא נמצאה — ייתכן שהועברה או נמחקה');
  }

  // Slot 2 (מחיצה) is usually a folder, but older clients may hold a web link or an Office file.
  const folderTile = (() => {
    const { slot, label, pathKey, nameKey } = SLOTS[1];
    const path = client[pathKey];
    const common = { label, kind: 'folder', onReplace: () => handlePickFolder(slot), onRemove: () => setConfirmUnlink(slot) };
    if (!path) {
      return <FileTile {...common} empty emptyText="קישור תיקייה" emptyHint="בחירת תיקייה מהמחשב" onOpen={() => handlePickFolder(slot)} />;
    }
    if (isAbsoluteFolderPath(path)) {
      const canOpen = !!window.electronAPI?.isElectron;
      return (
        <FileTile
          {...common}
          name={client[nameKey] || getPathBasename(path)}
          crumbs={path.split(/[\\/]/).filter(Boolean).slice(0, -1)}
          title={canOpen ? `פתיחת ${path}` : 'ניתן לפתוח רק מהאפליקציה במחשב'}
          onOpen={canOpen ? () => openFolder(path) : null}
          error={folderError}
        />
      );
    }
    if (isFolderLink(path)) return <FileTile {...common} name={getFolderName(path)} meta="נבחרה בדפדפן — לא ניתן לפתוח מכאן" />;
    const isUrl = isWebUrl(path);
    return (
      <FileTile
        {...common}
        kind={isUrl ? 'link' : 'doc'}
        name={isUrl ? 'קישור' : client[nameKey]}
        meta={isUrl ? path : getFileBadge(path).label}
        href={buildUri(path)}
        external={isUrl}
      />
    );
  })();

  return (
    <>
      <div className="detail-section" style={{ gridColumn: '1 / -1' }}>
        <h3 className="detail-section-title">קבצים מהירים</h3>
        <div className="file-tiles">
          {folderTile}
          {client[FILE_LINK_1_PATH] ? (
            <FileTile
              kind="pdf"
              label={FILE_LINK_LABEL_1}
              name={client[FILE_LINK_1_NAME] || 'הצעה.pdf'}
              meta={uploading ? 'מעלה...' : 'לחיצה לצפייה'}
              onOpen={openPdf}
              onReplace={() => pdfInputRef.current.click()}
              onRemove={() => setConfirmUnlink(1)}
            />
          ) : (
            <FileTile
              kind="pdf"
              label={FILE_LINK_LABEL_1}
              empty
              emptyText={uploading ? 'מעלה...' : 'העלאת PDF'}
              emptyHint="קובץ ההצעה ללקוח"
              onOpen={uploading ? null : () => pdfInputRef.current.click()}
            />
          )}
        </div>
      </div>

      <input ref={folderInputRef} type="file" webkitdirectory="" style={{ display: 'none' }} onChange={handleFolderInputChange} />
      <input ref={pdfInputRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handlePdfUpload} />

      {/* Link modal */}
      {modalSlot && (
        <div className="discard-overlay" onClick={handleOverlayClick}>
          <div
            className="discard-dialog"
            style={{ maxWidth: 480, width: '90%', textAlign: 'right' }}
            ref={dialogRef}
          >
            <h3 style={{ marginBottom: 16, fontSize: 17, fontWeight: 700 }}>
              קשר קובץ / קישור — {activeLabel}
            </h3>
            <div style={{ background: 'var(--color-bg)', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 13, lineHeight: 1.9 }}>
              <div><strong>קובץ Office מקומי:</strong> ב-File Explorer, Shift + לחיצה ימנית ← "Copy as path"</div>
              <div><strong>קישור רשת (Drive, SharePoint):</strong> הדבק את הכתובת ישירות</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                value={draftPath}
                onChange={e => setDraftPath(e.target.value)}
                placeholder='C:\...\file.docx  או  https://drive.google.com/...'
                style={{ flex: 1, direction: 'ltr', textAlign: 'left', fontFamily: 'monospace', fontSize: 13 }}
                autoFocus
              />
              <button className="btn btn-ghost btn-sm" onClick={handlePaste}>הדבק</button>
            </div>
            {draftPath && (
              <div style={{ marginBottom: 12 }}>
                {valid ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    background: BADGE_COLORS[badge?.color]?.bg,
                    color: BADGE_COLORS[badge?.color]?.text,
                  }}>
                    ✓ {badge?.label}
                  </span>
                ) : (
                  <span style={{ color: 'var(--color-error)', fontSize: 12 }}>
                    יש להזין נתיב לקובץ Office (.docx/.xlsx/.pptx) או כתובת https://
                  </span>
                )}
              </div>
            )}
            <div className="discard-actions" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={closeModal}>ביטול</button>
              <button className="btn btn-primary" disabled={!valid || saving} onClick={handleSave}>
                {saving ? 'שומר...' : 'שמור קישור'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer */}
      {pdfViewer && pdfSignedUrl && (
        <div className="discard-overlay" onClick={() => { setPdfViewer(false); setPdfSignedUrl(null); }} style={{ zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '90vw', height: '90vh', background: 'var(--color-surface)', borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setPdfViewer(false); setPdfSignedUrl(null); }}>✕ סגור</button>
              <span style={{ fontWeight: 600 }}>{client[FILE_LINK_1_NAME] || 'הצעה.pdf'}</span>
            </div>
            <iframe src={pdfSignedUrl} style={{ flex: 1, border: 'none', width: '100%' }} title="pdf-viewer" />
          </div>
        </div>
      )}

      {/* Unlink confirm */}
      {confirmUnlink && (
        <div className="discard-overlay" onClick={() => setConfirmUnlink(null)}>
          <div className="discard-dialog" onClick={e => e.stopPropagation()}>
            <p>להסיר את הקישור?</p>
            <div className="discard-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmUnlink(null)}>ביטול</button>
              <button className="btn btn-danger" onClick={() => handleUnlink(confirmUnlink)}>הסר</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
