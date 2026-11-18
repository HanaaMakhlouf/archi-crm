import { useLayoutEffect, useRef } from 'react';

// Hides a table's least-needed columns, one at a time, until it fits its box.
// It measures the real table (names, sort arrows, buttons, zoom), so nothing
// is ever pushed out of view. The level goes on the box as data-hide="0..max";
// the CSS decides which column each level hides.
export function useFitColumns(maxLevel, deps) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const box = ref.current;
    if (!box) return undefined;
    const fit = () => {
      let l = 0;
      box.dataset.hide = '0';
      while (l < maxLevel && box.scrollWidth > box.clientWidth + 1) {
        l += 1;
        box.dataset.hide = String(l);
      }
    };
    fit(); // before the first paint, so the table never shows cut off

    // On resize, refit on the next frame: changing the layout inside the
    // observer's own callback makes the browser report a ResizeObserver loop.
    let width = box.clientWidth;
    let frame = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (box.clientWidth === width) return; // only width changes matter
        width = box.clientWidth;
        fit();
      });
    });
    ro.observe(box);
    return () => { ro.disconnect(); cancelAnimationFrame(frame); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxLevel, ...deps]);

  return ref;
}
