// src/Components/CustomInfoWindow.jsx
import React, { useEffect, useRef } from 'react';
import { createRoot }        from 'react-dom/client';
import FullWidthOverlay      from './FullWidthOverlay';
import { CATEGORY_COLORS }   from '../constants/categoryColors';
import { INFO_WINDOW_MODE }  from '../constants/infoWindowModes';
import ExpandedPostBody      from './ExpandedPostBody';

export default function CustomInfoWindow({
  map,
  position,
  post,             // { id, title, message, category, … }
  mode = INFO_WINDOW_MODE.MINIMIZED,
  onClick,
  onClose,
  className = '',
  style     = {},
}) {
  const overlayRef   = useRef(null);
  const wrapperRef   = useRef(null);
  const reactRootRef = useRef(null);

  // 1) Create the wrapper & React root ONCE
  useEffect(() => {
    const wrapper = document.createElement('div');
    wrapperRef.current = wrapper;
    reactRootRef.current = createRoot(wrapper);
    return () => {
      // defer unmount so it never runs mid‐render
      const root = reactRootRef.current;
      Promise.resolve().then(() => root.unmount());
      reactRootRef.current = null;
    };
  }, []);

  // 2) Render whenever mode or post changes
  useEffect(() => {
    if (!reactRootRef.current) return;
    let content;
    if (mode === INFO_WINDOW_MODE.EXPANDED) {
      content = <ExpandedPostBody post={post} onClose={onClose} />;
    } else {
      content = <strong onClick={onClick}>{post.title}</strong>;
    }
    reactRootRef.current.render(content);
  }, [mode, post, onClick, onClose]);

  // 3) Update border color & inline styles when category or style change
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    wrapper.className = `custom-info-window ${className}`;
    const hue = CATEGORY_COLORS[post.category] || CATEGORY_COLORS.default;
    Object.assign(wrapper.style, {
      border: `2px solid ${hue}`,
      cursor: mode === INFO_WINDOW_MODE.MINIMIZED ? 'pointer' : 'default',
      ...style,
    });
  }, [className, post.category, style, mode]);

  // 4) Attach one click‐at‐large if provided
  useEffect(() => {
    const w = wrapperRef.current;
    if (!w || !onClick || mode !== INFO_WINDOW_MODE.MINIMIZED) return;
    w.addEventListener('click', onClick);
    return () => {
      w.removeEventListener('click', onClick);
    };
  }, [onClick, mode]);

  // 5) Mount/cleanup the Google overlay when map/position change
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