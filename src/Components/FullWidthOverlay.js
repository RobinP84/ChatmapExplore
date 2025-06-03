/**
 * FullWidthOverlay is a thin factory function that returns a google.maps.OverlayView.
 *
 *   • onAdd(): appends `wrapperElement` into the map’s floatPane
 *   • draw():  measures the wrapper’s offsetHeight (React content) and
 *             the map’s offsetWidth, then positions the wrapper so that
 *             its bottom‐center sits just **above** the pin’s tip (markerIconHeight).
 *   • onRemove(): removes the wrapper from the DOM.
 *
 * Usage:
 *   const overlay = FullWidthOverlay(map, {lat, lng}, wrapperDiv);
 *   // That calls overlay.setMap(map) → onAdd() → draw() immediately.
 *   // To remove: overlay.setMap(null).
 *
 * @param {google.maps.Map} map        
 * @param {{lat: number, lng: number}} position 
 * @param {HTMLElement} wrapperElement  
 * @returns {google.maps.OverlayView}
 */
export default function FullWidthOverlay(map, position, wrapperElement) {
  if (!map || !window.google || !window.google.maps) {
    throw new Error('Google Maps JS API not loaded yet');
  }

  const overlay = new window.google.maps.OverlayView();

  // Save these so onAdd/draw/onRemove can see them:
  overlay._position = position;      // { lat: number, lng: number }
  overlay._wrapper = wrapperElement; // the <div> we just rendered React into

  // Called automatically once you do overlay.setMap(map):
  overlay.onAdd = function () {
    const panes = this.getPanes();
    if (panes && panes.floatPane) {
      // Ensure the wrapper is absolutely positioned:
      this._wrapper.style.position = 'absolute';
      this._wrapper.style.boxSizing = 'border-box';
      panes.floatPane.appendChild(this._wrapper);
    }
  };

  // Called whenever Google Maps thinks we should re‐draw:
  overlay.draw = function () {
    const projection = this.getProjection();
    if (!projection) return;

    // Convert lat/lng → pixel:
    const latLng = new window.google.maps.LatLng(
      this._position.lat,
      this._position.lng
    );
    const point = projection.fromLatLngToDivPixel(latLng);
    if (!point) return;

    // How wide is the map container?
    const mapDiv = map.getDiv();
    const mapWidth = mapDiv.offsetWidth || 0;

    // How tall is our wrapper? (React has just flushed into it.)
    const wrapperEl = this._wrapper;
    const wrapperHeight = wrapperEl.offsetHeight || 0;

    // SHIFT: you want the bottom‐center of the wrapper to sit just above
    //        the pin tip. If your pin graphic is, say, 24px tall, choose
    //        something like markerIconHeight = 15–20 so the tip pokes out.
    const markerIconHeight = 15;

    // Set the wrapper’s width. If you want side‐margins, do e.g. `mapWidth - 32`.
    const desiredWidth = mapWidth;
    wrapperEl.style.width = `${desiredWidth}px`;

    // Left: center horizontally at point.x:
    const left = point.x - desiredWidth / 2;
    wrapperEl.style.left = `${left}px`;

    // Top: (point.y - markerIconHeight) is where the pin tip sits.
    //      We want the wrapper’s bottom aligned there, so top = (point.y - markerIconHeight - wrapperHeight).
    const top = point.y - markerIconHeight - wrapperHeight;
    wrapperEl.style.top = `${top}px`;
  };

  // Called whenever you do overlay.setMap(null):
  overlay.onRemove = function () {
    if (this._wrapper && this._wrapper.parentNode) {
      this._wrapper.parentNode.removeChild(this._wrapper);
    }
  };

  // Finally, attach to the map (this triggers onAdd() → draw()):
  overlay.setMap(map);
  return overlay;
}