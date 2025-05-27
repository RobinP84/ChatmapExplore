import { useEffect, useRef } from 'react';
import { createRoot }         from 'react-dom/client';
import FullWidthOverlay       from './FullWidthOverlay.js';
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

  // 1) Build our wrapper and React root once
  useEffect(() => {
    const wrapper = document.createElement('div');
    wrapper.className = `custom-info-window ${className}`;

    // look up the right border color (fall back to default)
    const borderColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.default;

    // merge your dynamic border + any other styles passed in
    Object.assign(wrapper.style, {
      border: `2px solid ${borderColor}`,
      ...style
    });

    wrapperRef.current = wrapper;
    reactRootRef.current = createRoot(wrapper);

    // cleanup on unmount
    return () => {
      Promise.resolve().then(() => {
        reactRootRef.current.unmount();
        reactRootRef.current = null;
      });
    };
  }, []);  // run only on mount/unmount

  // 2) Re-render the children whenever they change
  useEffect(() => {
    if (reactRootRef.current && wrapperRef.current) {
      reactRootRef.current.render(children);
    }
  }, [children]);

  // 3) Tear down & remake the Google Overlay whenever map/position changes
  useEffect(() => {
    // clean up previous
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }

    if (map && position && wrapperRef.current) {
      // inject the HTML string of our styled wrapper
      overlayRef.current = FullWidthOverlay(
        map,
        { lat: position.lat, lng: position.lng },
        wrapperRef.current.outerHTML
      );

      // wire up onClose, if provided
      if (onClose) {
        setTimeout(() => {
          const btn = wrapperRef.current.querySelector('.close-btn');
          if (btn) btn.addEventListener('click', onClose);
        }, 0);
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