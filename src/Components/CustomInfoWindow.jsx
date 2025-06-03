// src/Components/CustomInfoWindow.jsx

import React, { useEffect, useRef, useState } from 'react';
import { createRoot }       from 'react-dom/client';
import FullWidthOverlay     from './FullWidthOverlay';
import { CATEGORY_COLORS }  from '../constants/categoryColors';
import { INFO_WINDOW_MODE } from '../constants/infoWindowModes';
import ExpandedPostBody     from './ExpandedPostBody';
import MakePostBody         from './MakePostBody';

/**
 * CustomInfoWindow:
 *   – Creates an empty <div> (wrapperRef.current)
 *   – Once React has rendered into that <div>, we call FullWidthOverlay(map, position, wrapper)
 *   – On each “mode” or “post” change, we re‐render React inside that wrapper, then ask the overlay to redraw.
 */
export default function CustomInfoWindow({
  map,
  position,
  post,
  mode = INFO_WINDOW_MODE.MINIMIZED,
  onClick,
  onClose,
  onSave,
  onFavorite,
  isFavorited,
  className = '',
  style     = {},
}) {
  const overlayRef   = useRef(null);   // Holds our OverlayView instance
  const wrapperRef   = useRef(null);   // Holds the <div> into which React will render
  const reactRootRef = useRef(null);   // Holds the React root from createRoot()

  // We track a “readyToDraw” flag so that once React has painted at least once
  // into wrapperRef.current, we can safely call overlay.draw() and trust offsetHeight.
  const [readyToDraw, setReadyToDraw] = useState(false);

  // ── 1) On mount: create the wrapper <div> and a React root exactly once
  useEffect(() => {
    const wrapper = document.createElement('div');
    wrapper.className = `custom-info-window ${className}`;

    // Prevent clicks from leaking down to the map:
    wrapper.addEventListener('mousedown', e => e.stopPropagation());
    wrapper.addEventListener('touchstart', e => e.stopPropagation());

    wrapperRef.current = wrapper;
    reactRootRef.current = createRoot(wrapper);

    return () => {
      const r = reactRootRef.current;
      if (r) {
        // Defer unmount so it never runs mid‐render:
        Promise.resolve().then(() => r.unmount());
      }
      reactRootRef.current = null;
      wrapperRef.current = null;
    };
  }, [className]);

  // ── 2) Whenever “mode/post” or callbacks change, re‐render React into wrapper.
  //     Then set readyToDraw=true so that we can schedule a draw pass.
  useEffect(() => {
    if (!reactRootRef.current) return;

     console.log("🔄 CustomInfoWindow render effect: mode=", mode, "post.id=", post?.id);

    let content;
    if (mode === INFO_WINDOW_MODE.MAKE_POST) {
      content = <MakePostBody onClose={onClose} onSave={onSave} />;
    } else if (mode === INFO_WINDOW_MODE.EXPANDED) {
      content = (
        <ExpandedPostBody
          post={post}
          onClose={onClose}
          onFavorite={onFavorite}
          isFavorited={isFavorited}
        />
      );
    } else {
      content = (
        <strong onClick={onClick} style={{ cursor: 'pointer', userSelect: 'none' }}>
          {post.title}
        </strong>
      );
    }

    reactRootRef.current.render(content);
    // Now React has rendered into wrapperRef.current; schedule a draw pass:
    setReadyToDraw(true);
  }, [mode, post, onClick, onClose, onSave, onFavorite, isFavorited]);

  // ── 3) Update wrapper’s CSS + click listener whenever mode/post/style changes
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const hue =
      mode === INFO_WINDOW_MODE.MAKE_POST
        ? CATEGORY_COLORS.default
        : (CATEGORY_COLORS[post?.category] || CATEGORY_COLORS.default);

    Object.assign(wrapper.style, {
      backgroundColor: 'white',
      border: `2px solid ${hue}`,
      borderRadius: '8px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
      padding: '0.5rem',
      ...style,
    });

    function handleWrapperClick(e) {
      if (mode === INFO_WINDOW_MODE.MINIMIZED && onClick) {
        onClick();
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
  }, [mode, post, onClick, style]);

  // ── 4) Whenever map/position change, (re)mount a brand‐new overlay
  useEffect(() => {
    // If there’s an old overlay, remove it
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }

    if (map && position && wrapperRef.current) {
      // Create a new OverlayView (this calls onAdd() → draw() internally)
      overlayRef.current = FullWidthOverlay(
        map,
        position,
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

  // ── 5) Once React has updated the wrapper’s content (readyToDraw === true),
  //     force a redraw so FullWidthOverlay.draw() sees the correct wrapper height.
  useEffect(() => {
    if (readyToDraw && overlayRef.current) {
      // Call draw() so it re‐measures wrapper.offsetHeight (which is now accurate).
      overlayRef.current.draw();
      setReadyToDraw(false);
    }
  }, [readyToDraw]);

  return null; // This component never renders anything in the normal React tree
}