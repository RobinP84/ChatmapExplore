// src/Components/FullWidthOverlay.js

/**
 * A factory function that creates a `google.maps.OverlayView` which:
 *  1. Appends your `wrapperElement` into the floatPane.
 *  2. Computes the map’s width and the wrapper’s height, then positions
 *     the wrapper so that its BOTTOM center matches the marker location.
 *
 * Usage:
 *   const overlay = FullWidthOverlay(map, positionLatLng, wrapperDiv);
 *   // That automatically calls overlay.setMap(map), so Google Maps calls onAdd() → draw().
 *   // To remove later: overlay.setMap(null).
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

  // Save these for use inside onAdd/draw/onRemove:
  overlay._position = position;         // { lat: number, lng: number }
  overlay._wrapper = wrapperElement;    // The <div> into which CustomInfoWindow rendered React content

  // Called when the overlay is first added to the map: add the wrapper <div> to the pane.
  overlay.onAdd = function () {
    const panes = this.getPanes();
    if (panes && panes.floatPane) {
      // Ensure the wrapper is absolutely positioned:
      this._wrapper.style.position = "absolute";
      this._wrapper.style.boxSizing = "border-box";
      panes.floatPane.appendChild(this._wrapper);
    }
  };

  // Called each time the map “needs redraw”: position & size the wrapper.
  overlay.draw = function () {
    const projection = this.getProjection();
    if (!projection) return;

    // Convert LatLng → pixel coordinates
    const latLng = new window.google.maps.LatLng(
      this._position.lat,
      this._position.lng
    );
    const point = projection.fromLatLngToDivPixel(latLng);
    if (!point) return;

    // Compute how wide the map container is:
    const mapDiv = map.getDiv();             // e.g. <div class="gm-style">…</div>
    const mapWidth = mapDiv.offsetWidth || 0;

    // Now measure the wrapper’s height (after React has rendered into it)
    const wrapperEl = this._wrapper;
    const wrapperHeight = wrapperEl.offsetHeight || 0;

    // Set wrapper width (you can remove the “-32” if you want true edge‐to‐edge):
    const desiredWidth = mapWidth;
    wrapperEl.style.width = `${desiredWidth}px`;

    // Position so that the BOTTOM‐CENTER of the wrapper sits at (point.x, point.y):
    const left = point.x - desiredWidth / 2;
    const top = point.y - wrapperHeight;

    wrapperEl.style.left = `${left}px`;
    wrapperEl.style.top = `${top}px`;
  };

  // Called when .setMap(null) is used: remove wrapper from DOM
  overlay.onRemove = function () {
    if (this._wrapper && this._wrapper.parentNode) {
      this._wrapper.parentNode.removeChild(this._wrapper);
    }
  };

  // Finally, attach it to the map (this triggers onAdd() → draw())
  overlay.setMap(map);

  return overlay;
}