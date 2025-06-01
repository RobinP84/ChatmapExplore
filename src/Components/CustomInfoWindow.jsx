// src/Components/CustomInfoWindow.jsx
import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import FullWidthOverlay from './FullWidthOverlay';
import { CATEGORY_COLORS } from '../constants/categoryColors';
import { INFO_WINDOW_MODE } from '../constants/infoWindowModes';
import ExpandedPostBody from './ExpandedPostBody';
import MakePostBody from './MakePostBody';

export default function CustomInfoWindow({
  map,
  position,
  post,            // { id, title, message, category, … } OR undefined for MAKE_POST
  mode = INFO_WINDOW_MODE.MINIMIZED,
  onClick,
  onClose,
  onSave,          // for MAKE_POST
  onFavorite,      // for EXPANDED
  isFavorited,     // for EXPANDED
  className = '',
  style     = {},
}) {
  const overlayRef   = useRef(null);
  const wrapperRef   = useRef(null);
  const reactRootRef = useRef(null);

  // ── 1) Create the wrapper & React root ONCE
  useEffect(() => {
    const wrapper = document.createElement('div');

    // ─ Stop mousedown/touchstart so clicks don’t fall through to the map
    wrapper.addEventListener('mousedown', e => e.stopPropagation());
    wrapper.addEventListener('touchstart', e => e.stopPropagation());
    // (We do NOT stop "click" here, so we can attach it below.)

    wrapperRef.current = wrapper;
    reactRootRef.current = createRoot(wrapper);

    return () => {
      // Clean up React root
      const r = reactRootRef.current;
      if (r) {
        Promise.resolve().then(() => r.unmount());
      }
      reactRootRef.current = null;
    };
  }, []);

  // ── 2) When mode changes, attach or remove a 'click' listener on wrapper
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    function handleWrapperClick(e) {
      // Only call onClick if we're in MINIMIZED mode
      if (mode === INFO_WINDOW_MODE.MINIMIZED && typeof onClick === 'function') {
        onClick(e);
      }
    }

    if (mode === INFO_WINDOW_MODE.MINIMIZED) {
      wrapper.addEventListener('click', handleWrapperClick);
    } else {
      wrapper.removeEventListener('click', handleWrapperClick);
    }

    return () => {
      wrapper.removeEventListener('click', handleWrapperClick);
    };
  }, [mode, onClick]);

  // ── 3) Render whatever belongs inside (MAKE_POST, EXPANDED, or MINIMIZED)
  useEffect(() => {
    if (!reactRootRef.current) return;

    let content;
    if (mode === INFO_WINDOW_MODE.MAKE_POST) {
      // “make a post” form
      content = <MakePostBody onClose={onClose} onSave={onSave} />;
    } else if (mode === INFO_WINDOW_MODE.EXPANDED) {
      // Expanded post + chat + favorite button
      content = (
        <ExpandedPostBody
          post={post}
          onClose={onClose}
          onFavorite={onFavorite}
          isFavorited={isFavorited}
        />
      );
    } else {
      // MINIMIZED: just show the title
      content = <strong style={{ cursor: 'pointer' }}>{post.title}</strong>;
      // We no longer rely on <strong onClick={…}>, since the wrapper itself handles clicks
    }

    reactRootRef.current.render(content);
  }, [mode, post, onClose, onSave, onFavorite, isFavorited]);

  // ── 4) Update wrapper styles whenever category/style/mode/post change
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    wrapper.className = `custom-info-window ${className}`;

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