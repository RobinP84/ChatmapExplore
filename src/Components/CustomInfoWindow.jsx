// src/Components/CustomInfoWindow.jsx

import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import FullWidthOverlay from './FullWidthOverlay';
import { CATEGORY_COLORS } from '../constants/categoryColors';
import { INFO_WINDOW_MODE } from '../constants/infoWindowModes';
import ExpandedPostBody from './ExpandedPostBody';
import MakePostBody from './MakePostBody';

/**
 * Props:
 *   - map:         google.maps.Map
 *   - position:    { lat: number, lng: number }
 *   - post:        { id, title, message, category, … } OR undefined if MAKE_POST
 *   - mode:        one of INFO_WINDOW_MODE.{MINIMIZED, EXPANDED, MAKE_POST}
 *   - onClick:     callback when minimized window is clicked
 *   - onClose:     callback to close expanded window
 *   - onSave:      callback to save new post (in MAKE_POST mode)
 *   - onFavorite:  callback to favorite a post (in EXPANDED mode)
 *   - isFavorited: boolean, whether the post is currently favorited
 *   - className:   optional additional CSS class for the wrapper
 *   - style:       optional inline style for the wrapper
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
  const overlayRef   = useRef(null);   // Will hold the OverlayView instance
  const wrapperRef   = useRef(null);   // Will be the <div> that React renders into
  const reactRootRef = useRef(null);   // Holds React Root for rendering into wrapper

  // ── 1) Create wrapper <div> & React root ONCE
  useEffect(() => {
    // Create a <div> to hold our InfoWindow content:
    const wrapper = document.createElement('div');
    wrapper.className = `custom-info-window ${className}`;

    // Save it in a ref so we can pass it to FullWidthOverlay later
    wrapperRef.current = wrapper;

    // Create a React root so we can call root.render(...) at will:
    reactRootRef.current = ReactDOM.createRoot(wrapper);

    return () => {
      // Cleanup: unmount React from that wrapper <div> when CustomInfoWindow unmounts
      const r = reactRootRef.current;
      if (r) {
        Promise.resolve().then(() => r.unmount());
      }
      reactRootRef.current = null;
      wrapperRef.current = null;
    };
  }, [className]);

  // ── 2) Render inner content whenever mode, post, or callbacks change
  useEffect(() => {
    if (!reactRootRef.current) return;

    let contentNode;
    if (mode === INFO_WINDOW_MODE.MAKE_POST) {
      contentNode = <MakePostBody onClose={onClose} onSave={onSave} />;
    } else if (mode === INFO_WINDOW_MODE.EXPANDED) {
      contentNode = (
        <ExpandedPostBody
          post={post}
          onClose={onClose}
          onFavorite={onFavorite}
          isFavorited={isFavorited}
        />
      );
    } else {
      // MINIMIZED: Just show the title (we attach the click listener to the wrapper)
      contentNode = (
        <div
          style={{
            cursor: 'pointer',
            userSelect: 'none',
            padding: '0 4px',
            whiteSpace: 'nowrap',
          }}
        >
          <strong>{post.title}</strong>
        </div>
      );
    }

    reactRootRef.current.render(contentNode);
  }, [mode, post, onClose, onSave, onFavorite, isFavorited]);

  // ── 3) Update wrapper styles + click listener whenever mode/post/style change
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // Decide border color from category or default:
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

    // If minimized, clicking anywhere on this wrapper should expand:
    function handleWrapperClick() {
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

  // ── 4) (Re)mount or remove the FullWidthOverlay whenever map or position change
  useEffect(() => {
    // If an existing overlay is already on the map, remove it first
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }

    // Only create a new overlay if map & position & wrapper are all ready
    if (map && position && wrapperRef.current) {
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

  return null; // This component does not render into the normal React DOM tree
}