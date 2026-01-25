/**
 * FullWidthOverlay is a factory that returns a google.maps.OverlayView.
 *
 *   - onAdd(): appends `wrapperElement` into the map's floatPane
 *   - draw(): measures the wrapper's size and positions it relative to the marker
 *   - onRemove(): removes the wrapper from the DOM.
 *
 * Usage:
 *   const overlay = FullWidthOverlay(map, {lat, lng}, wrapperDiv);
 *   overlay.setMap(map); // triggers onAdd() then draw()
 *   overlay.setMap(null); // removes
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
  overlay._position = position; // { lat: number, lng: number }
  overlay._wrapper = wrapperElement; // the <div> we just rendered React into

  // Called automatically once you do overlay.setMap(map):
  overlay.onAdd = function () {
    const panes = this.getPanes();
    if (panes) {
      const targetPane = panes.overlayMouseTarget || panes.floatPane || panes.overlayLayer;
      if (targetPane) {
        // Ensure the wrapper is absolutely positioned:
        this._wrapper.style.position = 'absolute';
        this._wrapper.style.boxSizing = 'border-box';
        this._wrapper.style.pointerEvents = 'auto';
        this._wrapper.style.touchAction = 'manipulation';
        targetPane.appendChild(this._wrapper);
      }
    }
  };

  // Called whenever Google Maps thinks we should redraw:
  overlay.draw = function () {
    const projection = this.getProjection();
    if (!projection) return;

    // Convert lat/lng to pixel:
    const latLng = new window.google.maps.LatLng(
      this._position.lat,
      this._position.lng
    );
    const point = projection.fromLatLngToDivPixel(latLng);
    if (!point) return;

    // How wide is the map container?
    const mapDiv = map.getDiv();
    const mapWidth = mapDiv.offsetWidth || 0;

    const wrapperEl = this._wrapper;
    const fullWidth = wrapperEl.dataset?.fullWidth === 'true';
    const clampToBounds = wrapperEl.dataset?.clampToBounds === 'true';

    // Position the wrapper so its bottom-center sits just above the pin tip.
    const markerIconHeight = 20;
    const labelGap = 26; // extra space between the marker triangle and the headline

    // Width: full map for expanded/make-post; natural width for minimized.
    if (!fullWidth) {
      // Clamp to container width but let content dictate size
      const naturalWidth = Math.min(
        wrapperEl.scrollWidth || wrapperEl.offsetWidth || 0,
        mapWidth
      );
      wrapperEl.style.width = 'auto';
      wrapperEl.style.maxWidth = `${mapWidth}px`;
      // If we measured a natural width, set it to avoid layout jumps
      if (naturalWidth) {
        wrapperEl.style.width = `${naturalWidth}px`;
      }
    } else {
      wrapperEl.style.width = `${mapWidth}px`;
      wrapperEl.style.maxWidth = 'none';
    }

    const baseOffsetX = Number(wrapperEl.dataset?.baseOffsetX || wrapperEl.dataset?.offsetX || 0);
    const baseOffsetY = Number(wrapperEl.dataset?.baseOffsetY || wrapperEl.dataset?.offsetY || 0);

    const wrapperWidth = wrapperEl.offsetWidth || 0;
    let centerX = point.x + baseOffsetX;

    if (clampToBounds && wrapperWidth > 0 && mapWidth > 0) {
      const halfWidth = wrapperWidth / 2;
      let minCenter = halfWidth;
      let maxCenter = mapWidth - halfWidth;
      if (maxCenter < minCenter) {
        const middle = mapWidth / 2;
        minCenter = middle;
        maxCenter = middle;
      }
      centerX = Math.min(Math.max(centerX, minCenter), maxCenter);
    }

    const appliedOffsetX = centerX - point.x;
    wrapperEl.dataset.offsetX = appliedOffsetX;
    wrapperEl.style.left = `${centerX}px`;
    wrapperEl.style.transform = 'translateX(-50%)';

    // Height after width adjustments:
    const wrapperHeight = wrapperEl.offsetHeight || 0;
    const appliedOffsetY = baseOffsetY;
    wrapperEl.dataset.offsetY = appliedOffsetY;
    // Top: align bottom of wrapper just above the marker tip, with optional nudge.
    const top = point.y - markerIconHeight - labelGap - wrapperHeight + appliedOffsetY;
    wrapperEl.style.top = `${top}px`;
  };

  // Called whenever you do overlay.setMap(null):
  overlay.onRemove = function () {
    if (this._wrapper && this._wrapper.parentNode) {
      this._wrapper.parentNode.removeChild(this._wrapper);
    }
  };

  // Finally, attach to the map (this triggers onAdd() then draw()):
  overlay.setMap(map);
  return overlay;
}
