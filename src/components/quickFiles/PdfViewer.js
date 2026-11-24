// The offer PDF shown over the page; a click outside it or סגור closes it.
export default function PdfViewer({ url, name, onClose }) {
  return (
    <div className="discard-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '90vw', height: '90vh', background: 'var(--color-surface)', borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕ סגור</button>
          <span style={{ fontWeight: 600 }}>{name}</span>
        </div>
        <iframe src={url} style={{ flex: 1, border: 'none', width: '100%' }} title="pdf-viewer" />
      </div>
    </div>
  );
}
