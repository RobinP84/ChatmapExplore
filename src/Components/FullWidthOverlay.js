// src/Components/FullWidthOverlay.js

export default function FullWidthOverlay(map, position, containerEl) {
  if (!window.google?.maps) {
    throw new Error("Google Maps JS API not loaded yet");
  }

  const overlay = new window.google.maps.OverlayView();
  overlay.position    = position;
  overlay.containerEl = containerEl;  // ALWAYS an HTMLElement

  overlay.onAdd = function () {
    const c = this.containerEl;
    c.style.position  = "absolute";
    c.style.boxSizing = "border-box";
    this.getPanes().floatPane.appendChild(c);
  };

  overlay.draw = function () {
    const proj   = this.getProjection();
    const pix    = proj.fromLatLngToDivPixel(
      new window.google.maps.LatLng(this.position.lat, this.position.lng)
    );
    const width  = map.getDiv().offsetWidth;
    Object.assign(this.containerEl.style, {
      width: `${width}px`,
      left:  `${pix.x - width/2}px`,
      top:   `${pix.y}px`,
    });
  };

  overlay.onRemove = function () {
    const c = this.containerEl;
    if (c.parentNode) c.parentNode.removeChild(c);
  };

  overlay.setMap(map);
  return overlay;
}