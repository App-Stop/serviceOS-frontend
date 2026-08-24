import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './Popover.css';

/**
 * Floating panel rendered into `document.body` so it escapes any scrolling or
 * clipping ancestor — table rows in particular, which sit inside an
 * `overflow: auto` wrapper that would otherwise crop the menu.
 *
 * Position is measured from `anchorRef` and refreshed on scroll and resize.
 */
export const Popover = ({ anchorRef, align = 'left', onDismiss, className = '', children }) => {
  const panelRef = useRef(null);
  const [rect, setRect] = useState(null);

  useLayoutEffect(() => {
    const update = () => setRect(anchorRef.current?.getBoundingClientRect() ?? null);
    update();
    // Capture phase so nested scroll containers are picked up too.
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [anchorRef]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (panelRef.current?.contains(event.target)) return;
      if (anchorRef.current?.contains(event.target)) return;
      onDismiss?.();
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onDismiss?.();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [anchorRef, onDismiss]);

  if (!rect) return null;

  const style = {
    top: `${rect.bottom + 6}px`,
    ...(align === 'right'
      ? { right: `${window.innerWidth - rect.right}px` }
      : { left: `${rect.left}px` }),
  };

  return createPortal(
    <div ref={panelRef} className={`popover ${className}`.trim()} style={style}>
      {children}
    </div>,
    document.body,
  );
};
