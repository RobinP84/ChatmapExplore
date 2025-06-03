import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import FullWidthOverlay from './FullWidthOverlay';
import { CATEGORY_COLORS } from '../constants/categoryColors';
import { INFO_WINDOW_MODE } from '../constants/infoWindowModes';
import ExpandedPostBody from './ExpandedPostBody';
import MakePostBody from './MakePostBody';

/**
 * CustomInfoWindow wraps:
 *  - a “wrapper” <div> that React renders into
 *  - a FullWidthOverlay(map, position, wrapper) which handles positioning on the map
 *
 * Props:
 *   map         : google.maps.Map
 *   position    : { lat: number, lng: number }
 *   post        : { id, title, message, category, … } OR undefined if MAKE_POST
 *   mode        : one of INFO_WINDOW_MODE.{MINIMIZED, EXPANDED, MAKE_POST}
 *   onClick     : () ⇒ void  (when MINIMIZED → EXPANDED)
 *   onClose     : () ⇒ void  (when EXPANDED → close)
 *   onSave      : ({title, message}) ⇒ void (when MAKE_POST)
 *   onFavorite  : () ⇒ void  (when user clicks Favorite)
 *   isFavorited : boolean    (to render ★ vs ☆)
 *   className   : optional CSS class on the wrapper
 *   style       : optional inline style on the wrapper
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
  style = {},
}) {
  const overlayRef = useRef(null);   // holds the FullWidthOverlay instance
  const wrapperRef = useRef(null);   // holds the <div> we render React into
  const reactRootRef = useRef(null); // holds the React root from createRoot()

  // We need to know when React has finished painting into the wrapper
  // so that FullWidthOverlay.draw() can read wrapper.offsetHeight correctly:
  const [readyToDraw, setReadyToDraw] = useState(false);

  // ─── 1) On mount: create wrapper <div> & React root exactly once ─────
  useEffect(() => {
    const wrapper = document.createElement('div');
    wrapper.className = `custom-info-window ${className}`;

    // Prevent clicks (mousedown/touchstart/click) inside this wrapper
    // from falling through to the Google Map underneath:
    wrapper.addEventListener('mousedown', (e) => e.stopPropagation());
    wrapper.addEventListener('touchstart', (e) => e.stopPropagation());
    wrapper.addEventListener('click', (e) => e.stopPropagation());

    wrapperRef.current = wrapper;
    reactRootRef.current = createRoot(wrapper);

    return () => {
      // On unmount: defer unmount so it never runs mid‐render
      const r = reactRootRef.current;
      if (r) {
        Promise.resolve().then(() => r.unmount());
      }
      reactRootRef.current = null;
      wrapperRef.current = null;
    };
  }, [className]);

  // ─── 2) Whenever “mode or post or callbacks” change, re‐render React into wrapper ─────
  useEffect(() => {
    if (!reactRootRef.current) return;
    console.log("Mode =", mode);
    let content = null;
    if (mode === INFO_WINDOW_MODE.MAKE_POST) {
      // Show “Make a Post” form
      content = <MakePostBody onClose={onClose} onSave={onSave} />;
    } else if (mode === INFO_WINDOW_MODE.EXPANDED) {
      // Show expanded post body (title, message, chat toggler, favorite, close)
      content = (
        <ExpandedPostBody
          post={post}
          onClose={onClose}
          onFavorite={onFavorite}
          isFavorited={isFavorited}
        />
      );
    } else {
      // MINIMIZED: only show the title; clicking the <strong> → expands
      content = (
        <strong
          onClick={onClick}
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          {post?.title}
        </strong>
      );
    }

    // Render into the wrapper <div>:
    reactRootRef.current.render(content);

    // Now that React has finished painting into `wrapperRef.current`,
    // schedule a draw pass so FullWidthOverlay can measure offsetHeight:
    setReadyToDraw(true);
  }, [mode, post, onClick, onClose, onSave, onFavorite, isFavorited]);

  // ─── 3) Whenever “mode, post, or style” change, update wrapper’s CSS + (un)bind click listener ─────
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // Decide the border color (default for MAKE_POST, otherwise based on category)
    const hue =
      mode === INFO_WINDOW_MODE.MAKE_POST
        ? CATEGORY_COLORS.default
        : CATEGORY_COLORS[post?.category] || CATEGORY_COLORS.default;

    Object.assign(wrapper.style, {
      backgroundColor: 'white',
      border: `2px solid ${hue}`,
      borderRadius: '8px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
      padding: '0.5rem',
      ...style,
    });

    // When MINIMIZED, we want the entire wrapper to respond to click → expand
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

  // ─── 4) Whenever `map` or `position` change, (re)mount a brand‐new FullWidthOverlay ─────
  useEffect(() => {
    // Remove any old overlay
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }

    if (map && position && wrapperRef.current) {
      // Create a new overlay, which immediately does onAdd() → draw():
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

  // ─── 5) After React has painted into the wrapper (readyToDraw), force a redraw ─────
  useEffect(() => {
    if (readyToDraw && overlayRef.current) {
      // Call draw() explicitly so FullWidthOverlay re‐measures wrapper.offsetHeight
      overlayRef.current.draw();
      setReadyToDraw(false);
    }
  }, [readyToDraw]);

  return null; // This component never renders any DOM in React’s main tree
}