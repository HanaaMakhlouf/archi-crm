import { useState } from 'react';
import Icon from './Icon';
import { FILE_LINK_2_PATH, FILE_LINK_2_NAME, FILE_LINK_LABEL_2 } from '../constants';
import { isWebUrl, isFolderLink, getFolderName, isAbsoluteFolderPath, getPathBasename } from './QuickFileLinks';

// The client's מחיצה folder as a chip in the profile header, so it's one click
// away from every tab. Linked → opens it; not linked → picks a folder
// (editors only). Linking files/PDFs is still done in כללי → קבצים מהירים.
export default function FolderChip({ client, onUpdateClient, canEdit }) {
  const [error, setError] = useState(null);
  const path = client[FILE_LINK_2_PATH];
  const isElectron = !!window.electronAPI?.isElectron;

  if (!path) {
    if (!canEdit || !isElectron) return null;
    const pick = async () => {
      const fullPath = await window.electronAPI.pickFolder();
      if (fullPath) onUpdateClient({ [FILE_LINK_2_PATH]: fullPath, [FILE_LINK_2_NAME]: getPathBasename(fullPath) });
    };
    return (
      <button type="button" className="folder-chip folder-chip--empty" onClick={pick}>
        <span className="folder-chip-icon"><Icon name="plus" size={15} /></span>
        <span className="folder-chip-text">
          <span className="folder-chip-label">{FILE_LINK_LABEL_2}</span>
          <span className="folder-chip-name">קישור תיקייה</span>
        </span>
      </button>
    );
  }

  const name = isFolderLink(path) ? getFolderName(path) : (client[FILE_LINK_2_NAME] || getPathBasename(path));
  // Only real paths (in the desktop app) and web links can actually be opened.
  const canOpen = isWebUrl(path) || (isElectron && isAbsoluteFolderPath(path));

  const open = async () => {
    setError(null);
    if (isWebUrl(path)) { window.open(path, '_blank', 'noopener,noreferrer'); return; }
    const err = await window.electronAPI.openFolder(path);
    if (err) setError('התיקייה לא נמצאה — ייתכן שהועברה או נמחקה');
  };

  return (
    <button
      type="button"
      className={`folder-chip${error ? ' folder-chip--error' : ''}`}
      onClick={open}
      disabled={!canOpen}
      title={error || (canOpen ? `פתיחת התיקייה: ${path}` : 'ניתן לפתוח רק מהאפליקציה במחשב')}
    >
      <span className="folder-chip-icon"><Icon name="folder" size={16} /></span>
      <span className="folder-chip-text">
        <span className="folder-chip-label">{FILE_LINK_LABEL_2}</span>
        <span className="folder-chip-name">{name}</span>
      </span>
      {canOpen && <span className="folder-chip-go" aria-hidden="true">←</span>}
    </button>
  );
}
