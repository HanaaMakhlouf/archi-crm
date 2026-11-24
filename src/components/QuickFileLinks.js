import { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { alertDialog } from './AppDialog';
import FileTile from './quickFiles/FileTile';
import PdfViewer from './quickFiles/PdfViewer';
import { openClientFolder } from '../utils/openClientFolder';
import {
  isWebUrl, isFolderLink, getFolderName, isAbsoluteFolderPath, getPathBasename, getFileBadge, buildUri,
} from '../utils/fileLinks';
import {
  FILE_LINK_1_PATH, FILE_LINK_1_NAME,
  FILE_LINK_2_PATH, FILE_LINK_2_NAME,
  FILE_LINK_LABEL_1, FILE_LINK_LABEL_2,
} from '../constants';

const PDF_BUCKET = 'offers';

const SLOTS = [
  { slot: 1, label: FILE_LINK_LABEL_1, pathKey: FILE_LINK_1_PATH, nameKey: FILE_LINK_1_NAME },
  { slot: 2, label: FILE_LINK_LABEL_2, pathKey: FILE_LINK_2_PATH, nameKey: FILE_LINK_2_NAME },
];

// כללי → קבצים מהירים: the client's folder (מחיצה) and the offer PDF (הצעה).
export default function QuickFileLinks({ client, onUpdateClient }) {
  const [confirmUnlink, setConfirmUnlink] = useState(null); // slot waiting for "remove?"
  const [pdfSignedUrl, setPdfSignedUrl] = useState(null);   // set while the PDF is open
  const [uploading, setUploading] = useState(false);
  const [folderError, setFolderError] = useState(null);
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
      alertDialog('שגיאה בהעלאת הקובץ: ' + err.message);
    }
    setUploading(false);
  }

  // The app (Electron) gets the full path; a browser only gets the folder's name.
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
    const s = SLOTS.find(x => x.slot === slot);
    await onUpdateClient({ [s.pathKey]: null, [s.nameKey]: null });
  }

  async function openPdf() {
    const { data, error } = await supabase.storage.from(PDF_BUCKET).createSignedUrl(client[FILE_LINK_1_PATH], 300);
    if (error) { alertDialog('שגיאה בפתיחת הקובץ'); return; }
    setPdfSignedUrl(data.signedUrl);
  }

  async function openFolder(path) {
    setFolderError(null);
    setFolderError(await openClientFolder(path, onUpdateClient));
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

      {pdfSignedUrl && (
        <PdfViewer
          url={pdfSignedUrl}
          name={client[FILE_LINK_1_NAME] || 'הצעה.pdf'}
          onClose={() => setPdfSignedUrl(null)}
        />
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
