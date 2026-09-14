import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import {
  FILE_LINK_1_PATH, FILE_LINK_1_NAME,
  FILE_LINK_2_PATH, FILE_LINK_2_NAME,
  FILE_LINK_LABEL_1, FILE_LINK_LABEL_2,
} from '../constants';

const PDF_BUCKET = 'offers';

function stripQuotes(str) {
  return str.replace(/^"|"$/g, '').trim();
}

function isWebUrl(raw) {
  return /^https?:\/\/.+/i.test(raw.trim());
}

function isFolderLink(raw) { return raw?.startsWith('folder:'); }
function getFolderName(raw) { return raw?.replace('folder:', '') || ''; }

function isAbsoluteFolderPath(raw) {
  if (!raw) return false;
  if (isWebUrl(raw)) return false;
  if (raw.startsWith('folder:')) return false;
  // Has a file extension → it's a file, not a folder
  if (/\.(docx?|xlsx?|pptx?)$/i.test(raw)) return false;
  // Looks like an absolute path (Windows C:\ or Unix /)
  return /^([a-zA-Z]:[\\/]|\/)/.test(raw);
}

function getPathBasename(p) {
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

function getFileIcon(raw) {
  if (isWebUrl(raw)) return '🔗';
  const ext = getExt(raw);
  if (['docx', 'doc'].includes(ext)) return '📄';
  if (['xlsx', 'xls'].includes(ext)) return '📊';
  if (['pptx', 'ppt'].includes(ext)) return '📑';
  return '📁';
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

  return (
    <>
      <div className="detail-section" style={{ gridColumn: '1 / -1' }}>
        <h3 className="detail-section-title">קבצים מהירים</h3>
        <p className="muted" style={{ marginBottom: 16, fontSize: 13 }}>קשר תיקיות מקומיות, קבצי Office או קישורי רשת</p>

        {/* Slot 1 — PDF הצעה */}
        <div className="detail-row" style={{ padding: '12px 0', alignItems: 'center' }}>
          <span className="detail-label" style={{ minWidth: 80 }}>{FILE_LINK_LABEL_1}</span>
          {client[FILE_LINK_1_PATH] ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 20 }}>📄</span>
              <div style={{ textAlign: 'right', flex: 1, overflow: 'hidden' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{client[FILE_LINK_1_NAME] || 'הצעה.pdf'}</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={async () => {
                const { data, error } = await supabase.storage.from(PDF_BUCKET).createSignedUrl(client[FILE_LINK_1_PATH], 300);
                if (error) { alert('שגיאה בפתיחת הקובץ'); return; }
                setPdfSignedUrl(data.signedUrl);
                setPdfViewer(true);
              }}>צפה</button>
              <button className="btn btn-ghost btn-sm" onClick={() => pdfInputRef.current.click()} disabled={uploading}>
                {uploading ? '...' : 'החלף'}
              </button>
              <button className="btn btn-ghost btn-sm" style={{ padding: '6px 8px', color: 'var(--color-error)' }} onClick={() => setConfirmUnlink(1)}>✕</button>
            </div>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={() => pdfInputRef.current.click()} disabled={uploading}>
              {uploading ? 'מעלה...' : '+ העלה PDF'}
            </button>
          )}
        </div>

        {/* Slot 2 — folder מחיצה */}
        {(() => {
          const { slot, label, pathKey, nameKey } = SLOTS[1];
          const path = client[pathKey];
          const name = client[nameKey];
          const isUrl = path && isWebUrl(path);
          const isLegacyFolder = path && isFolderLink(path);
          const isNativeFolder = path && isAbsoluteFolderPath(path);
          const isFolder = isLegacyFolder || isNativeFolder;
          return (
            <div key={slot} className="detail-row" style={{ padding: '12px 0', alignItems: 'center' }}>
              <span className="detail-label" style={{ minWidth: 80 }}>{label}</span>
              {isFolder ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 20 }}>📁</span>
                  <div style={{ textAlign: 'right', flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {isLegacyFolder ? getFolderName(path) : (name || getPathBasename(path))}
                    </div>
                    {isNativeFolder && (
                      <div className="muted" style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260, direction: 'ltr', textAlign: 'left' }}>
                        {path}
                      </div>
                    )}
                  </div>
                  {isNativeFolder && window.electronAPI?.isElectron && (
                    <button className="btn btn-primary btn-sm" onClick={() => window.electronAPI.openFolder(path)}>פתח</button>
                  )}
                  <button className="btn btn-ghost btn-sm" style={{ padding: '6px 8px', color: 'var(--color-error)' }} onClick={() => setConfirmUnlink(slot)}>✕</button>
                </div>
              ) : path ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 20 }}>{getFileIcon(path)}</span>
                  <div style={{ textAlign: 'right', flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{isUrl ? 'קישור' : name}</div>
                    <div className="muted" style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260, direction: 'ltr', textAlign: 'left' }}>{path}</div>
                  </div>
                  <a href={buildUri(path)} className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }} target={isUrl ? '_blank' : undefined} rel={isUrl ? 'noopener noreferrer' : undefined}>פתח</a>
                  <button className="btn btn-ghost btn-sm" style={{ padding: '6px 8px', color: 'var(--color-error)' }} onClick={() => setConfirmUnlink(slot)}>✕</button>
                </div>
              ) : (
                <button className="btn btn-ghost btn-sm" onClick={() => handlePickFolder(slot)}>+ קשר תיקייה</button>
              )}
            </div>
          );
        })()}
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
