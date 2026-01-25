import { useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

function AdvancedMarker({ map, position, children, onClick, onMouseEnter, onMouseLeave }) {
  const rootRef = useRef(null);
  const markerRef = useRef(null);

  // Initialization effect: create container, React root, and marker instance
  useEffect(() => {
    if (!rootRef.current) {
      const container = document.createElement("div");
      // Create a React root for dynamic rendering of children
      rootRef.current = createRoot(container);

      // Create the AdvancedMarkerElement with the container as content.
      // We initially set the map to null; it will be updated in the next effect.
      markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
        position,
        content: container,
        map: null,
      });
    }
    // Cleanup: remove the marker from the map when unmounting
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, []);

  // Update effect: render new children, update position, map, and add click listener
  useEffect(() => {
    if (!rootRef.current || !markerRef.current) return;

    // Dynamically render children (can be any React element)
    rootRef.current.render(children);

    // Update marker's position and map assignment on every change
    markerRef.current.position = position;
    markerRef.current.map = map;

    // Attach the onClick listener to the marker using 'gmp-click'
    const listeners = [];
    if (onClick) {
      listeners.push(markerRef.current.addListener("gmp-click", onClick));
    }
    if (onMouseEnter) {
      listeners.push(markerRef.current.addListener("gmp-mouseenter", onMouseEnter));
    }
    if (onMouseLeave) {
      listeners.push(markerRef.current.addListener("gmp-mouseleave", onMouseLeave));
    }

    // Cleanup: remove the listener when dependencies change
    return () => listeners.forEach((l) => l.remove());
  }, [map, position, children, onClick, onMouseEnter, onMouseLeave]);

  return null;
}

export default AdvancedMarker;
