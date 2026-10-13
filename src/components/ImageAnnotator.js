import { useState, useEffect, useRef, useCallback } from 'react';
import { MESSAGE_IMAGE_MAX_MB } from '../constants';

const PEN_COLORS = ['#e53935', '#fdd835', '#1e88e5', '#43a047', '#000000', '#ffffff'];
const MAX_SIDE = 2000; // bigger photos are scaled down so the result stays small

const drawStroke = (ctx, stroke) => {
  const [first, ...rest] = stroke.points;
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (!rest.length) { // a single tap draws a dot
    ctx.beginPath();
    ctx.arc(first.x, first.y, stroke.width / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);
  rest.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.stroke();
};

const toBlob = (canvas, type, quality) => new Promise(resolve => canvas.toBlob(resolve, type, quality));

// Draw on a picture with a pen. `initialStrokes` restores earlier drawings so
// they stay removable; onSave(file, strokes) gets the flattened picture.
export default function ImageAnnotator({ image, initialStrokes = [], onSave, onCancel }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const drawingRef = useRef(null); // stroke in progress
  const [strokes, setStrokes] = useState(initialStrokes);
  const [color, setColor] = useState(PEN_COLORS[0]);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const redraw = useCallback((list) => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
    list.forEach(s => drawStroke(ctx, s));
  }, []);

  useEffect(() => {
    const url = URL.createObjectURL(image);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
      canvasRef.current.width = Math.round(img.naturalWidth * scale);
      canvasRef.current.height = Math.round(img.naturalHeight * scale);
      imgRef.current = img;
      setReady(true);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [image]);

  useEffect(() => { if (ready) redraw(strokes); }, [ready, strokes, redraw]);

  // Canvas pixels ≠ screen pixels when the picture is shown smaller.
  const pointAt = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const handleDown = (e) => {
    if (!ready) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const width = Math.max(3, Math.round(canvasRef.current.width / 200));
    drawingRef.current = { color, width, points: [pointAt(e)] };
    drawStroke(canvasRef.current.getContext('2d'), drawingRef.current);
  };

  const handleMove = (e) => {
    const stroke = drawingRef.current;
    if (!stroke) return;
    const prev = stroke.points[stroke.points.length - 1];
    const next = pointAt(e);
    stroke.points.push(next);
    drawStroke(canvasRef.current.getContext('2d'), { ...stroke, points: [prev, next] });
  };

  const handleUp = () => {
    const stroke = drawingRef.current;
    if (!stroke) return;
    drawingRef.current = null;
    setStrokes(prev => [...prev, stroke]);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const canvas = canvasRef.current;
    const maxBytes = MESSAGE_IMAGE_MAX_MB * 1024 * 1024;
    // Keep PNG for screenshots; fall back to JPEG when it gets too big.
    let type = image.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
    let blob = await toBlob(canvas, type, 0.9);
    if (blob && blob.size > maxBytes && type === 'image/png') {
      type = 'image/jpeg';
      blob = await toBlob(canvas, type, 0.85);
    }
    setSaving(false);
    if (!blob || blob.size > maxBytes) {
      setError(`התמונה גדולה מדי (עד ${MESSAGE_IMAGE_MAX_MB}MB).`);
      return;
    }
    const name = `${(image.name || 'image').replace(/\.[^.]+$/, '')}.${type === 'image/jpeg' ? 'jpg' : 'png'}`;
    onSave(new File([blob], name, { type }), strokes);
  };

  return (
    <div className="modal-overlay annotator-overlay">
      <div className="modal annotator">
        <div className="annotator-toolbar">
          <span className="annotator-label">עט:</span>
          {PEN_COLORS.map(c => (
            <button
              key={c}
              type="button"
              className={`annotator-color${c === color ? ' active' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={`צבע ${c}`}
            />
          ))}
          <span className="annotator-spacer" />
          <button type="button" className="btn btn-ghost btn-sm" disabled={!strokes.length}
            onClick={() => setStrokes(prev => prev.slice(0, -1))}>
            ביטול פעולה
          </button>
          <button type="button" className="btn btn-ghost btn-sm" disabled={!strokes.length}
            onClick={() => setStrokes([])}>
            מחיקת כל השינויים
          </button>
        </div>

        <div className="annotator-canvas-wrap">
          <canvas
            ref={canvasRef}
            className="annotator-canvas"
            onPointerDown={handleDown}
            onPointerMove={handleMove}
            onPointerUp={handleUp}
            onPointerCancel={handleUp}
          />
          {!ready && <span className="muted">טוען תמונה...</span>}
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>ביטול</button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={!ready || saving}>
            {saving ? 'שומר...' : 'שמירה'}
          </button>
        </div>
      </div>
    </div>
  );
}
