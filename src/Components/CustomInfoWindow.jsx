// src/Components/CustomInfoWindow.jsx

import { useEffect, useRef } from 'react';
import { createRoot }         from 'react-dom/client';
import FullWidthOverlay       from './FullWidthOverlay';
import { CATEGORY_COLORS }    from '../constants/categoryColors';

export default function CustomInfoWindow({
  map,
  position,
  children,
  onClose,
  className = '',
  category,
  style     = {},
}) {
  const overlayRef   = useRef(null);
  const wrapperRef   = useRef(null);
  const reactRootRef = useRef(null);

  // ── 1) Create the wrapper <div> and React root ONCE
  useEffect(() => {
    const wrapper = document.createElement('div');
    wrapperRef.current = wrapper;

    // mount a React root into it
    reactRootRef.current = createRoot(wrapper);

    return () => {
      // Defer unmount until after React’s render has completed
     const root = reactRootRef.current;
     Promise.resolve().then(() => {
       root.unmount();
     });
     reactRootRef.current = null;
    };
  }, []);  // no dependencies: runs only mount & unmount

  // ── 2) Render (or re-render) children whenever they change
  useEffect(() => {
    if (reactRootRef.current) {
      reactRootRef.current.render(children);
    }
  }, [children]);

  // ── 3) Update wrapper’s className & inline styles when styling props change
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // update CSS classes
    wrapper.className = `custom-info-window ${className}`;

    // pick the right border color
    const borderColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.default;

    // merge into inline styles
    Object.assign(wrapper.style, {
      border: `2px solid ${borderColor}`,
      ...style,
    });
  }, [className, category, style]);

  // ── 4) Create/cleanup the Google Overlay when map/position/onClose change
  useEffect(() => {
    // remove any old overlay
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }

    if (map && position && wrapperRef.current) {
      // pass the *actual* HTMLElement into the overlay
      overlayRef.current = FullWidthOverlay(
        map,
        { lat: position.lat, lng: position.lng },
        wrapperRef.current
      );

      // wire up your “×” button if you passed onClose
      if (onClose) {
        const btn = wrapperRef.current.querySelector('.close-btn');
        if (btn) btn.addEventListener('click', onClose);
      }
    }

    return () => {
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    };
  }, [map, position, onClose]);

  return null;
}