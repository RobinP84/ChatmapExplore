/**
 * FullWidthOverlay is a thin subclass of google.maps.OverlayView.
 *   – We append your `wrapperElement` into the map’s floatPane.
 *   – Each time draw() is called, we measure:
 *       • the wrapper’s offsetHeight  (the info window’s height)
 *       • the map container’s offsetWidth
 *     then position the wrapper so that its bottom edge sits
 *     just above the pin tip (allowing the pin tip to be visible).
 *
 * Usage:
 *   const overlay = FullWidthOverlay(map, {lat, lng}, wrapperDiv);
 *   // That immediately does setMap(map) => onAdd() => draw().
 *   // To remove, call overlay.setMap(null).
 */

export default function FullWidthOverlay(map, position, wrapperElement) {
  if (!map || !window.google || !window.google.maps) {
    throw new Error('Google Maps JS API not loaded yet');
  }

  const overlay = new window.google.maps.OverlayView();

  // Save these so that onAdd/draw/onRemove can access them:
  overlay._position = position;      // { lat: number, lng: number }
  overlay._wrapper = wrapperElement; // the <div> containing your React content

  // onAdd(): append the wrapper <div> into the floatPane
  overlay.onAdd = function () {
    const panes = this.getPanes();
    if (panes && panes.floatPane) {
      this._wrapper.style.position = 'absolute';
      this._wrapper.style.boxSizing = 'border-box';
      panes.floatPane.appendChild(this._wrapper);
    }
  };

  // draw(): measure + position wrapper
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

    // How wide is the map container?
    const mapDiv = map.getDiv();
    const mapWidth = mapDiv.offsetWidth || 0;

    // How tall is our wrapper (React has just rendered into it)?
    const wrapperEl = this._wrapper;
    const wrapperHeight = wrapperEl.offsetHeight || 0;

    // HOW FAR UP ABOVE the pin tip? ⇒ Customize this to match your pin’s actual height.
    // If your pin icon is, say, 24px tall, putting markerIconHeight = 15–20 ensures the tip peeks.
    const markerIconHeight = 15;

    // Set wrapper’s width. If you want a margin, do: mapWidth - 32 (for 16px each side).
    const desiredWidth = mapWidth;
    wrapperEl.style.width = `${desiredWidth}px`;

    // Position left so wrapper’s center aligns with point.x:
    const left = point.x - desiredWidth / 2;
    wrapperEl.style.left = `${left}px`;

    // Position top so that wrapper’s BOTTOM is at (point.y - markerIconHeight):
    const top = point.y - markerIconHeight - wrapperHeight;
    wrapperEl.style.top = `${top}px`;
  };

  // onRemove(): take wrapper off the DOM
  overlay.onRemove = function () {
    if (this._wrapper && this._wrapper.parentNode) {
      this._wrapper.parentNode.removeChild(this._wrapper);
    }
  };

  // Finally, attach to the map (invokes onAdd + draw):
  overlay.setMap(map);
  return overlay;
}