import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import FullWidthOverlay from './FullWidthOverlay';
import { CATEGORY_COLORS } from '../constants/categoryColors';
import { INFO_WINDOW_MODE } from '../constants/infoWindowModes';
import ExpandedPostBody from './ExpandedPostBody';
import MakePostBody from './MakePostBody';

/**
 * CustomInfoWindow pulls together:
 *  - A “wrapper” <div> that React renders into
 *  - A FullWidthOverlay that positions that wrapper on the map
 *  - An internal “mode” prop (MINIMIZED / EXPANDED / MAKE_POST)
 *
 * Props:
 *   map         : google.maps.Map
 *   position    : { lat: number, lng: number }
 *   post        : { id, title, message, category, … } OR undefined if MAKE_POST
 *   mode        : one of INFO_WINDOW_MODE.{MINIMIZED, EXPANDED, MAKE_POST}
 *   onClick     : () ⇒ void, called when user clicks MINIMIZED wrapper
 *   onClose     : () ⇒ void, called when user clicks × in EXPANDED
 *   onSave      : ({title, message}) ⇒ void, called in MAKE_POST
 *   onFavorite  : () ⇒ void, called in EXPANDED
 *   isFavorited : boolean, whether this post is already favorited
 *   className   : optional CSS class on wrapper
 *   style       : optional inline style on wrapper
 */
export default function CustomInfoWindow({
  map,
  position,
  post,
  mode = INFO_WINDOW_MODE.MINIMIZED, //Why is this default?
  onClick,
  onClose,
  onSave,
  onFavorite,
  isFavorited,
  className = '',
  style = {},
}) {
  const overlayRef = useRef(null);   // holds the FullWidthOverlay instance
  const wrapperRef = useRef(null);   // holds the <div> into which we render React
  const reactRootRef = useRef(null); // holds the React root (createRoot)

  // We need a flag so that after React pushes new content into wrapper,
  // we can force a redraw (so FullWidthOverlay.draw() measures the correct height).
  const [readyToDraw, setReadyToDraw] = useState(false);

  // ─── 1) On mount: create the wrapper <div> & React root ONCE ─────
  useEffect(() => {
    const wrapper = document.createElement('div');
    wrapper.className = `custom-info-window ${className}`;

    // Prevent clicks on this wrapper from “falling through” to the map
    wrapper.addEventListener('mousedown', (e) => e.stopPropagation());
    wrapper.addEventListener('touchstart', (e) => e.stopPropagation());

    wrapperRef.current = wrapper;
    reactRootRef.current = createRoot(wrapper);

    return () => {
      const r = reactRootRef.current;
      if (r) {
        // Defer unmount so it never interrupts a render
        Promise.resolve().then(() => r.unmount());
      }
      reactRootRef.current = null;
      wrapperRef.current = null;
    };
  }, [className]);

  // ─── 2) Whenever mode or post or callbacks change, re‐render inside wrapper ─────
  useEffect(() => {
    if (!reactRootRef.current) return;
    console.log("Mode = ", mode);
    let content = null;
    if (mode === INFO_WINDOW_MODE.MAKE_POST) {
      // Show “Make a Post” form
      content = <MakePostBody onClose={onClose} onSave={onSave} />;
    } else if (mode === INFO_WINDOW_MODE.EXPANDED) {
      // Show the expanded post (title, message, chat toggle, favorite, close)
      console.log("📞 Spawning Expanded post body for ", post.id);
      content = (
        <ExpandedPostBody
          post={post}
          onClose={onClose}
          onFavorite={onFavorite}
          isFavorited={isFavorited}
        />
      );
    } else {
      // MINIMIZED: show only the title; clicking the wrapper expands it
      content = (
        <strong
          onClick={onClick}
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          {post?.title}
        </strong>
      );
    }

    reactRootRef.current.render(content);
    // Mark “readyToDraw” so that the wrapper has correct height before we draw
    setReadyToDraw(true);
  }, [mode, post, onClick, onClose, onSave, onFavorite, isFavorited]);

  // ─── 3) Whenever mode/post/style change: update wrapper CSS & click listener ─────
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // Determine border color (default if MAKE_POST, otherwise from category)
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

    function handleWrapperClick(e) {
      if (mode === INFO_WINDOW_MODE.MINIMIZED && onClick) {
        onClick();
      }
    }

    // Only listen for clicks when MINIMIZED
    if (mode === INFO_WINDOW_MODE.MINIMIZED) {
      wrapper.addEventListener('click', handleWrapperClick);
    } else {
      wrapper.removeEventListener('click', handleWrapperClick);
    }

    return () => {
      wrapper.removeEventListener('click', handleWrapperClick);
    };
  }, [mode, post, onClick, style]);

  // ─── 4) Whenever map or position change: mount‐or‐remount the overlay ─────
  useEffect(() => {
    // Remove any existing overlay
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }

    if (map && position && wrapperRef.current) {
      // Create a brand‐new FullWidthOverlay(
      //    map, {lat, lng}, wrapperDiv
      // ), which immediately does onAdd() → draw().
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

  // ─── 5) Once React has rendered into wrapper (readyToDraw), force a redraw ─────
  useEffect(() => {
    if (readyToDraw && overlayRef.current) {
      // Call draw() so FullWidthOverlay re‐measures wrapper.offsetHeight
      overlayRef.current.draw();
      setReadyToDraw(false);
    }
  }, [readyToDraw]);

  return null; // This component never renders any DOM in React’s normal tree
}