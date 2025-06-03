// src/Components/FullWidthOverlay.js

/**
 * A factory that returns a google.maps.OverlayView which:
 *   – Appends `wrapperElement` into the floatPane.
 *   – Measures the map’s width and wrapper’s height, then positions
 *     the wrapper so that its BOTTOM‐CENTER is slightly ABOVE the marker tip.
 *
 * Usage:
 *   const overlay = FullWidthOverlay(map, positionLatLng, wrapperDiv);
 *   // The constructor already calls overlay.setMap(map) → onAdd() → draw().
 *   // To remove: overlay.setMap(null).
 *
 * @param {google.maps.Map} map        
 * @param {{lat: number, lng: number}} position 
 * @param {HTMLElement} wrapperElement  
 * @returns {google.maps.OverlayView}
 */
export default function FullWidthOverlay(map, position, wrapperElement) {
  if (!map || !window.google || !window.google.maps) {
    throw new Error("Google Maps JS API not loaded yet");
  }

  const overlay = new window.google.maps.OverlayView();

  // Save these for onAdd/draw/onRemove:
  overlay._position = position;      // lat/lng literal
  overlay._wrapper = wrapperElement; // React’s <div> for the info window

  // onAdd: append wrapper into the floatPane:
  overlay.onAdd = function () {
    const panes = this.getPanes();
    if (panes && panes.floatPane) {
      this._wrapper.style.position = "absolute";
      this._wrapper.style.boxSizing = "border-box";
      panes.floatPane.appendChild(this._wrapper);
    }
  };

  // draw: measure and position wrapper
  overlay.draw = function () {
    const projection = this.getProjection();
    if (!projection) return;

    // Convert lat/lng → pixel
    const latLng = new window.google.maps.LatLng(
      this._position.lat,
      this._position.lng
    );
    const point = projection.fromLatLngToDivPixel(latLng);
    if (!point) return;

    // How wide is the map container?
    const mapDiv = map.getDiv();
    const mapWidth = mapDiv.offsetWidth || 0;

    // How tall is our wrapper? (React has just rendered into it.)
    const wrapperEl = this._wrapper;
    const wrapperHeight = wrapperEl.offsetHeight || 0;

    // Tweak: shift the bottom‐center of the wrapper UP by Δ pixels,
    // so the marker pin (which sits at exactly (point.x, point.y)) is no longer hidden.
    // Δ should roughly equal the height of your marker icon. Here we use 24px as an example.
    const markerIconHeight = 15; // ← adjust this number to match your actual pin graphic’s height

    // Set the wrapper’s width (full map width minus optional margins)
    const desiredWidth = mapWidth; // or `mapWidth - 32` if you want 16px side margins
    wrapperEl.style.width = `${desiredWidth}px`;

    // Position left so that the wrapper is centered horizontally at point.x:
    const left = point.x - desiredWidth / 2;
    wrapperEl.style.left = `${left}px`;

    // Position top so that the wrapper’s BOTTOM is at (point.y - markerIconHeight):
    // that is: top = (point.y - markerIconHeight) - wrapperHeight
    const top = point.y - markerIconHeight - wrapperHeight;
    wrapperEl.style.top = `${top}px`;
  };

  // onRemove: clean up the DOM
  overlay.onRemove = function () {
    if (this._wrapper && this._wrapper.parentNode) {
      this._wrapper.parentNode.removeChild(this._wrapper);
    }
  };

  // Attach to map right away:
  overlay.setMap(map);
  return overlay;
}