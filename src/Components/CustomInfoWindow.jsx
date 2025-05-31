// src/Components/CustomInfoWindow.jsx
import React, { useEffect, useRef } from 'react';
import { createRoot }       from 'react-dom/client';
import FullWidthOverlay     from './FullWidthOverlay';
import { CATEGORY_COLORS }  from '../constants/categoryColors';
import { INFO_WINDOW_MODE } from '../constants/infoWindowModes';
import ExpandedPostBody     from './ExpandedPostBody';
import MakePostBody         from './MakePostBody';

export default function CustomInfoWindow({
  map,
  position,
  post,            // { id, title, message, category, … } OR undefined for MAKE_POST
  mode = INFO_WINDOW_MODE.MINIMIZED,
  onClick,
  onClose,
  onSave,           // ← newly accepted prop for MAKE_POST
  className = '',
  style     = {},
}) {
  const overlayRef   = useRef(null);
  const wrapperRef   = useRef(null);
  const reactRootRef = useRef(null);

  // ── 1) Create the wrapper & React root ONCE
  useEffect(() => {
    const wrapper = document.createElement('div');
    
    // ─ Stop click events from bubbling to the underlying map:
    wrapper.addEventListener('click', e => {
      e.stopPropagation();
    });

    wrapperRef.current = wrapper;
    reactRootRef.current = createRoot(wrapper);

    return () => {
      // Defer unmount so it never runs mid-render
      const r = reactRootRef.current;
      Promise.resolve().then(() => r.unmount());
      reactRootRef.current = null;
    };
  }, []);

  // ── 2) Render whenever mode, post, or callbacks change
  useEffect(() => {
    if (!reactRootRef.current) return;

    let content;
    if (mode === INFO_WINDOW_MODE.MAKE_POST) {
      // Render the “make a post” form
      content = <MakePostBody onClose={onClose} onSave={onSave} />;
    } else if (mode === INFO_WINDOW_MODE.EXPANDED) {
      // Render an expanded post + chat
      content = <ExpandedPostBody post={post} onClose={onClose} />;
    } else {
      // MINIMIZED: just show the title (post must exist here)
      content = <strong onClick={onClick}>{post.title}</strong>;
    }

    reactRootRef.current.render(content);
  }, [mode, post, onClick, onClose, onSave]);

  // ── 3) Update border & inline styles when category/style/mode change
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    wrapper.className = `custom-info-window ${className}`;

    // If we’re in MAKE_POST mode, or if `post` is undefined, just use default color
    const hue =
      mode === INFO_WINDOW_MODE.MAKE_POST
        ? CATEGORY_COLORS.default
        : (CATEGORY_COLORS[post?.category] || CATEGORY_COLORS.default);

    Object.assign(wrapper.style, {
      border: `2px solid ${hue}`,
      cursor: mode === INFO_WINDOW_MODE.MINIMIZED ? 'pointer' : 'default',
      ...style,
    });
  }, [className, style, mode, post]);

  // ── 4) If MINIMIZED, attach a click handler to the wrapper
  useEffect(() => {
    const w = wrapperRef.current;
    if (!w || !onClick || mode !== INFO_WINDOW_MODE.MINIMIZED) return;
    w.addEventListener('click', onClick);
    return () => {
      w.removeEventListener('click', onClick);
    };
  }, [onClick, mode]);

  // ── 5) Mount / cleanup the Google Overlay when map or position changes
  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }
    if (map && position && wrapperRef.current) {
      overlayRef.current = FullWidthOverlay(
        map,
        { lat: position.lat, lng: position.lng },
        wrapperRef.current
      );
    }
    return () => {
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    };
  }, [map, position]);

  return null;
}