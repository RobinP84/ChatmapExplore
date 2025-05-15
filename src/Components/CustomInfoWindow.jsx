import { useEffect, useRef } from 'react';
import { createRoot }       from 'react-dom/client';
import FullWidthOverlay     from './FullWidthOverlay.js';

export default function CustomInfoWindow({
  map,
  position,
  children,
  onClose,
  className = '',
  style     = {},
}) {
  const overlayRef   = useRef(null);
  const wrapperRef   = useRef(null);
  const reactRootRef = useRef(null);

  // 1) Build our wrapper and React root once
  useEffect(() => {
    const wrapper = document.createElement('div');
    wrapper.className = `custom-info-window ${className}`;
    Object.assign(wrapper.style, style);
    wrapperRef.current = wrapper;

    const root = createRoot(wrapper);
    reactRootRef.current = root;

    // cleanup scheduled async so we don't unmount during render
    return () => {
      Promise.resolve().then(() => {
        root.unmount();
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
    // remove old overlay
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }

    if (map && position && wrapperRef.current) {
      overlayRef.current = FullWidthOverlay(
        map,
        { lat: position.lat, lng: position.lng },
        wrapperRef.current.outerHTML
      );

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