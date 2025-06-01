// src/Components/CustomInfoWindow.jsx

import React, { useEffect, useRef } from 'react';
import { createRoot }       from 'react-dom/client';
import FullWidthOverlay     from './FullWidthOverlay';
import { CATEGORY_COLORS }  from '../constants/categoryColors';
import { INFO_WINDOW_MODE } from '../constants/infoWindowModes';
import ExpandedPostBody     from './ExpandedPostBody';
import MakePostBody         from './MakePostBody';

/**
 * CustomInfoWindow is the “wrapper” that:
 *  1. Creates an empty <div> (stored in wrapperRef.current).
 *  2. Instantiates a FullWidthOverlay(map, position, wrapperDiv).
 *  3. Whenever `mode` or `post` changes:
 *     • We re‐render React content (either MakePostBody, ExpandedPostBody, or just <strong>title</strong>).
 *     • FullWidthOverlay.draw() repositions the wrapper above the marker.
 *
 * Props:
 *   - map         (google.maps.Map)
 *   - position    ({ lat: number, lng: number })
 *   - post        ({ id, title, message, category, … }) OR undefined if mode === MAKE_POST
 *   - mode        one of INFO_WINDOW_MODE.{MINIMIZED, EXPANDED, MAKE_POST}
 *   - onClick     callback when MINIMIZED wrapper is clicked
 *   - onClose     callback when EXPANDED is closed
 *   - onSave      callback when “Post” is clicked in MAKE_POST
 *   - onFavorite  callback when “Favorite” is clicked in EXPANDED
 *   - isFavorited boolean whether this post is already a favorite
 *   - className   optional CSS class for the wrapper
 *   - style       optional inline CSS for the wrapper
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
  const overlayRef   = useRef(null);   // Will hold the FullWidthOverlay instance
  const wrapperRef   = useRef(null);   // Will hold the <div> into which we render React content
  const reactRootRef = useRef(null);   // Will hold the React root for `createRoot(wrapper)`

  // ── 1) On mount: create wrapper <div> and React root ONCE
  useEffect(() => {
    const wrapper = document.createElement('div');
    wrapper.className = `custom-info-window ${className}`;

    // Prevent clicks from propagating down to Google Map behind:
    wrapper.addEventListener('mousedown', e => e.stopPropagation());
    wrapper.addEventListener('touchstart', e => e.stopPropagation());

    wrapperRef.current = wrapper;
    reactRootRef.current = createRoot(wrapper);

    return () => {
      // On unmount: defer unmount so it never runs mid‐render:
      const r = reactRootRef.current;
      if (r) {
        Promise.resolve().then(() => r.unmount());
      }
      reactRootRef.current = null;
      wrapperRef.current = null;
    };
  }, [className]);

  // ── 2) Whenever `mode` or `post` or callbacks change, re‐render the inner React content
  useEffect(() => {
    if (!reactRootRef.current) return;

    let content = null;
    if (mode === INFO_WINDOW_MODE.MAKE_POST) {
      // Show the “Make a Post” form
      content = <MakePostBody onClose={onClose} onSave={onSave} />;
    } else if (mode === INFO_WINDOW_MODE.EXPANDED) {
      // Show the expanded post (title/message/chat/favorite/close)
      content = (
        <ExpandedPostBody
          post={post}
          onClose={onClose}
          onFavorite={onFavorite}
          isFavorited={isFavorited}
        />
      );
    } else {
      // MINIMIZED: show only the title; clicking it toggles expansion
      content = (
        <strong onClick={onClick} style={{ cursor: 'pointer', userSelect: 'none' }}>
          {post.title}
        </strong>
      );
    }

    reactRootRef.current.render(content);
  }, [mode, post, onClick, onClose, onSave, onFavorite, isFavorited]);

  // ── 3) Whenever `mode` or `post` or `style` changes, update wrapper’s CSS + click listener
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // Decide border color (default for MAKE_POST, otherwise based on category)
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

    // If we are MINIMIZED, clicking anywhere in the wrapper should expand:
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

  // ── 4) Whenever `map` or `position` changes, (re)mount the FullWidthOverlay
  useEffect(() => {
    // Clean up any existing overlay first:
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }

    if (map && position && wrapperRef.current) {
      // Instantiate a new FullWidthOverlay(map, position, wrapperDiv)
      overlayRef.current = FullWidthOverlay(
        map,
        position,
        wrapperRef.current
      );
      // (FullWidthOverlay’s constructor already calls setMap(map))
    }

    return () => {
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    };
  }, [map, position]);

  return null; // This component never renders any DOM in React’s main tree
}