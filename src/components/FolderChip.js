import { useState } from 'react';
import Icon from './Icon';
import { openClientFolder } from '../utils/openClientFolder';
import { FILE_LINK_2_PATH, FILE_LINK_2_NAME, FILE_LINK_LABEL_2 } from '../constants';
import { isWebUrl, isFolderLink, getFolderName, isAbsoluteFolderPath, getPathBasename } from './QuickFileLinks';

// The client's מחיצה folder as a button in the profile header's action bar, so it's one click
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
      <button type="button" className="btn btn-sm folder-chip folder-chip--empty" onClick={pick} title="בחירת תיקיית הלקוח">
        <Icon name="plus" size={15} />
        קישור {FILE_LINK_LABEL_2}
      </button>
    );
  }

  const name = isFolderLink(path) ? getFolderName(path) : (client[FILE_LINK_2_NAME] || getPathBasename(path));
  // Only real paths (in the desktop app) and web links can actually be opened.
  const canOpen = isWebUrl(path) || (isElectron && isAbsoluteFolderPath(path));

  const open = async () => {
    setError(null);
    if (isWebUrl(path)) { window.open(path, '_blank', 'noopener,noreferrer'); return; }
    setError(await openClientFolder(path, onUpdateClient));
  };

  return (
    <button
      type="button"
      className={`btn btn-sm folder-chip${error ? ' folder-chip--error' : ''}`}
      onClick={open}
      disabled={!canOpen}
      title={error || (canOpen ? `פתיחת התיקייה: ${name}` : 'ניתן לפתוח רק מהאפליקציה במחשב')}
    >
      <Icon name="folder" size={15} />
      פתיחת {FILE_LINK_LABEL_2}
    </button>
  );
}
